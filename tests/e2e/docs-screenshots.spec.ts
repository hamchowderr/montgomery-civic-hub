/**
 * Playwright script to capture screenshots for Mintlify documentation.
 *
 * Run: npx playwright test docs-screenshots
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000  (npm run dev)
 *   - ArcGIS data loads client-side, so run locally (not CI)
 *
 * Output: docs/images/*.png  (referenced by MDX files)
 */

import path from "node:path";
import { test } from "@playwright/test";

const IMAGES_DIR = path.resolve(__dirname, "../../docs/images");

// Increase default timeout — ArcGIS data can be slow
test.setTimeout(90_000);

// Shared helpers ──────────────────────────────────────────────────────────────

/** Dismiss CopilotKit web inspector (Shadow DOM toast) and Sonner toasts */
async function dismissToasts(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    // CopilotKit renders its "now live" toast inside a Shadow DOM web component
    document.querySelectorAll("cpk-web-inspector").forEach((el) => el.remove());
    // Also remove Sonner toasts
    document.querySelectorAll("[data-sonner-toast]").forEach((el) => el.remove());
    const toaster = document.querySelector("[data-sonner-toaster]");
    if (toaster) (toaster as HTMLElement).remove();
  });
}

/** Wait for ArcGIS map data to finish loading (or timeout gracefully) */
async function waitForMapData(page: import("@playwright/test").Page, timeoutMs = 15_000) {
  try {
    // Wait for "Loading map data..." text to disappear
    await page.locator("text=Loading map data").waitFor({ state: "hidden", timeout: timeoutMs });
  } catch {
    // If it doesn't disappear, continue anyway — we'll get what we can
  }
  // Extra settle time for map tiles to render
  await page.waitForTimeout(1500);
}

/** Navigate to a portal page, wait for data, dismiss toasts, screenshot */
async function capturePortal(
  page: import("@playwright/test").Page,
  route: string,
  filename: string,
  opts: { waitMs?: number; fullPage?: boolean; waitForMap?: boolean } = {},
) {
  await page.goto(route, { waitUntil: "domcontentloaded" });

  if (opts.waitForMap !== false) {
    await waitForMapData(page);
  } else {
    await page.waitForTimeout(opts.waitMs ?? 5000);
  }

  await dismissToasts(page);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(IMAGES_DIR, filename),
    fullPage: opts.fullPage ?? false,
  });
}

/** Navigate to a non-portal page (no map wait needed) */
async function capturePage(
  page: import("@playwright/test").Page,
  route: string,
  filename: string,
  opts: { waitMs?: number; fullPage?: boolean; scrollTo?: string } = {},
) {
  await page.goto(route, { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(opts.waitMs ?? 3500);

  if (opts.scrollTo) {
    await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      el?.scrollIntoView({ behavior: "instant", block: "start" });
    }, opts.scrollTo);
    await page.waitForTimeout(500);
  }

  await dismissToasts(page);

  await page.screenshot({
    path: path.join(IMAGES_DIR, filename),
    fullPage: opts.fullPage ?? false,
  });
}

// Remove CopilotKit web inspector (Shadow DOM toast) on every navigation
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      document.querySelectorAll("cpk-web-inspector").forEach((el) => el.remove());
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
});

// ─── Homepage ────────────────────────────────────────────────────────────────

test.describe("Homepage screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("hero section", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000); // animations
    await dismissToasts(page);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "homepage-hero.png"),
    });
  });

  test("portal grid", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      const el =
        document.querySelector("[data-section='portals']") ||
        Array.from(document.querySelectorAll("h2")).find((h) =>
          h.textContent?.toLowerCase().includes("portal"),
        );
      el?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await page.waitForTimeout(1500);
    await dismissToasts(page);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "homepage-portals.png"),
    });
  });

  test("how it works", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h2")).find((h) =>
        h.textContent?.toLowerCase().includes("how it works"),
      );
      el?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await page.waitForTimeout(2000);
    await dismissToasts(page);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "homepage-how-it-works.png"),
    });
  });
});

// ─── Resident Portal ─────────────────────────────────────────────────────────

test.describe("Resident Portal screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("main dashboard — map view", async ({ page }) => {
    await capturePortal(page, "/resident", "resident-dashboard.png");
  });

  test("table view", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    const tableTab = page.locator('[data-tour-step-id="resident-table-view"]');
    if (await tableTab.isVisible()) {
      await tableTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: path.join(IMAGES_DIR, "resident-table.png"),
    });
  });

  test("chart view", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    const chartTab = page.locator('[data-tour-step-id="resident-chart-view"]');
    if (await chartTab.isVisible()) {
      await chartTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: path.join(IMAGES_DIR, "resident-chart.png"),
    });
  });

  test("city pulse", async ({ page }) => {
    await capturePortal(page, "/resident/city-pulse", "resident-city-pulse.png", {
      waitForMap: false,
      waitMs: 5000,
    });
  });

  test("311 newsfeed", async ({ page }) => {
    await capturePortal(page, "/resident/newsfeed", "resident-newsfeed.png", {
      waitForMap: false,
      waitMs: 5000,
    });
  });

  test("emergency contacts", async ({ page }) => {
    await capturePortal(page, "/resident/emergency", "resident-emergency.png", {
      waitForMap: false,
      waitMs: 3000,
    });
  });
});

// ─── Business Portal ─────────────────────────────────────────────────────────

test.describe("Business Portal screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("main dashboard", async ({ page }) => {
    await capturePortal(page, "/business", "business-dashboard.png");
  });

  test("vacant land explorer", async ({ page }) => {
    await capturePortal(page, "/business/vacant-land", "business-vacant-land.png");
  });
});

// ─── City Staff Portal ───────────────────────────────────────────────────────

test.describe("City Staff Portal screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("main dashboard", async ({ page }) => {
    await capturePortal(page, "/citystaff", "citystaff-dashboard.png");
  });

  test("MPD staffing dashboard", async ({ page }) => {
    await capturePortal(page, "/citystaff/staffing", "citystaff-staffing.png", {
      waitForMap: false,
      waitMs: 5000,
    });
  });
});

// ─── Researcher Portal ───────────────────────────────────────────────────────

test.describe("Researcher Portal screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("main dashboard", async ({ page }) => {
    await capturePortal(page, "/researcher", "researcher-dashboard.png");
  });

  test("civil rights timeline", async ({ page }) => {
    await capturePortal(page, "/researcher/civil-rights", "researcher-civil-rights.png", {
      waitForMap: false,
      waitMs: 5000,
      fullPage: true,
    });
  });

  test("demographics dashboard", async ({ page }) => {
    await capturePortal(page, "/researcher/demographics", "researcher-demographics.png", {
      waitForMap: false,
      waitMs: 5000,
    });
  });
});

// ─── Executive Portal ────────────────────────────────────────────────────────

test.describe("Executive Portal screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("executive dashboard", async ({ page }) => {
    await page.goto("/executive", { waitUntil: "commit", timeout: 60_000 });
    await page.waitForTimeout(12_000);
    await dismissToasts(page);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "executive-dashboard.png"),
    });
  });
});

// ─── Insights Portal ─────────────────────────────────────────────────────────

test.describe("Insights Portal screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("insights dashboard — overview", async ({ page }) => {
    await page.goto("/insights", { waitUntil: "commit", timeout: 60_000 });
    // Wait for loading indicator to appear first, then disappear
    const loadingText = page.locator("text=Loading cross-district data");
    try {
      await loadingText.waitFor({ state: "visible", timeout: 15_000 });
      await loadingText.waitFor({ state: "hidden", timeout: 60_000 });
    } catch {
      // ArcGIS data may not load in headless — continue with whatever rendered
    }
    await page.waitForTimeout(3000);
    await dismissToasts(page);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "insights-dashboard.png"),
    });
  });
});

// ─── Feature screenshots (captured from Resident portal) ────────────────────

test.describe("Feature screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("AI chat panel", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    const chatPanel = page.locator('[data-tour-step-id="resident-chat"]');
    if (await chatPanel.isVisible()) {
      await chatPanel.screenshot({
        path: path.join(IMAGES_DIR, "feature-ai-chat.png"),
      });
    } else {
      await page.screenshot({
        path: path.join(IMAGES_DIR, "feature-ai-chat.png"),
      });
    }
  });

  test("interactive map", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    const mapTab = page.locator('[data-tour-step-id="resident-map-view"]');
    if (await mapTab.isVisible()) {
      await mapTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-interactive-map.png"),
    });
  });

  test("data table", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    const tableTab = page.locator('[data-tour-step-id="resident-table-view"]');
    if (await tableTab.isVisible()) {
      await tableTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-data-tables.png"),
    });
  });

  test("charts", async ({ page }) => {
    await page.goto("/researcher", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    const chartTab = page.locator('[data-tour-step-id="researcher-chart-view"]');
    if (await chartTab.isVisible()) {
      await chartTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-charts.png"),
    });
  });

  test("year filter", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-year-filter.png"),
    });
  });

  test("council districts overlay", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    // Try to toggle council districts
    const districtBtn = page.locator("button", { hasText: "Districts" });
    if (await districtBtn.isVisible()) {
      await districtBtn.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-council-districts.png"),
    });
  });

  test("dark mode", async ({ page }) => {
    await page.goto("/resident", { waitUntil: "domcontentloaded" });
    await waitForMapData(page);
    await dismissToasts(page);

    // Light mode
    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-dark-mode-light.png"),
    });

    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "feature-dark-mode-dark.png"),
    });
  });

  test("onboarding tour", async ({ page }) => {
    await capturePage(page, "/onboarding", "feature-onboarding-tour.png", {
      waitMs: 3000,
    });
  });
});

// ─── Mobile & Tablet responsive ─────────────────────────────────────────────

test.describe("Mobile screenshots", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile — resident portal", async ({ page }) => {
    await capturePortal(page, "/resident", "mobile-resident.png");
  });

  test("mobile — homepage", async ({ page }) => {
    await capturePage(page, "/", "mobile-homepage.png", { waitMs: 4000 });
  });
});

test.describe("Tablet screenshots", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("tablet — resident portal", async ({ page }) => {
    await capturePortal(page, "/resident", "tablet-resident.png");
  });
});

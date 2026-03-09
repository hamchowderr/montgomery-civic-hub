import { test, expect } from "@playwright/test";

const VIEWPORT = { width: 1440, height: 900 };

test.describe("Homepage visual review", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  });

  test("hero section", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: "screenshots/01-hero.png", fullPage: false });
  });

  test("stats section", async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "screenshots/02-stats.png",
      fullPage: false,
    });
  });

  test("live data showcase", async ({ page }) => {
    const section = page.locator("text=Live City Data").first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000); // wait for ArcGIS data to load
    await page.screenshot({
      path: "screenshots/03-live-data.png",
      fullPage: false,
    });
  });

  test("why montgomery section", async ({ page }) => {
    const section = page.locator("text=Why Montgomery").first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/04-why-montgomery.png",
      fullPage: false,
    });
  });

  test("interactive showcase section", async ({ page }) => {
    const section = page.locator("text=Interactive Showcase").first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/05-interactive-showcase.png",
      fullPage: false,
    });
  });

  test("interactive showcase - click feature card", async ({ page }) => {
    const section = page.locator("text=Interactive Showcase").first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click the first feature card (AI Civic Assistant)
    const firstCard = page.locator("text=AI Civic Assistant").first();
    await firstCard.click();
    await page.waitForTimeout(3000); // wait for chat animation
    await page.screenshot({
      path: "screenshots/06-showcase-chat-demo.png",
      fullPage: false,
    });
  });

  test("how it works section", async ({ page }) => {
    const section = page.locator("text=How It Works").first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/07-how-it-works.png",
      fullPage: false,
    });
  });

  test("cta and footer", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/08-cta-footer.png",
      fullPage: false,
    });
  });

  test("full page screenshot", async ({ page }) => {
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "screenshots/00-full-page.png",
      fullPage: true,
    });
  });
});

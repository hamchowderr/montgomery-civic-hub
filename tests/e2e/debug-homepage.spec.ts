import { test, expect } from "@playwright/test";

const VIEWPORT = { width: 1440, height: 900 };

test.describe("Homepage debug screenshots", () => {
  test("scroll through entire page slowly and screenshot each section", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Wait for initial animations
    await page.waitForTimeout(2000);

    // Hero
    await page.screenshot({ path: "screenshots/debug-01-hero.png" });

    // Scroll to stats
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/debug-02-stats.png" });

    // Scroll to live data
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "screenshots/debug-03-live-data.png" });

    // Scroll more through live data (charts)
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: "screenshots/debug-04-live-data-charts.png",
    });

    // Scroll to why montgomery
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/debug-05-why-montgomery.png" });

    // Scroll to interactive showcase
    const showcase = page.locator("text=Interactive Showcase").first();
    await showcase.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "screenshots/debug-06-showcase-grid.png" });

    // Click AI Civic Assistant card
    const chatCard = page.locator("text=AI Civic Assistant").first();
    await chatCard.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/debug-07-showcase-chat-start.png",
    });

    // Wait for chat typewriter to finish
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: "screenshots/debug-08-showcase-chat-done.png",
    });

    // Go back to showcase grid
    const backBtn = page.locator("text=Back to showcase").first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(500);
    }

    // Click map feature
    const mapCard = page.locator("text=Neighborhood Map").first();
    if (await mapCard.isVisible()) {
      await mapCard.click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: "screenshots/debug-09-showcase-map.png",
      });
    }

    // Go back and try table
    const backBtn2 = page.locator("text=Back to showcase").first();
    if (await backBtn2.isVisible()) {
      await backBtn2.click();
      await page.waitForTimeout(500);
    }
    const tableCard = page.locator("text=Service Request Data").first();
    if (await tableCard.isVisible()) {
      await tableCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: "screenshots/debug-10-showcase-table.png",
      });
    }

    // Go back and try chart
    const backBtn3 = page.locator("text=Back to showcase").first();
    if (await backBtn3.isVisible()) {
      await backBtn3.click();
      await page.waitForTimeout(500);
    }
    const chartCard = page.locator("text=Trend Analysis").first();
    if (await chartCard.isVisible()) {
      await chartCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: "screenshots/debug-11-showcase-chart.png",
      });
    }

    // Switch to Business portal tab
    const backBtn4 = page.locator("text=Back to showcase").first();
    if (await backBtn4.isVisible()) {
      await backBtn4.click();
      await page.waitForTimeout(500);
    }
    const businessTab = page.locator("button", { hasText: "Business" }).first();
    await businessTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "screenshots/debug-12-showcase-business.png",
    });

    // Scroll to How It Works
    const howItWorks = page.locator("text=How It Works").first();
    await howItWorks.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "screenshots/debug-13-how-it-works.png",
    });

    // Scroll through How It Works (scrollytelling)
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(800);
    await page.screenshot({
      path: "screenshots/debug-14-how-it-works-step2.png",
    });

    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(800);
    await page.screenshot({
      path: "screenshots/debug-15-how-it-works-step3.png",
    });

    // CTA and footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "screenshots/debug-16-cta-footer.png" });
  });
});

import { test, expect } from "@playwright/test";

test.describe("Showcase demo screenshots", () => {
  test.setTimeout(90000);

  test("capture all 4 demo types", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Scroll to Interactive Showcase
    const showcase = page.locator("text=Interactive Showcase").first();
    await showcase.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "screenshots/showcase-grid.png" });

    // Click AI Civic Assistant (chat demo)
    const chatCard = page.locator("text=AI Civic Assistant").first();
    await chatCard.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "screenshots/showcase-chat.png" });

    // Back to grid, click map
    const back1 = page.locator("text=Back to showcase").first();
    if (await back1.isVisible()) await back1.click();
    await page.waitForTimeout(500);
    const mapCard = page.locator("text=Neighborhood Map").first();
    if (await mapCard.isVisible()) {
      await mapCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "screenshots/showcase-map.png" });
    }

    // Back to grid, click table
    const back2 = page.locator("text=Back to showcase").first();
    if (await back2.isVisible()) await back2.click();
    await page.waitForTimeout(500);
    const tableCard = page.locator("text=Service Request Data").first();
    if (await tableCard.isVisible()) {
      await tableCard.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "screenshots/showcase-table.png" });
    }

    // Back to grid, click chart
    const back3 = page.locator("text=Back to showcase").first();
    if (await back3.isVisible()) await back3.click();
    await page.waitForTimeout(500);
    const chartCard = page.locator("text=Trend Analysis").first();
    if (await chartCard.isVisible()) {
      await chartCard.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "screenshots/showcase-chart.png" });
    }

    // Also screenshot with Business portal tab
    const back4 = page.locator("text=Back to showcase").first();
    if (await back4.isVisible()) await back4.click();
    await page.waitForTimeout(500);
    const businessTab = page.locator("button", { hasText: "Business" }).first();
    await businessTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "screenshots/showcase-business-grid.png" });
  });
});

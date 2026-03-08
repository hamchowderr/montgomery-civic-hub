import { test, expect } from "@playwright/test";

test.describe("Portal Navigation Smoke Tests", () => {
  test("resident portal loads and has chat input", async ({ page }) => {
    await page.goto("/resident");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();
  });

  test("business portal loads", async ({ page }) => {
    await page.goto("/business");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("citystaff portal loads", async ({ page }) => {
    await page.goto("/citystaff");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("researcher portal loads", async ({ page }) => {
    await page.goto("/researcher");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("portal nav links are present", async ({ page }) => {
    await page.goto("/resident");
    await expect(page.getByRole("link", { name: /resident/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /business/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /city staff/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /researcher/i })).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

test.describe("Auth navigation flow (unauthenticated)", () => {
  test("sign-up page stays on /sign-up (not redirected to onboarding)", async ({ page }) => {
    await page.goto("/sign-up");
    await page.waitForLoadState("domcontentloaded");

    // The critical assertion: unauthenticated users stay on /sign-up
    // They should NOT be redirected to /onboarding or /portal-redirect
    expect(page.url()).toContain("/sign-up");
    expect(page.url()).not.toContain("/onboarding");
    expect(page.url()).not.toContain("/portal-redirect");
  });

  test("sign-in page stays on /sign-in (not redirected to onboarding)", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).toContain("/sign-in");
    expect(page.url()).not.toContain("/onboarding");
    expect(page.url()).not.toContain("/portal-redirect");
  });

  test("homepage has a Create Account link pointing to /sign-up", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const createAccountLink = page.locator('a[href="/sign-up"]').first();
    await expect(createAccountLink).toBeVisible({ timeout: 10000 });
    expect(await createAccountLink.getAttribute("href")).toBe("/sign-up");
  });

  test("/portal-redirect sends unauthenticated users to /sign-in", async ({ page }) => {
    await page.goto("/portal-redirect");

    // Clerk client-side auth check + redirect may take a moment
    await page.waitForURL("**/sign-in**", { timeout: 15000 });
    expect(page.url()).toContain("/sign-in");
  });

  test("/onboarding renders all 4 portal selection cards", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("domcontentloaded");

    // Wait for React hydration — portal cards have data-testid attributes
    const portalCards = page.locator("[data-testid^='portal-card-']");
    await expect(portalCards).toHaveCount(4, { timeout: 10000 });

    for (const role of ["resident", "business", "citystaff", "researcher"]) {
      await expect(page.locator(`[data-testid="portal-card-${role}"]`)).toBeVisible();
    }
  });
});

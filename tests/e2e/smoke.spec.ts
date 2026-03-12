import { expect, test } from "@playwright/test";

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

test.describe("Chat Response Tests", () => {
  test("resident portal — neighborhood safety", async ({ page }) => {
    await page.goto("/resident");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();
    await chatInput.fill("neighborhood safety");
    await chatInput.press("Enter");
    await expect(page.getByText("12 percent reduction")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("business portal — permits near downtown", async ({ page }) => {
    await page.goto("/business");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();
    await chatInput.fill("permits near downtown");
    await chatInput.press("Enter");
    await expect(page.getByText("47 active building permits")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("citystaff portal — department budget", async ({ page }) => {
    await page.goto("/citystaff");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();
    await chatInput.fill("department budget");
    await chatInput.press("Enter");
    await expect(page.getByText("Public Works")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("researcher portal — crime trends", async ({ page }) => {
    await page.goto("/researcher");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();
    await chatInput.fill("crime trends");
    await chatInput.press("Enter");
    await expect(page.getByText("decreased 8 percent")).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Agent UI Control Tests", () => {
  // These tests verify the agent processes tool-call fixtures and returns
  // confirmation text. Actual UI state changes require CopilotKit's
  // ActionExecution bridge which doesn't yet support AG-UI TOOL_CALL events.
  test.use({ viewport: { width: 1280, height: 800 } });

  test("agent processes switch to chart tab", async ({ page }) => {
    await page.goto("/resident");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill("show chart view");
    await chatInput.press("Enter");

    // Agent should respond with confirmation after processing the tool call
    await expect(page.getByText("switched to chart view")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("agent processes switch to table tab", async ({ page }) => {
    await page.goto("/resident");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill("show table view");
    await chatInput.press("Enter");

    await expect(page.getByText("switched to table view")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("agent processes switch to map tab", async ({ page }) => {
    await page.goto("/resident");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill("show map view");
    await chatInput.press("Enter");

    await expect(page.getByText("switched to map view")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("agent processes year range filter", async ({ page }) => {
    await page.goto("/resident");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill("filter years 2020 to 2022");
    await chatInput.press("Enter");

    await expect(page.getByText("year range to 2020-2022")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("agent processes move chat to left", async ({ page }) => {
    await page.goto("/resident");
    const chatInput = page.getByPlaceholder(/ask about/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill("move chat to left");
    await chatInput.press("Enter");

    await expect(page.getByText("moved the chat to the left")).toBeVisible({
      timeout: 20_000,
    });
  });
});

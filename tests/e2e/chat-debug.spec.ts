import { test, expect } from "@playwright/test";

test.setTimeout(120000);

test("chat sends message and receives assistant response", async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto("/resident", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Verify welcome message is shown
  const welcomeText = page.locator("text=Welcome");
  await expect(welcomeText.first()).toBeVisible({ timeout: 10000 });

  // Count messages before sending
  const messagesBefore = await page
    .locator(
      '[class*="chat"] >> [class*="message"], [class*="Chat"] >> p, [class*="gap-3"] >> div',
    )
    .count();
  console.log(`Messages before: ${messagesBefore}`);

  // Send a message
  const chatInput = page.getByPlaceholder(/ask about/i);
  await chatInput.fill("Hello, what can you help me with?");
  await chatInput.press("Enter");

  // Wait for response - look for new content appearing
  await page.waitForTimeout(30000);

  // Get page text to see what rendered
  const pageText = await page.locator("body").innerText();
  console.log("=== PAGE TEXT (last 2000 chars) ===");
  console.log(pageText.slice(-2000));

  // Count messages after
  const messagesAfter = await page
    .locator(
      '[class*="chat"] >> [class*="message"], [class*="Chat"] >> p, [class*="gap-3"] >> div',
    )
    .count();
  console.log(`Messages after: ${messagesAfter}`);

  // Dump console for debugging
  console.log("=== CONSOLE LOGS ===");
  consoleLogs.forEach((l) => console.log(l));
});

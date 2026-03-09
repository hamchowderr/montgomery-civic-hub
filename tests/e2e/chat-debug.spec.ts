import { test, expect } from "@playwright/test";

test.setTimeout(90000);

test("debug chat - check visibleMessages", async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto("/resident", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  // Inject a global debug hook into CopilotKit state
  await page.evaluate(() => {
    // Monkey-patch console to capture CopilotChat logs
    const origLog = console.log;
    (window as any).__copilotDebug = [];
    console.log = function (...args: any[]) {
      if (args[0]?.toString?.().includes?.("CopilotChat")) {
        (window as any).__copilotDebug.push(args.map(String).join(" "));
      }
      origLog.apply(console, args);
    };
  });

  const chatInput = page.getByPlaceholder(/ask about/i);
  await chatInput.fill("Hello");
  await chatInput.press("Enter");
  await page.waitForTimeout(20000);

  // Get debug info
  const debug = await page.evaluate(() => (window as any).__copilotDebug ?? []);
  console.log("=== COPILOT DEBUG ===");
  debug.forEach((d: string) => console.log(d));

  // Also dump all console logs
  console.log("=== ALL CONSOLE ===");
  consoleLogs.forEach((l) => console.log(l));
});

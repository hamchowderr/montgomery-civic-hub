import { LLMock } from "@copilotkit/llmock";
import path from "path";

const MOCK_PORT = 5555;
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`;

let mock: LLMock | null = null;

export async function setup() {
  if (mock) return;
  mock = new LLMock({ port: MOCK_PORT });
  mock.loadFixtureDir(path.join(__dirname, "fixtures"));
  await mock.start();
  process.env.ANTHROPIC_BASE_URL = MOCK_URL;
  process.env.ANTHROPIC_API_KEY = "mock-key";
}

export async function teardown() {
  if (mock) {
    await mock.stop();
    mock = null;
  }
}

// Default export toggles between setup and teardown.
// Playwright calls default for both globalSetup and globalTeardown.
async function globalSetupOrTeardown() {
  if (mock) {
    await teardown();
  } else {
    await setup();
  }
}

export default globalSetupOrTeardown;

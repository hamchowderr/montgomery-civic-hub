import { describe, it, expect } from "vitest";
import { getSystemPrompt } from "@/lib/ai/prompts";

describe("Portal System Prompts", () => {
  const portals = ["resident", "business", "citystaff", "researcher"];

  for (const portal of portals) {
    it(`returns a non-empty prompt for ${portal}`, () => {
      const prompt = getSystemPrompt(portal);
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(50);
    });
  }

  it("resident prompt mentions friendly tone", () => {
    const prompt = getSystemPrompt("resident");
    expect(prompt.toLowerCase()).toContain("friendly");
  });

  it("business prompt mentions professional tone", () => {
    const prompt = getSystemPrompt("business");
    expect(prompt.toLowerCase()).toContain("professional");
  });

  it("citystaff prompt mentions analytical tone", () => {
    const prompt = getSystemPrompt("citystaff");
    expect(prompt.toLowerCase()).toContain("analytical");
  });

  it("researcher prompt mentions academic tone", () => {
    const prompt = getSystemPrompt("researcher");
    expect(prompt.toLowerCase()).toContain("academic");
  });
});

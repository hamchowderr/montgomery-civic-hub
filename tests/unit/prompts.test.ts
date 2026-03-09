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

  // Montgomery context enrichment
  it("all prompts include Montgomery demographic context", () => {
    for (const portal of portals) {
      const prompt = getSystemPrompt(portal);
      expect(prompt).toContain("civil rights");
      expect(prompt).toContain("Rosa Parks");
      expect(prompt).toContain("ArcGIS");
    }
  });

  it("business prompt references data center economy", () => {
    const prompt = getSystemPrompt("business");
    expect(prompt).toContain("Meta");
    expect(prompt).toContain("data center");
  });

  it("citystaff prompt includes executive briefing mode", () => {
    const prompt = getSystemPrompt("citystaff");
    expect(prompt.toLowerCase()).toContain("executive briefing");
    expect(prompt).toContain("Key Finding");
  });

  it("researcher prompt encourages interdisciplinary analysis", () => {
    const prompt = getSystemPrompt("researcher");
    expect(prompt.toLowerCase()).toContain("interdisciplinary");
    expect(prompt.toLowerCase()).toContain("cross-pollinate");
  });

  it("resident prompt encourages dataset discovery", () => {
    const prompt = getSystemPrompt("resident");
    expect(prompt).toContain("Did you know");
  });

  it("default prompt returns base Montgomery context", () => {
    const prompt = getSystemPrompt("unknown");
    expect(prompt).toContain("Montgomery, Alabama");
    expect(prompt).toContain("civil rights");
  });
});

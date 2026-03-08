import { describe, it, expect } from "vitest";
import { tours } from "@/lib/tours";

describe("tour definitions", () => {
  it("has exactly 4 tours", () => {
    expect(tours).toHaveLength(4);
  });

  it.each([
    ["resident-tour"],
    ["business-tour"],
    ["citystaff-tour"],
    ["researcher-tour"],
  ])("tour %s has exactly 5 steps", (tourId) => {
    const tour = tours.find((t) => t.id === tourId);
    expect(tour).toBeDefined();
    expect(tour!.steps).toHaveLength(5);
  });

  it("every step has a non-empty id string", () => {
    for (const tour of tours) {
      for (const step of tour.steps) {
        expect(typeof step.id).toBe("string");
        expect(step.id.length).toBeGreaterThan(0);
      }
    }
  });

  it("every step has a non-empty title string", () => {
    for (const tour of tours) {
      for (const step of tour.steps) {
        expect(typeof step.title).toBe("string");
        expect((step.title as string).length).toBeGreaterThan(0);
      }
    }
  });

  it("all 20 step ids are unique across the full array", () => {
    const allIds = tours.flatMap((t) => t.steps.map((s) => s.id));
    expect(allIds).toHaveLength(20);
    expect(new Set(allIds).size).toBe(20);
  });
});

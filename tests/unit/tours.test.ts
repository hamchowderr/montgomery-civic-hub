import { describe, expect, it } from "vitest";
import { tours } from "@/lib/tours";

describe("tour definitions", () => {
  it("has exactly 13 tours", () => {
    expect(tours).toHaveLength(13);
  });

  it.each([
    ["resident-tour", 9],
    ["business-tour", 9],
    ["citystaff-tour", 8],
    ["researcher-tour", 9],
    ["resident-emergency-tour", 2],
    ["resident-newsfeed-tour", 2],
    ["resident-city-pulse-tour", 1],
    ["business-vacant-land-tour", 1],
    ["citystaff-staffing-tour", 1],
    ["researcher-civil-rights-tour", 2],
    ["researcher-demographics-tour", 1],
    ["executive-tour", 6],
    ["insights-tour", 6],
  ])("tour %s has exactly %i steps", (tourId, stepCount) => {
    const tour = tours.find((t) => t.id === tourId);
    expect(tour).toBeDefined();
    expect(tour!.steps).toHaveLength(stepCount);
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

  it("all tour ids are unique", () => {
    const tourIds = tours.map((t) => t.id);
    expect(new Set(tourIds).size).toBe(tourIds.length);
  });
});

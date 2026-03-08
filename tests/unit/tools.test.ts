import { describe, it, expect } from "vitest";
import {
  arcgisQueryTool,
  brightdataSearchTool,
  allTools,
} from "@/lib/ai/tools";

describe("AI Tool Definitions", () => {
  it("arcgis_query has correct name and required fields", () => {
    expect(arcgisQueryTool.name).toBe("arcgis_query");
    expect(arcgisQueryTool.description).toBeTruthy();
    expect(arcgisQueryTool.input_schema.type).toBe("object");
    expect(arcgisQueryTool.input_schema.required).toContain("dataset");
  });

  it("brightdata_search has correct name and required fields", () => {
    expect(brightdataSearchTool.name).toBe("brightdata_search");
    expect(brightdataSearchTool.description).toBeTruthy();
    expect(brightdataSearchTool.input_schema.type).toBe("object");
    expect(brightdataSearchTool.input_schema.required).toContain("tool");
  });

  it("allTools contains both tools", () => {
    expect(allTools).toHaveLength(2);
    expect(allTools.map((t) => t.name)).toEqual([
      "arcgis_query",
      "brightdata_search",
    ]);
  });
});

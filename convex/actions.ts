import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const fetchArcGIS = action({
  args: {
    featureServerUrl: v.string(),
    where: v.optional(v.string()),
    outFields: v.optional(v.string()),
    resultRecordCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const where = args.where ?? "1=1";
    const outFields = args.outFields ?? "*";
    const limit = args.resultRecordCount ?? 100;

    const params = new URLSearchParams({
      where,
      outFields,
      resultRecordCount: String(limit),
      f: "json",
    });
    const url = `${args.featureServerUrl}/query?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
    const data = await res.json();
    return data;
  },
});

export const callBrightData = action({
  args: {
    tool: v.string(),
    params: v.any(),
  },
  handler: async (ctx, args) => {
    const token = process.env.BRIGHTDATA_API_TOKEN;
    if (!token) throw new Error("BRIGHTDATA_API_TOKEN not set");

    const res = await fetch(`https://mcp.brightdata.com/mcp?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: args.tool,
          arguments: args.params,
        },
      }),
    });
    if (!res.ok) throw new Error(`Bright Data MCP call failed: ${res.status}`);
    const data = await res.json();
    return data.result;
  },
});

export const seedDatasetRegistry = action({
  args: {},
  handler: async (ctx) => {
    // Fetch dataset catalog from ArcGIS Hub
    const res = await fetch(
      "https://opendata-citymgm.hub.arcgis.com/api/v3/datasets?page[size]=50",
    );
    if (!res.ok)
      throw new Error(`Failed to fetch ArcGIS Hub datasets: ${res.status}`);
    const catalog = await res.json();

    const targetDatasets = [
      "Crime Statistics",
      "Crime Mapping",
      "Building Permits",
      "General Permits",
      "Business License",
      "911 Call",
      "Master Operating Expenditures",
      "Flood Zone",
      "Sanitation",
      "Recreation",
      "Station",
      "Census",
      "GIS",
    ];

    const portalMapping: Record<string, string[]> = {
      Crime: ["resident", "researcher"],
      "911": ["researcher", "citystaff"],
      Permit: ["business", "citystaff"],
      License: ["business"],
      Expenditures: ["citystaff"],
      Flood: ["resident", "citystaff"],
      Sanitation: ["resident", "citystaff"],
      Recreation: ["resident"],
      Station: ["resident", "citystaff"],
      Census: ["researcher"],
      GIS: ["citystaff", "researcher"],
    };

    for (const dataset of catalog.data ?? []) {
      const name = dataset.attributes?.name ?? "";
      const isTarget = targetDatasets.some((t) =>
        name.toLowerCase().includes(t.toLowerCase()),
      );
      if (!isTarget) continue;

      const featureServerUrl = dataset.attributes?.url;
      if (!featureServerUrl) continue;

      const portals = Object.entries(portalMapping).find(([key]) =>
        name.toLowerCase().includes(key.toLowerCase()),
      )?.[1] ?? ["citystaff"];

      // Fetch schema
      let fields: unknown[] = [];
      try {
        const schemaRes = await fetch(`${featureServerUrl}?f=json`);
        if (schemaRes.ok) {
          const schema = await schemaRes.json();
          fields = schema.fields ?? [];
        }
      } catch {
        // Skip schema fetch errors
      }

      // Check if already exists
      const existing = await ctx.runQuery(api.queries.getDatasetRegistry);
      const alreadyExists = existing.some((d) => d.name === name);
      if (!alreadyExists) {
        await ctx.runMutation(api.mutations.insertDatasetRegistry as any, {
          name,
          featureServerUrl,
          portals,
          fields,
        });
      }
    }
  },
});

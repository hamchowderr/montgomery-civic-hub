import { createTool } from "@mastra/core/tools";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { queryFeatureServer } from "@/lib/arcgis";
import { sanitizeToolResult } from "./sanitize";

let convex: ConvexHttpClient | null = null;
function getConvex(): ConvexHttpClient | null {
  if (convex) return convex;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (url && !url.startsWith("YOUR_")) {
    convex = new ConvexHttpClient(url);
  }
  return convex;
}

export const arcgisQueryTool = createTool({
  id: "arcgis_query",
  description:
    "Query City of Montgomery ArcGIS FeatureServer datasets. Returns GIS feature data including attributes. Use exact dataset names from the catalog in your system prompt.",
  inputSchema: z.object({
    dataset: z
      .string()
      .describe(
        "Exact dataset name: Received_311_Service_Request, Business_License, Construction_Permits, Code_Violations, Paving_Project, Nuisance, City_Owned_Properities, Police_Facilities, Fire_Stations, Community_Centers, Libraries, Education_Facilities, Daycare_Centers, Tornado_Sirens, Health_Care_Facility, Entertainment_Districts, or boundary layers (Council_Districts, Neighborhoods, Census_Boundaries, Zoning, Flood_Hazard_Areas, City_Parks, Parcels, Historic_Areas, Zip_Code, City_Limit)",
      ),
    where: z
      .string()
      .optional()
      .describe('SQL WHERE clause to filter results (e.g., "offense=\'THEFT\'" or "1=1" for all)'),
    limit: z.number().optional().describe("Maximum number of records to return (default 100)"),
  }),
  execute: async (input) => {
    const client = getConvex();

    // Check Convex dataset_registry first
    if (client) {
      try {
        const cached = await client.query(api.datasetRegistry.getByName, {
          name: input.dataset,
        });
        if (cached?.featureServerUrl) {
          const result = await queryFeatureServer(cached.featureServerUrl, {
            where: input.where,
            limit: input.limit,
          });
          return sanitizeToolResult(result);
        }
      } catch {
        // Fall through
      }
    }

    // Fall back to ArcGIS Hub v3 API
    const datasetRes = await fetch(
      `https://opendata-citymgm.hub.arcgis.com/api/v3/datasets?filter[name]=${encodeURIComponent(input.dataset)}&page[size]=1`,
    );
    if (!datasetRes.ok) return sanitizeToolResult({ error: "Dataset not found" });
    const datasetData = await datasetRes.json();
    const featureUrl = datasetData.data?.[0]?.attributes?.url;
    if (!featureUrl) return sanitizeToolResult({ error: `Dataset "${input.dataset}" not found` });

    // Cache for future requests
    if (client) {
      try {
        await client.mutation(api.mutations.insertDatasetRegistry, {
          name: input.dataset,
          featureServerUrl: featureUrl,
          portals: [],
          fields: {},
        });
      } catch {
        // Non-critical
      }
    }

    const result = await queryFeatureServer(featureUrl, {
      where: input.where,
      limit: input.limit,
    });
    return sanitizeToolResult(result);
  },
});

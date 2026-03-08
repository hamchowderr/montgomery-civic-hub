import { NextRequest, NextResponse } from "next/server";
import { chat, type ToolHandler } from "@/lib/ai/client";
import { queryFeatureServer } from "@/lib/arcgis";

export async function POST(
  request: NextRequest,
  { params }: { params: { portal: string } },
) {
  try {
    const { portal } = params;
    const validPortals = ["resident", "business", "citystaff", "researcher"];
    if (!validPortals.includes(portal)) {
      return NextResponse.json({ error: "Invalid portal" }, { status: 400 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const toolHandler: ToolHandler = {
      arcgis_query: async (input) => {
        // In production, look up featureServerUrl from dataset_registry
        // For now, query the ArcGIS Hub API
        const datasetRes = await fetch(
          `https://opendata-citymgm.hub.arcgis.com/api/v3/datasets?filter[name]=${encodeURIComponent(input.dataset)}&page[size]=1`,
        );
        if (!datasetRes.ok) return { error: "Dataset not found" };
        const datasetData = await datasetRes.json();
        const featureUrl = datasetData.data?.[0]?.attributes?.url;
        if (!featureUrl)
          return { error: `Dataset "${input.dataset}" not found` };

        return queryFeatureServer(featureUrl, {
          where: input.where,
          limit: input.limit,
        });
      },
      brightdata_search: async (input) => {
        const token = process.env.BRIGHTDATA_API_TOKEN;
        if (!token) return { error: "Bright Data not configured" };

        const res = await fetch(
          `https://mcp.brightdata.com/mcp?token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: {
                name: input.tool,
                arguments:
                  input.tool === "search_engine"
                    ? { query: input.query }
                    : { url: input.url },
              },
            }),
          },
        );
        if (!res.ok) return { error: `Bright Data error: ${res.status}` };
        const data = await res.json();
        return data.result;
      },
    };

    const result = await chat(
      portal,
      [{ role: "user", content: message }],
      toolHandler,
    );

    return NextResponse.json({
      message: result.content,
      toolCalls: result.toolCalls.map((tc) => ({
        name: tc.name,
        status: "completed",
      })),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

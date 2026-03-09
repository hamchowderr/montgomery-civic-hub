import { NextRequest } from "next/server";
import { chatStream, type ToolHandler } from "@/lib/ai/client";
import { queryFeatureServer } from "@/lib/arcgis";
import { DATASET_NAME_TO_URL } from "@/lib/arcgis-client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: { portal: string } },
) {
  try {
    const { portal } = params;
    const validPortals = ["resident", "business", "citystaff", "researcher"];
    if (!validPortals.includes(portal)) {
      return Response.json({ error: "Invalid portal" }, { status: 400 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Fix #1: Fetch conversation history from Convex using sessionId
    const messages: MessageParam[] = [];
    if (convex && sessionId) {
      try {
        const history = await convex.query(api.queries.getChatMessages, {
          sessionId,
        });
        for (const msg of history) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      } catch {
        // Non-critical — continue without history
      }
    }

    // Append the current user message
    messages.push({ role: "user", content: message });

    // Fix #9: Persist user message to Convex
    if (convex && sessionId) {
      try {
        await convex.mutation(api.mutations.insertMessage, {
          portalId: portal,
          sessionId,
          role: "user",
          content: message,
        });
      } catch {
        // Non-critical — continue even if persistence fails
      }
    }

    const toolHandler: ToolHandler = {
      arcgis_query: async (input) => {
        // 1. Direct URL lookup from the dataset catalog (fastest, most reliable)
        const directUrl = DATASET_NAME_TO_URL[input.dataset];
        if (directUrl) {
          return queryFeatureServer(directUrl, {
            where: input.where,
            limit: input.limit,
          });
        }

        // 2. Check Convex dataset_registry (for previously discovered datasets)
        if (convex) {
          try {
            const cached = await convex.query(api.datasetRegistry.getByName, {
              name: input.dataset,
            });
            if (cached?.featureServerUrl) {
              return queryFeatureServer(cached.featureServerUrl, {
                where: input.where,
                limit: input.limit,
              });
            }
          } catch {
            // Fall through to Hub API lookup
          }
        }

        // 3. Fall back to ArcGIS Hub v3 API (for datasets not in the catalog)
        const datasetRes = await fetch(
          `https://opendata-citymgm.hub.arcgis.com/api/v3/datasets?filter[name]=${encodeURIComponent(input.dataset)}&page[size]=1`,
        );
        if (!datasetRes.ok) return { error: "Dataset not found" };
        const datasetData = await datasetRes.json();
        const featureUrl = datasetData.data?.[0]?.attributes?.url;
        if (!featureUrl)
          return { error: `Dataset "${input.dataset}" not found` };

        // Cache the result in dataset_registry for future requests
        if (convex) {
          try {
            await convex.mutation(api.mutations.insertDatasetRegistry, {
              name: input.dataset,
              featureServerUrl: featureUrl,
              portals: [portal],
              fields: {},
            });
          } catch {
            // Non-critical — continue even if caching fails
          }
        }

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

    const stream = chatStream(portal, messages, toolHandler);

    // Collect the full response for persistence while streaming
    let fullResponse = "";
    const encoder = new TextEncoder();
    const byteStream = stream.pipeThrough(
      new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          // Don't include status messages in the persisted response
          if (!chunk.startsWith("\x00status:")) {
            fullResponse += chunk;
          }
          controller.enqueue(encoder.encode(chunk));
        },
        async flush() {
          // Fix #9: Persist assistant response to Convex after streaming completes
          if (convex && sessionId && fullResponse.trim()) {
            try {
              await convex.mutation(api.mutations.insertMessage, {
                portalId: portal,
                sessionId,
                role: "assistant",
                content: fullResponse,
              });
            } catch {
              // Non-critical — response was already streamed to client
            }
          }
        },
      }),
    );

    return new Response(byteStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

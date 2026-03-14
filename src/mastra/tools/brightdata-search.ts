import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { sanitizeToolResult } from "./sanitize";

// Reuse MCP session across Bright Data calls (module scope)
let bdSessionId: string | null = null;

async function getBdSessionId(token: string): Promise<string | null> {
  if (bdSessionId) return bdSessionId;
  try {
    const res = await fetch(`https://mcp.brightdata.com/mcp?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "montgomery-civic-hub", version: "1.0.0" },
        },
      }),
    });
    const sid = res.headers.get("mcp-session-id");
    if (sid) {
      bdSessionId = sid;
      return sid;
    }
  } catch (error) {
    console.error("[brightdata] MCP session init failed:", error);
  }
  return null;
}

export const brightdataSearchTool = createTool({
  id: "brightdata_search",
  description:
    "Search the web or scrape specific URLs for Montgomery, AL civic information using Bright Data. Use for news, council agendas, emergency alerts, and other web content not in ArcGIS.",
  inputSchema: z.object({
    tool: z.enum(["search_engine", "scrape_as_markdown"]).describe("Which Bright Data tool to use"),
    query: z.string().optional().describe("Search query string (used with search_engine tool)"),
    url: z
      .string()
      .optional()
      .describe("Specific URL to scrape as markdown (used with scrape_as_markdown tool)"),
  }),
  execute: async (input) => {
    const token = process.env.BRIGHTDATA_API_TOKEN;
    if (!token) return sanitizeToolResult({ error: "Bright Data not configured" });

    const sessionId = await getBdSessionId(token);
    if (!sessionId) return sanitizeToolResult({ error: "Bright Data session init failed" });

    const doCall = async (sid: string) => {
      return fetch(`https://mcp.brightdata.com/mcp?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sid,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: input.tool,
            arguments: input.tool === "search_engine" ? { query: input.query } : { url: input.url },
          },
        }),
      });
    };

    let res = await doCall(sessionId);

    // Session expired — retry with fresh session
    if (res.status === 400) {
      bdSessionId = null;
      const newSid = await getBdSessionId(token);
      if (!newSid) return sanitizeToolResult({ error: "Bright Data session refresh failed" });
      res = await doCall(newSid);
    }

    if (!res.ok) return sanitizeToolResult({ error: `Bright Data error: ${res.status}` });

    // Parse SSE response
    const text = await res.text();
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.result) return sanitizeToolResult(json.result);
      } catch {
        // skip non-JSON lines
      }
    }
    return sanitizeToolResult({ error: "No result in Bright Data response" });
  },
});

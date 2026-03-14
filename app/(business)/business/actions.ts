"use server";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface CachedResults {
  data: SearchResult[];
  timestamp: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const searchCache = new Map<string, CachedResults>();

// Reuse MCP session across requests (server module scope)
let mcpSessionId: string | null = null;

async function getMcpSessionId(token: string): Promise<string | null> {
  if (mcpSessionId) return mcpSessionId;

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

    const sessionId = res.headers.get("mcp-session-id");
    if (sessionId) {
      mcpSessionId = sessionId;
      return sessionId;
    }
  } catch (error) {
    console.error("[workforce] MCP session init failed:", error);
  }
  return null;
}

export async function searchWorkforceData(query: string): Promise<SearchResult[]> {
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = process.env.BRIGHTDATA_API_TOKEN;
  if (!token) {
    return [
      {
        title: "Bright Data not configured",
        snippet: "Set BRIGHTDATA_API_TOKEN in .env.local to enable workforce data search",
        url: "",
        source: "System",
      },
    ];
  }

  try {
    const sessionId = await getMcpSessionId(token);
    if (!sessionId) {
      console.error("[workforce] Could not establish MCP session");
      return [];
    }

    const response = await fetch(`https://mcp.brightdata.com/mcp?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "search_engine",
          arguments: { query },
        },
      }),
    });

    if (!response.ok) {
      // Session may have expired — clear and retry once
      if (response.status === 400) {
        mcpSessionId = null;
        const newSessionId = await getMcpSessionId(token);
        if (!newSessionId) return [];

        const retryRes = await fetch(`https://mcp.brightdata.com/mcp?token=${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            "mcp-session-id": newSessionId,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: "tools/call",
            params: {
              name: "search_engine",
              arguments: { query },
            },
          }),
        });

        if (!retryRes.ok) {
          console.error("[workforce] Bright Data retry failed:", retryRes.status);
          return [];
        }

        return parseSSEResponse(retryRes, cacheKey);
      }

      console.error("[workforce] Bright Data request failed:", response.status);
      return [];
    }

    return parseSSEResponse(response, cacheKey);
  } catch (error) {
    console.error("[workforce] Search failed:", error);
    return [];
  }
}

async function parseSSEResponse(response: Response, cacheKey: string): Promise<SearchResult[]> {
  // Response is SSE — parse the event stream for the data line
  const text = await response.text();
  const results: SearchResult[] = [];

  // Extract JSON-RPC result from SSE data lines
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;

    try {
      const json = JSON.parse(line.slice(6));
      const content = json.result?.content;
      if (!Array.isArray(content)) continue;

      for (const block of content) {
        if (block.type !== "text" || !block.text) continue;

        const parsed = JSON.parse(block.text);
        const items = Array.isArray(parsed) ? parsed : (parsed.organic ?? parsed.results ?? []);

        for (const item of items.slice(0, 15)) {
          results.push({
            title: String(item.title ?? item.name ?? ""),
            snippet: String(item.description ?? item.snippet ?? ""),
            url: String(item.link ?? item.url ?? ""),
            source: new URL(String(item.link ?? item.url ?? "https://unknown")).hostname,
          });
        }
      }
    } catch {
      // Not a valid JSON data line, skip
    }
  }

  if (results.length > 0) {
    searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
  }
  return results;
}

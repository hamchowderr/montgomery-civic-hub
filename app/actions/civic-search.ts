"use server";

// ---------------------------------------------------------------------------
// Bright Data search actions for Executive & Insights dashboards
// Follows the same MCP pattern as business/actions.ts
// ---------------------------------------------------------------------------

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface CachedResults {
  data: SearchResult[];
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const searchCache = new Map<string, CachedResults>();

// Reuse MCP session across requests (server module scope)
let mcpSessionId: string | null = null;

async function getMcpSessionId(token: string): Promise<string | null> {
  if (mcpSessionId) return mcpSessionId;

  try {
    const res = await fetch("https://mcp.brightdata.com/mcp?token=" + token, {
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
    console.error("[civic-search] MCP session init failed:", error);
  }
  return null;
}

async function brightDataSearch(query: string): Promise<SearchResult[]> {
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = process.env.BRIGHTDATA_API_TOKEN;
  if (!token) return [];

  try {
    const sessionId = await getMcpSessionId(token);
    if (!sessionId) return [];

    const doCall = async (sid: string) =>
      fetch("https://mcp.brightdata.com/mcp?token=" + token, {
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
            name: "search_engine",
            arguments: { query },
          },
        }),
      });

    let res = await doCall(sessionId);

    // Session expired — retry with fresh session
    if (res.status === 400) {
      mcpSessionId = null;
      const newSid = await getMcpSessionId(token);
      if (!newSid) return [];
      res = await doCall(newSid);
    }

    if (!res.ok) return [];

    return parseSSEResponse(res, cacheKey);
  } catch (error) {
    console.error("[civic-search] Search failed:", error);
    return [];
  }
}

async function parseSSEResponse(response: Response, cacheKey: string): Promise<SearchResult[]> {
  const text = await response.text();
  const results: SearchResult[] = [];

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

        for (const item of items.slice(0, 10)) {
          results.push({
            title: String(item.title ?? item.name ?? ""),
            snippet: String(item.description ?? item.snippet ?? ""),
            url: String(item.link ?? item.url ?? ""),
            source: (() => {
              try {
                return new URL(String(item.link ?? item.url ?? "https://unknown")).hostname;
              } catch {
                return "unknown";
              }
            })(),
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

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/**
 * Search for Montgomery Police Department staffing data.
 * Returns web search results about MPD staffing, vacancies, recruitment.
 */
export async function searchMPDStaffing(): Promise<SearchResult[]> {
  return brightDataSearch(
    "Montgomery Alabama police department MPD staffing vacancies officers recruitment 2024 2025",
  );
}

/**
 * Search for Montgomery, AL crime statistics and public safety data.
 * Returns web search results about crime trends, reports, and safety metrics.
 */
export async function searchCrimeData(): Promise<SearchResult[]> {
  return brightDataSearch(
    "Montgomery Alabama crime statistics 2024 2025 violent crime rate public safety",
  );
}

/**
 * Search for Montgomery, AL demographic and population data by district.
 * Returns web search results about demographics, population, income, equity.
 */
export async function searchDemographics(): Promise<SearchResult[]> {
  return brightDataSearch(
    "Montgomery Alabama demographics population income poverty by district census 2024",
  );
}

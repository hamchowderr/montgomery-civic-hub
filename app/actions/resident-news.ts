"use server";

// ---------------------------------------------------------------------------
// Bright Data MCP — Montgomery resident news & community updates
//
// Primary data comes from city-pulse-data.json (populated via Bright Data MCP
// search_engine tool). The JSON file acts as the cached data layer. The HTTP
// MCP endpoint is used as a fallback to refresh data when the JSON is stale.
// ---------------------------------------------------------------------------

import pulseData from "./city-pulse-data.json";

export interface NewsResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Static data layer — imported JSON (bundled at build time)
// ---------------------------------------------------------------------------

type CategoryKey = "news" | "government" | "safety" | "events" | "infrastructure";

async function getCategoryData(key: CategoryKey): Promise<NewsResult[]> {
  const category = (pulseData as Record<string, unknown>)[key];
  if (Array.isArray(category) && category.length > 0) {
    return category as NewsResult[];
  }

  // Fallback: try HTTP MCP if static data missing
  return brightDataSearchFallback(SEARCH_QUERIES[key]);
}

// ---------------------------------------------------------------------------
// Search query config
// ---------------------------------------------------------------------------

const SEARCH_QUERIES: Record<CategoryKey, string> = {
  news: "site:wsfa.com OR site:montgomeryadvertiser.com OR site:al.com Montgomery Alabama news 2026",
  government:
    "Montgomery Alabama city council government ordinance budget 2026 site:wsfa.com OR site:montgomeryadvertiser.com",
  safety:
    "Montgomery Alabama crime public safety police fire arrest 2026 site:wsfa.com OR site:montgomeryadvertiser.com",
  events:
    "Montgomery Alabama events festival community recreation 2026 site:wsfa.com OR site:montgomeryadvertiser.com OR site:al.com",
  infrastructure:
    "Montgomery Alabama infrastructure construction road water utility project 2026 site:wsfa.com OR site:montgomeryadvertiser.com",
};

// ---------------------------------------------------------------------------
// HTTP MCP fallback (used only when static JSON is empty/missing)
// ---------------------------------------------------------------------------

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
    console.error("[resident-news] MCP session init failed:", error);
  }
  return null;
}

function isHomepageUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return pathname === "/" || /^\/[a-z-]+\/?$/i.test(pathname);
  } catch {
    return false;
  }
}

async function brightDataSearchFallback(query: string): Promise<NewsResult[]> {
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

    if (res.status === 400) {
      mcpSessionId = null;
      const newSid = await getMcpSessionId(token);
      if (!newSid) return [];
      res = await doCall(newSid);
    }

    if (!res.ok) return [];

    return parseSSEResponse(res);
  } catch (error) {
    console.error("[resident-news] Search fallback failed:", error);
    return [];
  }
}

async function parseSSEResponse(response: Response): Promise<NewsResult[]> {
  const text = await response.text();
  const results: NewsResult[] = [];

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
          const url = String(item.link ?? item.url ?? "");
          if (isHomepageUrl(url)) continue;

          const snippet = String(item.description ?? item.snippet ?? "")
            .replace(/Read\s*more\s*$/i, "")
            .trim();

          results.push({
            title: String(item.title ?? item.name ?? ""),
            snippet,
            url,
            source: (() => {
              try {
                return new URL(url || "https://unknown").hostname;
              } catch {
                return "unknown";
              }
            })(),
          });
        }
      }
    } catch {
      // skip
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public actions — each returns MCP-fetched data for a category
// ---------------------------------------------------------------------------

export async function searchLocalNews(): Promise<NewsResult[]> {
  return getCategoryData("news");
}

export async function searchCityGovernment(): Promise<NewsResult[]> {
  return getCategoryData("government");
}

export async function searchPublicSafety(): Promise<NewsResult[]> {
  return getCategoryData("safety");
}

export async function searchCommunityEvents(): Promise<NewsResult[]> {
  return getCategoryData("events");
}

export async function searchInfrastructure(): Promise<NewsResult[]> {
  return getCategoryData("infrastructure");
}

// ---------------------------------------------------------------------------
// Scrape full article content via Bright Data MCP scrape_as_markdown
// ---------------------------------------------------------------------------

const scrapeCache = new Map<string, { content: string; timestamp: number }>();
const SCRAPE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function extractArticleContent(raw: string): string {
  const text = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\\?\[([^\]]*)\]\\?\([^)]*\)/g, "$1")
    .replace(/\\?\[/g, "")
    .replace(/\\?\]/g, "")
    .replace(/\((?:https?:\/\/|\/)[^)]*\)/g, "");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const scores: number[] = lines.map((t) => {
    if (t.length < 35) return 0;
    if (/^[|_\-=*#>~`\\/:&?=%[\](){}\s]+$/.test(t)) return 0;
    if (/https?:\/\//.test(t)) return 0;
    if (/^\/[\w/-]+\/?$/.test(t)) return 0;
    if (
      /cookie|privacy policy|terms of (use|service)|subscribe|newsletter|sign up|sign in|public inspection|closed captioning|eeo report|copyright|all rights reserved|not reading this story|get news alerts/i.test(
        t,
      )
    )
      return 0;
    if (/^(email this|share on|share this|follow us)/i.test(t)) return 0;
    if (/^By\s+[\w\s]+$/i.test(t) && t.length < 60) return 0;
    if (/^(Published|Updated):?\s/i.test(t) && t.length < 80) return 0;
    const words = t.split(/\s+/);
    if (
      words.length >= 3 &&
      words.length <= 12 &&
      t.length < 120 &&
      words.every((w) => w.length < 15 && !/[.!?,;:']/.test(w))
    )
      return 0;
    if (
      /^(most read|latest news|top headlines|latest|trending|related stories|more stories)/i.test(t)
    )
      return 0;
    if (/[.!?]/.test(t) && t.length >= 40) return 1;
    if (t.length >= 80) return 1;
    return 0;
  });

  let runStart = -1;
  let runCount = 0;
  let gapCount = 0;

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] === 1) {
      if (runStart === -1) runStart = i;
      runCount++;
      gapCount = 0;
    } else if (runStart !== -1) {
      gapCount++;
      if (gapCount >= 2) {
        if (runCount >= 2) break;
        runStart = -1;
        runCount = 0;
        gapCount = 0;
      }
    }
  }

  if (runCount < 2) {
    runStart = -1;
    runCount = 0;
  }

  const articleLines: string[] = [];
  if (runStart !== -1) {
    let gap = 0;
    for (let i = runStart; i < lines.length; i++) {
      if (scores[i] === 1) {
        articleLines.push(lines[i]);
        gap = 0;
      } else {
        gap++;
        if (gap >= 2) break;
      }
    }
  }

  return articleLines.join("\n\n");
}

/** Fetch the Open Graph image URL from an article page */
export async function fetchOgImage(url: string): Promise<string> {
  try {
    // Fetch just enough HTML to get the head section
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MontgomeryCivicHub/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";

    const html = await res.text();
    // Extract og:image from meta tags
    const match =
      html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);

    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

export async function scrapeArticle(url: string): Promise<string> {
  if (isHomepageUrl(url)) return "";

  const cached = scrapeCache.get(url);
  if (cached && Date.now() - cached.timestamp < SCRAPE_CACHE_TTL) {
    return cached.content;
  }

  const token = process.env.BRIGHTDATA_API_TOKEN;
  if (!token) return "";

  try {
    const sessionId = await getMcpSessionId(token);
    if (!sessionId) return "";

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
            name: "scrape_as_markdown",
            arguments: { url },
          },
        }),
      });

    let res = await doCall(sessionId);

    if (res.status === 400) {
      mcpSessionId = null;
      const newSid = await getMcpSessionId(token);
      if (!newSid) return "";
      res = await doCall(newSid);
    }

    if (!res.ok) return "";

    const text = await res.text();
    let markdown = "";

    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        const content = json.result?.content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
          if (block.type === "text" && block.text) {
            markdown += block.text;
          }
        }
      } catch {
        // skip
      }
    }

    const extracted = extractArticleContent(markdown);
    if (extracted) {
      scrapeCache.set(url, { content: extracted, timestamp: Date.now() });
    }
    return extracted;
  } catch (error) {
    console.error("[resident-news] Scrape failed:", error);
    return "";
  }
}

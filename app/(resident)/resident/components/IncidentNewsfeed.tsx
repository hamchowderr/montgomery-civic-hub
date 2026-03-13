"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useAction } from "convex/react";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { ARCGIS_URLS, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncidentItem {
  id: string;
  type: string;
  address: string;
  status: "Open" | "In Progress" | "Closed";
  date: Date;
  source: "311" | "news";
  department?: string;
  district?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusColor(status: IncidentItem["status"]) {
  switch (status) {
    case "Open":
      return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700";
    case "In Progress":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700";
    case "Closed":
      return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
  }
}

function parse311Features(fc: GeoJSON.FeatureCollection): IncidentItem[] {
  return fc.features.map((f) => {
    const p = f.properties ?? {};
    const rawDate = p.Create_Date;
    const date = typeof rawDate === "number" ? new Date(rawDate) : new Date(String(rawDate));

    return {
      id: String(p.Request_ID ?? crypto.randomUUID()),
      type: String(p.Request_Type ?? "Service Request"),
      address: String(p.Address ?? "Unknown address"),
      status: normalizeStatus(String(p.Status ?? "Open")),
      date: isNaN(date.getTime()) ? new Date() : date,
      source: "311" as const,
      department: p.Department ? String(p.Department) : undefined,
      district: p.District ? String(p.District) : undefined,
    };
  });
}

function normalizeStatus(raw: string): IncidentItem["status"] {
  const lower = raw.toLowerCase();
  if (lower.includes("progress")) return "In Progress";
  if (lower.includes("closed") || lower.includes("resolved")) return "Closed";
  return "Open";
}

function parseNewsResults(result: unknown): IncidentItem[] {
  if (!result || typeof result !== "object") return [];
  const content = (result as { content?: unknown[] }).content;
  if (!Array.isArray(content)) return [];

  const items: IncidentItem[] = [];
  for (const entry of content) {
    if (typeof entry !== "object" || !entry) continue;
    const text = (entry as { text?: string }).text;
    if (!text) continue;

    // Each search result line typically has title + snippet
    const lines = text.split("\n").filter((l) => l.trim());
    for (const line of lines.slice(0, 5)) {
      if (line.length < 10) continue;
      items.push({
        id: `news-${crypto.randomUUID()}`,
        type: line.slice(0, 80),
        address: "Montgomery, AL",
        status: "Open",
        date: new Date(),
        source: "news",
      });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IncidentNewsfeed() {
  const [items, setItems] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const callBrightData = useAction(api.actions.callBrightData);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fc, newsResult] = await Promise.allSettled([
        queryFeaturesAsGeoJSON({
          url: ARCGIS_URLS.serviceRequests311,
          outFields: "Request_ID,Request_Type,Department,Address,Status,Create_Date,District",
          where: "Status='Open' OR Status='In Progress'",
          returnGeometry: false,
          maxRecords: 30,
        }),
        callBrightData({
          tool: "web_search",
          params: {
            query: "Montgomery Alabama city incidents news 2025",
          },
        }),
      ]);

      const incidents = fc.status === "fulfilled" ? parse311Features(fc.value) : [];
      const news = newsResult.status === "fulfilled" ? parseNewsResults(newsResult.value) : [];

      const merged = [...incidents, ...news].sort((a, b) => b.date.getTime() - a.date.getTime());
      setItems(merged);
    } catch (err) {
      console.error("[IncidentNewsfeed] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [callBrightData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CopilotKit readable — expose 5 most recent items
  useCopilotReadable({
    description: "Recent open incidents from 311 and city news",
    value: items.slice(0, 5).map((i) => ({
      id: i.id,
      type: i.type,
      address: i.address,
      status: i.status,
      source: i.source,
      date: i.date.toISOString(),
    })),
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div data-tour-step-id="resident-newsfeed" className="mx-2 mb-2 sm:mx-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <h3 className="text-sm font-semibold">Live Incidents</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-lg border p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No open incidents found.
            </p>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight line-clamp-2">
                        {item.type}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {relativeTime(item.date)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.address}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.source === "311" ? "311" : "News"}
                      </Badge>
                      {item.department && (
                        <span className="text-[10px] text-muted-foreground">{item.department}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  Building2,
  CalendarDays,
  Construction,
  Newspaper,
  RefreshCw,
  ShieldAlert,
  Vote,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type NewsResult,
  searchCityGovernment,
  searchCommunityEvents,
  searchInfrastructure,
  searchLocalNews,
  searchPublicSafety,
} from "@/app/actions/resident-news";
import { SearchResultCard } from "@/components/SearchResultCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  label: string;
  icon: typeof Newspaper;
  color: string;
  fetcher: () => Promise<NewsResult[]>;
}

const CATEGORIES: Category[] = [
  {
    id: "news",
    label: "Local News",
    icon: Newspaper,
    color: "text-blue-600 dark:text-blue-400",
    fetcher: searchLocalNews,
  },
  {
    id: "government",
    label: "City Government",
    icon: Vote,
    color: "text-purple-600 dark:text-purple-400",
    fetcher: searchCityGovernment,
  },
  {
    id: "safety",
    label: "Public Safety",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    fetcher: searchPublicSafety,
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    color: "text-emerald-600 dark:text-emerald-400",
    fetcher: searchCommunityEvents,
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: Construction,
    color: "text-amber-600 dark:text-amber-400",
    fetcher: searchInfrastructure,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CityPulse() {
  const [activeTab, setActiveTab] = useState("news");
  const [results, setResults] = useState<Record<string, NewsResult[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const fetchCategory = useCallback(async (cat: Category) => {
    setLoading((prev) => ({ ...prev, [cat.id]: true }));
    try {
      const data = await cat.fetcher();
      setResults((prev) => ({ ...prev, [cat.id]: data }));
    } catch (err) {
      console.error(`[CityPulse] Failed to fetch ${cat.id}:`, err);
      setResults((prev) => ({ ...prev, [cat.id]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [cat.id]: false }));
    }
  }, []);

  // Fetch the active tab on mount or tab change (only if not already loaded)
  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.id === activeTab);
    if (cat && !results[cat.id] && !loading[cat.id]) {
      fetchCategory(cat);
    }
  }, [activeTab, results, loading, fetchCategory]);

  const activeCat = CATEGORIES.find((c) => c.id === activeTab)!;
  const activeResults = results[activeTab] ?? [];
  const isLoading = loading[activeTab] ?? false;

  const totalLoaded = Object.values(results).reduce((s, r) => s + r.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="gap-1.5 text-xs">
          <Building2 className="h-3 w-3" />
          {totalLoaded > 0 ? `${totalLoaded} articles loaded` : "Loading..."}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs">
          Powered by BrightData
        </Badge>
      </div>

      {/* Tabbed categories */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Montgomery City Pulse</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                disabled={isLoading}
                onClick={() => fetchCategory(activeCat)}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <TabsList className="mt-2 h-auto flex-wrap gap-1 bg-transparent p-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = results[cat.id]?.length;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="h-8 gap-1.5 rounded-full border px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label}
                    {count != null && (
                      <span className="ml-0.5 tabular-nums text-[10px] opacity-60">{count}</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0">
              <CardContent className="p-4 pt-2">
                {(loading[cat.id] ?? false) ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2 rounded-lg border p-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (results[cat.id] ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <cat.icon className={`h-8 w-8 ${cat.color} opacity-40`} />
                    <p className="text-sm text-muted-foreground">
                      No {cat.label.toLowerCase()} results found. Try refreshing.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => fetchCategory(cat)}>
                      <RefreshCw className="mr-1.5 h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(results[cat.id] ?? []).map((item) => (
                      <SearchResultCard
                        key={item.url}
                        result={item}
                        icon={<cat.icon className={`h-4 w-4 ${cat.color}`} />}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}

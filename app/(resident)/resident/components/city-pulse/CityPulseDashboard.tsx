"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { BarChart3, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CategoryDistribution } from "./CategoryDistribution";
import { CategoryTabs } from "./CategoryTabs";
import { PulseOverview } from "./PulseOverview";
import { ServiceRequestSummary } from "./ServiceRequestSummary";
import { SourceBreakdown } from "./SourceBreakdown";
import { CATEGORIES, CATEGORY_LABELS, useCityPulseData } from "./useCityPulseData";

export function CityPulseDashboard() {
  const {
    news,
    loading,
    stats,
    serviceRequests,
    serviceRequestsLoading,
    sourceDistribution,
    categoryDistribution,
    refreshCategory,
    refreshAll,
  } = useCityPulseData();

  const anyNewsLoading = Object.values(loading).some(Boolean);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  // Track when data was last loaded
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevLoading = useRef(anyNewsLoading);
  useEffect(() => {
    if (prevLoading.current && !anyNewsLoading && stats.totalArticles > 0) {
      setLastUpdated(new Date());
    }
    prevLoading.current = anyNewsLoading;
  }, [anyNewsLoading, stats.totalArticles]);

  // ── CopilotKit readables ──────────────────────────────────────────────

  useCopilotReadable({
    description: "City Pulse news summary — article counts by category from BrightData web search",
    value:
      stats.totalArticles > 0
        ? {
            totalArticles: stats.totalArticles,
            categories: Object.entries(news).map(([id, items]) => ({
              category: CATEGORY_LABELS[id] || id,
              count: items.length,
            })),
            topSources: sourceDistribution.slice(0, 5),
          }
        : "Loading news data...",
  });

  useCopilotReadable({
    description: "Montgomery 311 service requests by council district",
    value:
      serviceRequests.length > 0
        ? {
            total: stats.totalServiceRequests,
            byDistrict: serviceRequests,
          }
        : "Loading 311 data...",
  });

  // ── CopilotKit actions ────────────────────────────────────────────────

  useCopilotAction({
    name: "refresh_news_category",
    description:
      "Refresh news articles for a specific category. Valid categories: news, government, safety, events, infrastructure.",
    parameters: [
      {
        name: "categoryId",
        type: "string",
        description:
          "Category ID to refresh. One of: news, government, safety, events, infrastructure.",
        required: true,
      },
    ],
    handler: async ({ categoryId }: { categoryId: string }) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) {
        return `Invalid category "${categoryId}". Valid: ${CATEGORIES.map((c) => c.id).join(", ")}`;
      }
      refreshCategory(categoryId);
      return `Refreshing ${cat.label} articles...`;
    },
  });

  // ── Layout ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Section A: Sticky KPI bar with gradient background */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/0" />
        <div className="relative">
          <PulseOverview
            stats={stats}
            isLoading={anyNewsLoading && stats.totalArticles === 0}
            lastUpdated={lastUpdated ?? undefined}
          />
        </div>
      </div>

      {/* Section B: Tabbed news browser */}
      <CategoryTabs
        news={news}
        loading={loading}
        refreshCategory={refreshCategory}
        refreshAll={refreshAll}
      />

      {/* Section C: Collapsible analytics */}
      <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-sm font-semibold">
              <BarChart3 className="size-4" />
              Analytics
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${analyticsOpen ? "" : "-rotate-90"}`}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryDistribution data={categoryDistribution} isLoading={anyNewsLoading} />
            <SourceBreakdown data={sourceDistribution} isLoading={anyNewsLoading} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section D: 311 Service Requests */}
      <ServiceRequestSummary data={serviceRequests} isLoading={serviceRequestsLoading} />
    </div>
  );
}

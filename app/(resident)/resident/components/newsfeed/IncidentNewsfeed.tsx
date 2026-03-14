"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./FilterBar";
import { IncidentList } from "./IncidentList";
import { NewsfeedHeader } from "./NewsfeedHeader";
import { TypeBreakdownChart } from "./TypeBreakdownChart";
import { useNewsfeedData } from "./useNewsfeedData";
import { YearTrendChart } from "./YearTrendChart";

export function IncidentNewsfeed() {
  const data = useNewsfeedData();

  // ── CopilotKit readable ───────────────────────────────────────────────
  useCopilotReadable({
    description: "311 Service Request summary stats and current filter state",
    value: {
      stats: data.stats,
      filters: {
        status: data.filters.status,
        district: data.filters.district,
        origin: data.filters.origin,
        departmentCount: data.filters.departments.length,
        requestType: data.filters.requestType || "all",
      },
      recentItems: data.items.slice(0, 10).map((i) => ({
        id: i.id,
        type: i.type,
        address: i.address,
        status: i.status,
        department: i.department,
        date: i.date.toISOString(),
        resolutionTime: i.closeDate
          ? data.formatDuration(i.closeDate.getTime() - i.date.getTime())
          : null,
      })),
      topRequestTypes: data.typeBreakdown.slice(0, 5).map((t) => ({
        type: t.name,
        count: t.value,
      })),
      avgResolutionTime: data.avgResolutionTime
        ? data.formatDuration(data.avgResolutionTime)
        : "N/A",
    },
  });

  const handleFilterByType = (type: string) => {
    data.updateFilter("requestType", data.filters.requestType === type ? "" : type);
  };

  const [chartsOpen, setChartsOpen] = useState(true);

  return (
    <div data-tour-step-id="resident-newsfeed" className="space-y-4">
      <NewsfeedHeader
        stats={data.stats}
        avgResolutionTime={data.avgResolutionTime}
        isLoadingStats={data.isLoadingStats}
        isLoadingFeed={data.isLoadingFeed}
        isLoading={data.isLoading}
        onRefresh={data.refreshAll}
      />

      <FilterBar
        filters={data.filters}
        departmentOptions={data.departmentOptions}
        originOptions={data.originOptions}
        isLoadingFilters={data.isLoadingFilters}
        onUpdateFilter={data.updateFilter}
      />

      {/* Desktop: side-by-side layout. Mobile: stacked */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Feed list — 60% on desktop */}
        <div className="w-full lg:w-[60%]">
          <IncidentList
            items={data.items}
            pagedItems={data.pagedItems}
            isLoadingFeed={data.isLoadingFeed}
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            expandedId={data.expandedId}
            activeRequestType={data.filters.requestType}
            onPageChange={data.setCurrentPage}
            onToggleExpand={(id) => data.setExpandedId(data.expandedId === id ? null : id)}
            onFilterByType={handleFilterByType}
          />
        </div>

        {/* Charts — 40% on desktop, sticky sidebar */}
        <div className="w-full lg:w-[40%]">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Insights
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setChartsOpen((prev) => !prev)}
              >
                {chartsOpen ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show
                  </>
                )}
              </Button>
            </div>

            {chartsOpen && (
              <div className="space-y-4">
                <TypeBreakdownChart
                  data={data.typeBreakdown}
                  isLoading={data.isLoadingChart}
                  activeRequestType={data.filters.requestType}
                  onBarClick={data.handleBarClick}
                />
                <YearTrendChart data={data.yearTrend} isLoading={data.isLoadingTrend} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

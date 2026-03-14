"use client";

import { Activity, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatsSummary } from "./types";
import { formatDuration, formatNumber } from "./utils";

interface NewsfeedHeaderProps {
  stats: StatsSummary;
  avgResolutionTime: number | null;
  isLoadingStats: boolean;
  isLoadingFeed: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export function NewsfeedHeader({
  stats,
  avgResolutionTime,
  isLoadingStats,
  isLoadingFeed,
  isLoading,
  onRefresh,
}: NewsfeedHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <h2 className="text-lg font-semibold">311 Service Requests</h2>
      </div>

      {/* Inline stats */}
      {!isLoadingStats && (
        <div className="flex items-center gap-3 text-sm tabular-nums">
          <span className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold">{formatNumber(stats.total)}</span>
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {formatNumber(stats.open)}
          </span>
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {formatNumber(stats.closed)}
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            {formatNumber(stats.inProgress)}
          </span>
          {avgResolutionTime && !isLoadingFeed && (
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              Avg: {formatDuration(avgResolutionTime)}
            </span>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh</span>
      </Button>
    </div>
  );
}

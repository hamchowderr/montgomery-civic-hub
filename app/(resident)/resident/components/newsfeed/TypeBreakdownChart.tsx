"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TypeBreakdown } from "./types";
import { CHART_COLORS } from "./types";
import { formatNumber } from "./utils";

interface TypeBreakdownChartProps {
  data: TypeBreakdown[];
  isLoading: boolean;
  activeRequestType: string;
  onBarClick: (data: TypeBreakdown) => void;
}

export function TypeBreakdownChart({
  data,
  isLoading,
  activeRequestType,
  onBarClick,
}: TypeBreakdownChartProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Top Request Types</CardTitle>
          {!isLoading && data.length > 0 && (
            <span className="text-[10px] text-muted-foreground">Click a bar to filter</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
        ) : (
          <div className="space-y-1.5">
            {data.map((item, index) => {
              const maxVal = data[0]?.value ?? 1;
              const pct = (item.value / maxVal) * 100;
              const isActive = activeRequestType === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-all duration-150 ${
                    isActive
                      ? "bg-primary/10 ring-1 ring-primary/30 scale-[1.01]"
                      : "hover:bg-muted/60 hover:scale-[1.01]"
                  }`}
                  onClick={() => onBarClick(item)}
                >
                  <span
                    className="w-[110px] shrink-0 truncate text-xs text-muted-foreground group-hover:text-foreground transition-colors"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <div className="relative flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-300 group-hover:opacity-100"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        opacity: isActive ? 1 : 0.7,
                      }}
                    />
                    <span className="relative z-10 flex h-full items-center px-2 text-[11px] font-semibold tabular-nums text-foreground">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

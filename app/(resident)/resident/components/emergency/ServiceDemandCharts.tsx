"use client";

import { AlertTriangle, ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import type { DistrictStat } from "./types";
import { CHART_COLORS, DEFAULT_STATUS_COLOR, STATUS_COLORS } from "./types";
import { formatNumber } from "./utils";

interface ServiceDemandChartsProps {
  districtDemand: DistrictStat[];
  statusBreakdown: DistrictStat[];
  isLoading: boolean;
}

function useDefaultOpen() {
  // Default open on desktop (>= 1024px), collapsed on mobile
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });
  return [isOpen, setIsOpen] as const;
}

export function ServiceDemandCharts({
  districtDemand,
  statusBreakdown,
  isLoading,
}: ServiceDemandChartsProps) {
  const [isOpen, setIsOpen] = useDefaultOpen();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-2 transition-colors hover:bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              311 Service Demand
              <ChevronDown
                className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left -- District Demand Custom Bar Chart */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Requests by District</h3>
                  {!isLoading && districtDemand.length > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] font-normal tabular-nums"
                    >
                      {formatNumber(districtDemand.reduce((s, d) => s + d.value, 0))} total
                    </Badge>
                  )}
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 flex-1 rounded" />
                      </div>
                    ))}
                  </div>
                ) : districtDemand.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No district data available
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {districtDemand.map((item, index) => {
                      const maxVal = districtDemand[0]?.value ?? 1;
                      const pct = (item.value / maxVal) * 100;
                      return (
                        <div
                          key={item.group}
                          className="group flex w-full items-center gap-3 rounded-md px-2 py-1.5"
                        >
                          <span
                            className="w-[80px] shrink-0 truncate text-xs text-muted-foreground"
                            title={item.group}
                          >
                            {item.group}
                          </span>
                          <div className="relative flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                opacity: 0.75,
                              }}
                            />
                            <span className="relative z-10 flex h-full items-center px-2 text-[11px] font-semibold tabular-nums text-foreground">
                              {formatNumber(item.value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right -- Status Donut Chart */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Resolution Rate</h3>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-[220px] w-[220px] rounded-full" />
                  </div>
                ) : statusBreakdown.length === 0 ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    No status data available
                  </div>
                ) : (
                  (() => {
                    const total = statusBreakdown.reduce((s, d) => s + d.value, 0);
                    const closedCount =
                      statusBreakdown.find((d) => d.group === "Closed")?.value ?? 0;
                    const resolutionPct =
                      total > 0 ? ((closedCount / total) * 100).toFixed(0) : "0";
                    return (
                      <div className="flex flex-col items-center gap-4">
                        {/* Donut with center stat */}
                        <div className="relative">
                          <ResponsiveContainer width={220} height={220}>
                            <PieChart>
                              <Pie
                                data={statusBreakdown}
                                dataKey="value"
                                nameKey="group"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={105}
                                paddingAngle={3}
                                strokeWidth={0}
                              >
                                {statusBreakdown.map((entry) => (
                                  <Cell
                                    key={entry.group}
                                    fill={STATUS_COLORS[entry.group] ?? DEFAULT_STATUS_COLOR}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => [value.toLocaleString(), "Requests"]}
                                contentStyle={{
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  border: "1px solid hsl(var(--border))",
                                  background: "hsl(var(--popover))",
                                  color: "hsl(var(--popover-foreground))",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Center stat overlay */}
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold tabular-nums">
                              {resolutionPct}%
                            </span>
                            <span className="text-[11px] text-muted-foreground">Resolved</span>
                          </div>
                        </div>

                        {/* Legend items */}
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                          {statusBreakdown.map((entry) => {
                            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
                            return (
                              <div key={entry.group} className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      STATUS_COLORS[entry.group] ?? DEFAULT_STATUS_COLOR,
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">{entry.group}</span>
                                <span className="text-xs font-semibold tabular-nums">
                                  {formatNumber(entry.value)} ({pct}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

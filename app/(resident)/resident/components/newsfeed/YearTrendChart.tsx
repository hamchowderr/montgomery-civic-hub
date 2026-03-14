"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { YearTrend } from "./types";
import { CHART_TOOLTIP_STYLE } from "./types";
import { formatNumber } from "./utils";

interface YearTrendChartProps {
  data: YearTrend[];
  isLoading: boolean;
}

export function YearTrendChart({ data, isLoading }: YearTrendChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 p-4 pb-1">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Request Volume by Year</CardTitle>
        {!isLoading && data.length > 1 && (
          <Badge variant="outline" className="ml-auto text-[10px] font-normal tabular-nums">
            {(() => {
              const last = data[data.length - 1];
              const prev = data[data.length - 2];
              if (!last || !prev || prev.count === 0) return null;
              const change = ((last.count - prev.count) / prev.count) * 100;
              return (
                <span
                  className={
                    change >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}% vs {prev.year}
                </span>
              );
            })()}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded" />
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No trend data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => String(v)}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => formatNumber(v)}
                width={50}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  ...CHART_TOOLTIP_STYLE,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [formatNumber(value), "Requests"]}
                labelFormatter={(label: number) => `Year ${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

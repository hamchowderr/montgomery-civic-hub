"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Skeleton loader for bar charts — used across all portal chart components.
 * Heights are decorative, so slight variation between portals is fine.
 */
export function SkeletonBars({ heights = [0.65, 0.55, 0.45, 0.4, 0.3] }: { heights?: number[] }) {
  return (
    <div className="flex h-[300px] w-full items-end justify-around gap-4 px-10 pb-16 pt-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-12 animate-pulse rounded-t bg-muted"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Simple legend for Pie/Donut charts.
 * Reads slice names directly from the Recharts legend payload
 * instead of relying on ChartConfig (which only has a single key for pies).
 */
export function PieLegendContent({
  payload,
}: {
  payload?: Array<{ value: string; color: string; type?: string }>;
}) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3">
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => (
          <div key={item.value} className="flex items-center gap-1.5 text-xs">
            <div
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {item.value}
          </div>
        ))}
    </div>
  );
}

/**
 * Custom label renderer for Pie/Donut charts.
 * Shows percentage on each slice so users don't need to hover.
 */
const RADIAN = Math.PI / 180;
export function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  // Skip tiny slices
  if (percent < 0.03) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-medium"
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/** Error state shown when chart data fails to load. */
export function ChartErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <AlertTriangle className="size-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

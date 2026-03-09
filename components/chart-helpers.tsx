"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Skeleton loader for bar charts — used across all portal chart components.
 * Heights are decorative, so slight variation between portals is fine.
 */
export function SkeletonBars({
  heights = [0.65, 0.55, 0.45, 0.4, 0.3],
}: {
  heights?: number[];
}) {
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

/** Error state shown when chart data fails to load. */
export function ChartErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <AlertTriangle className="size-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

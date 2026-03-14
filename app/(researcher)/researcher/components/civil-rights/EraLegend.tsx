"use client";

import { Badge } from "@/components/ui/badge";

import { ERA_COLORS } from "./types";

interface EraLegendProps {
  eras: string[];
}

export function EraLegend({ eras }: EraLegendProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {eras.map((era) => {
        const style = ERA_COLORS[era];
        if (!style) return null;
        return (
          <Badge
            key={era}
            variant="outline"
            className={`${style.bg} ${style.text} ${style.border} gap-1.5 px-2.5 py-0.5 text-[10px] font-medium`}
          >
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: style.hex }}
            />
            {era}
          </Badge>
        );
      })}
    </div>
  );
}

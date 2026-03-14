"use client";

import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ERA_COLORS, type TimelineLandmark } from "./types";

interface TimelineCardProps {
  landmark: TimelineLandmark;
  isSelected: boolean;
  onClick: () => void;
  layout: "horizontal" | "vertical";
  position?: "above" | "below";
}

export function TimelineCard({ landmark, isSelected, onClick, layout }: TimelineCardProps) {
  const eraStyle = ERA_COLORS[landmark.era] ?? ERA_COLORS["Legacy & Remembrance"];

  if (layout === "horizontal") {
    return (
      <button
        onClick={onClick}
        className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <div
          className={`relative overflow-hidden rounded-xl border bg-card transition-all duration-300 ${
            isSelected ? "-translate-y-1 shadow-2xl" : "hover:shadow-lg hover:-translate-y-0.5"
          }`}
          style={{
            borderColor: isSelected ? `${eraStyle.hex}60` : undefined,
            boxShadow: isSelected
              ? `0 8px 32px ${eraStyle.hex}20, 0 2px 8px rgba(0,0,0,0.08)`
              : undefined,
          }}
        >
          {/* Era color accent — left edge bar */}
          <div
            className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
            style={{ backgroundColor: eraStyle.hex }}
          />

          <div className="py-3.5 pl-4 pr-3 space-y-2">
            {/* Era + date row */}
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className={`${eraStyle.bg} ${eraStyle.text} ${eraStyle.border} text-[9px] px-1.5 py-0 leading-4 shrink-0`}
              >
                {landmark.era}
              </Badge>
              <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                {landmark.dateSpecific}
              </span>
            </div>

            {/* Event title */}
            <h3
              className={`text-sm font-bold leading-snug transition-colors duration-200 ${
                isSelected ? "" : "text-foreground"
              }`}
              style={isSelected ? { color: eraStyle.hex } : {}}
            >
              {landmark.event}
            </h3>

            {/* Full description — no truncation */}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {landmark.description}
            </p>

            {/* Key figures inline */}
            {landmark.keyFigures.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {landmark.keyFigures.slice(0, 3).map((figure) => (
                  <span
                    key={figure}
                    className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/80 bg-muted/50 rounded-full px-1.5 py-0.5"
                  >
                    <span
                      className="inline-block size-1 rounded-full shrink-0"
                      style={{ backgroundColor: eraStyle.hex }}
                    />
                    {figure}
                  </span>
                ))}
                {landmark.keyFigures.length > 3 && (
                  <span className="text-[9px] text-muted-foreground/60 px-1 py-0.5">
                    +{landmark.keyFigures.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer: location + arrow */}
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70 truncate max-w-[200px]">
                {landmark.name}
              </p>
              <ChevronRight
                className={`size-3.5 shrink-0 transition-all duration-200 ${
                  isSelected
                    ? "translate-x-0.5"
                    : "text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5"
                }`}
                style={isSelected ? { color: eraStyle.hex } : {}}
              />
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Vertical layout for mobile — also expanded
  return (
    <button onClick={onClick} className="group w-full text-left focus-visible:outline-none">
      <div
        className={`relative overflow-hidden rounded-lg border bg-card transition-all duration-200 ${
          isSelected ? "shadow-lg" : "hover:shadow-md"
        }`}
        style={{
          borderColor: isSelected ? `${eraStyle.hex}50` : undefined,
          boxShadow: isSelected ? `0 4px 20px ${eraStyle.hex}15` : undefined,
        }}
      >
        {/* Era color accent — left edge bar */}
        <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: eraStyle.hex }} />

        <div className="py-3 pl-4 pr-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tabular-nums" style={{ color: eraStyle.hex }}>
              {landmark.year}
            </span>
            <Badge
              variant="outline"
              className={`${eraStyle.bg} ${eraStyle.text} ${eraStyle.border} text-[9px] px-1.5 py-0 leading-4`}
            >
              {landmark.era}
            </Badge>
            <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
              {landmark.dateSpecific}
            </span>
          </div>

          <h3 className="text-sm font-bold leading-snug">{landmark.event}</h3>

          <p className="text-xs leading-relaxed text-muted-foreground">{landmark.description}</p>

          {/* Key figures */}
          {landmark.keyFigures.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {landmark.keyFigures.slice(0, 3).map((figure) => (
                <span
                  key={figure}
                  className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/80 bg-muted/50 rounded-full px-1.5 py-0.5"
                >
                  <span
                    className="inline-block size-1 rounded-full shrink-0"
                    style={{ backgroundColor: eraStyle.hex }}
                  />
                  {figure}
                </span>
              ))}
              {landmark.keyFigures.length > 3 && (
                <span className="text-[9px] text-muted-foreground/60 px-1 py-0.5">
                  +{landmark.keyFigures.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70 truncate">
              {landmark.name}
            </p>
            <ChevronRight
              className="size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5"
              style={isSelected ? { color: eraStyle.hex } : {}}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

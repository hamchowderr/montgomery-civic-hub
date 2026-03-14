"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  ImageIcon,
  Link2,
  MapPin,
  Quote,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ERA_COLORS, type TimelineLandmark } from "./types";
import { formatCoordinate } from "./utils";

interface DetailPanelProps {
  landmark: TimelineLandmark;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function DetailPanel({
  landmark,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}: DetailPanelProps) {
  const eraStyle = ERA_COLORS[landmark.era] ?? ERA_COLORS["Legacy & Remembrance"];

  return (
    <div className="relative h-full flex flex-col">
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 z-10"
        style={{
          background: `linear-gradient(90deg, ${eraStyle.hex}, ${eraStyle.hex}60, transparent)`,
        }}
      />

      {/* Header row */}
      <div className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3 pb-2 sm:px-5 border-b border-border/50">
        <span
          className="text-2xl font-black tabular-nums tracking-tighter leading-none"
          style={{ color: eraStyle.hex }}
        >
          {landmark.year}
        </span>
        <Badge
          variant="outline"
          className={`${eraStyle.bg} ${eraStyle.text} ${eraStyle.border} text-[10px] font-medium`}
        >
          {landmark.era}
        </Badge>
        <h2 className="text-sm font-bold leading-tight">{landmark.event}</h2>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {landmark.dateSpecific}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="size-2.5 shrink-0" style={{ color: eraStyle.hex }} />
          {landmark.name}
          <span className="text-muted-foreground/40 ml-1">
            {formatCoordinate(landmark.coordinates[0], landmark.coordinates[1])}
          </span>
        </span>

        {/* Navigation arrows + close */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {onPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-full hover:bg-muted"
              onClick={onPrev}
              aria-label="Previous landmark"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
          )}
          {totalCount != null && currentIndex != null && (
            <span className="text-[10px] text-muted-foreground tabular-nums min-w-[3ch] text-center">
              {currentIndex + 1}/{totalCount}
            </span>
          )}
          {onNext && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-full hover:bg-muted"
              onClick={onNext}
              aria-label="Next landmark"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-full hover:bg-muted"
            onClick={onClose}
          >
            <X className="size-3" />
          </Button>
        </div>
      </div>

      {/* Body: image + content side by side */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
        {/* Image panel */}
        <div className="shrink-0 sm:w-[280px] h-[160px] sm:h-full relative bg-muted/30 border-b sm:border-b-0 sm:border-r border-border/50">
          {landmark.imageUrl ? (
            <img
              src={landmark.imageUrl}
              alt={landmark.imageCaption || landmark.event}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
              <ImageIcon className="size-8" />
              <span className="text-[10px]">No image available</span>
            </div>
          )}
          {/* Image caption overlay */}
          {landmark.imageCaption && landmark.imageUrl && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <p className="text-[10px] leading-relaxed text-white/90 italic line-clamp-2">
                {landmark.imageCaption}
              </p>
            </div>
          )}
        </div>

        {/* Content panel — scrollable with hidden scrollbar */}
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="px-4 py-3 sm:px-5 space-y-3">
            {/* Summary description */}
            <p className="text-xs leading-relaxed text-foreground font-medium">
              {landmark.description}
            </p>

            {/* Main content grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* The Story */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Quote className="size-3" style={{ color: eraStyle.hex }} />
                  The Story
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {landmark.details}
                </p>
              </div>

              {/* Historical Context */}
              {landmark.historicalContext && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="size-3" style={{ color: eraStyle.hex }} />
                    Historical Context
                  </h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {landmark.historicalContext}
                  </p>
                </div>
              )}
            </div>

            {/* Second row: Impact + Legacy Today + Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Impact */}
              <div
                className="relative rounded-lg border px-3 py-2"
                style={{
                  borderColor: `${eraStyle.hex}25`,
                  backgroundColor: `${eraStyle.hex}06`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-0.5 rounded-full"
                  style={{ backgroundColor: eraStyle.hex }}
                />
                <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 pl-2">
                  <Sparkles className="size-3" style={{ color: eraStyle.hex }} />
                  <span style={{ color: eraStyle.hex }}>Impact</span>
                </h3>
                <p className="text-[11px] leading-relaxed text-foreground pl-2">
                  {landmark.outcome}
                </p>
              </div>

              {/* Legacy Today */}
              {landmark.legacyToday && (
                <div
                  className="relative rounded-lg border px-3 py-2"
                  style={{
                    borderColor: `${eraStyle.hex}15`,
                    backgroundColor: `${eraStyle.hex}04`,
                  }}
                >
                  <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                    <Globe className="size-3" style={{ color: eraStyle.hex }} />
                    Today
                  </h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {landmark.legacyToday}
                  </p>
                </div>
              )}

              {/* Key Figures + Related Events */}
              <div className="space-y-2.5">
                {landmark.keyFigures.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Users className="size-3" style={{ color: eraStyle.hex }} />
                      Key Figures
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {landmark.keyFigures.map((figure) => (
                        <Badge
                          key={figure}
                          variant="secondary"
                          className="gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        >
                          <span
                            className="inline-block size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: eraStyle.hex }}
                          />
                          {figure}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {landmark.relatedEvents?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Link2 className="size-3" style={{ color: eraStyle.hex }} />
                      Connected Events
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {landmark.relatedEvents.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

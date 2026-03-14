"use client";

import type { RefObject } from "react";

import { TimelineCard } from "./TimelineCard";
import { ERA_COLORS, GOLD, type TimelineLandmark } from "./types";

interface TimelineRailProps {
  landmarks: TimelineLandmark[];
  selectedName: string | null;
  onSelect: (landmark: TimelineLandmark) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: (direction: "left" | "right") => void;
}

export function TimelineRail({ landmarks, selectedName, onSelect }: TimelineRailProps) {
  return (
    <div className="flex w-full flex-col">
      {/* Desktop: vertical two-column timeline — cards alternate left/right */}
      <div className="hidden sm:block">
        <div className="relative mx-auto max-w-5xl px-4 py-8">
          {/* Central vertical rail */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${GOLD}40 3%, ${GOLD}40 97%, transparent 100%)`,
            }}
          />

          {/* Era-colored overlays on the rail */}
          {(() => {
            const groups: { era: string; startIdx: number; endIdx: number }[] = [];
            let currentEra = "";
            for (let i = 0; i < landmarks.length; i++) {
              if (landmarks[i].era !== currentEra) {
                currentEra = landmarks[i].era;
                groups.push({ era: currentEra, startIdx: i, endIdx: i });
              } else {
                groups[groups.length - 1].endIdx = i;
              }
            }
            // Approximate vertical position based on index
            return groups.map((group) => {
              const eraStyle = ERA_COLORS[group.era];
              if (!eraStyle) return null;
              const topPercent = (group.startIdx / landmarks.length) * 100;
              const heightPercent = ((group.endIdx - group.startIdx + 1) / landmarks.length) * 100;
              return (
                <div
                  key={group.era}
                  className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full"
                  style={{
                    top: `${topPercent}%`,
                    height: `${heightPercent}%`,
                    backgroundColor: `${eraStyle.hex}50`,
                  }}
                />
              );
            });
          })()}

          {/* Landmark items */}
          <div className="relative space-y-4">
            {landmarks.map((landmark, index) => {
              const isSelected = selectedName === landmark.name;
              const isLeft = index % 2 === 0;
              const eraStyle = ERA_COLORS[landmark.era] ?? ERA_COLORS["Legacy & Remembrance"];

              return (
                <div
                  key={`${landmark.name}-${landmark.year}`}
                  className="relative flex items-center"
                >
                  {/* Left card or spacer */}
                  <div className="w-[calc(50%-28px)] pr-4">
                    {isLeft && (
                      <div className="flex justify-end">
                        <TimelineCard
                          landmark={landmark}
                          isSelected={isSelected}
                          onClick={() => onSelect(landmark)}
                          layout="horizontal"
                          position="above"
                        />
                      </div>
                    )}
                  </div>

                  {/* Center dot */}
                  <div className="relative z-20 flex shrink-0 items-center justify-center w-14">
                    <button
                      onClick={() => onSelect(landmark)}
                      className="group relative flex items-center justify-center focus-visible:outline-none"
                      aria-label={`${landmark.event}, ${landmark.year}`}
                    >
                      {isSelected && (
                        <span
                          className="absolute size-7 animate-ping rounded-full opacity-20"
                          style={{ backgroundColor: eraStyle.hex }}
                        />
                      )}
                      <span
                        className={`relative z-10 block rounded-full border-[2.5px] transition-all duration-300 ${
                          isSelected ? "size-5 shadow-lg" : "size-3.5 group-hover:size-4"
                        }`}
                        style={{
                          borderColor: eraStyle.hex,
                          backgroundColor: isSelected ? eraStyle.hex : "var(--background)",
                          boxShadow: isSelected ? `0 0 16px ${eraStyle.hex}50` : "none",
                        }}
                      />
                    </button>
                    {/* Year label next to dot */}
                    <span
                      className={`absolute text-[11px] font-bold tabular-nums tracking-wide whitespace-nowrap ${
                        isLeft ? "left-full ml-1" : "right-full mr-1"
                      }`}
                      style={{ color: eraStyle.hex }}
                    >
                      {landmark.year}
                    </span>
                  </div>

                  {/* Right card or spacer */}
                  <div className="w-[calc(50%-28px)] pl-4">
                    {!isLeft && (
                      <div className="flex justify-start">
                        <TimelineCard
                          landmark={landmark}
                          isSelected={isSelected}
                          onClick={() => onSelect(landmark)}
                          layout="horizontal"
                          position="below"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: vertical timeline */}
      <div className="sm:hidden overflow-y-auto">
        <div className="relative flex flex-col px-4 py-4">
          {/* Vertical rail line */}
          <div
            className="absolute left-[26px] top-0 bottom-0 w-[2px]"
            style={{ backgroundColor: `${GOLD}25` }}
          />

          {landmarks.map((landmark, index) => {
            const isSelected = selectedName === landmark.name;
            const isLast = index === landmarks.length - 1;
            const eraStyle = ERA_COLORS[landmark.era] ?? ERA_COLORS["Legacy & Remembrance"];

            return (
              <div
                key={`${landmark.name}-${landmark.year}`}
                className="relative flex gap-4 mb-4 last:mb-0"
              >
                {/* Rail dot column */}
                <div className="flex flex-col items-center shrink-0 w-[18px] pt-3">
                  <div
                    className={`relative z-10 rounded-full border-2 transition-all duration-200 ${
                      isSelected ? "size-4 shadow-md" : "size-3"
                    }`}
                    style={{
                      borderColor: eraStyle.hex,
                      backgroundColor: isSelected ? eraStyle.hex : "var(--background)",
                      boxShadow: isSelected ? `0 0 10px ${eraStyle.hex}40` : "none",
                    }}
                  />
                  {/* Colored segment to next dot */}
                  {!isLast && (
                    <div
                      className="w-[2px] flex-1 mt-1.5"
                      style={{ backgroundColor: `${eraStyle.hex}30` }}
                    />
                  )}
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0">
                  <TimelineCard
                    landmark={landmark}
                    isSelected={isSelected}
                    onClick={() => onSelect(landmark)}
                    layout="vertical"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

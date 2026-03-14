"use client";

import { Calendar, GripHorizontal } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { DetailPanel } from "./DetailPanel";
import { EraLegend } from "./EraLegend";
import { TimelineRail } from "./TimelineRail";
import { type CivilRightsTimelineProps, GOLD } from "./types";
import { useCivilRightsData } from "./useCivilRightsData";

function VerticalHandle() {
  return (
    <Separator className="relative flex h-[3px] w-full items-center justify-center bg-border after:absolute after:inset-x-0 after:top-1/2 after:h-2 after:-translate-y-1/2 hover:bg-primary/30 transition-colors">
      <div className="z-10 flex h-3 w-4 items-center justify-center rounded-sm border bg-border">
        <GripHorizontal size={10} />
      </div>
    </Separator>
  );
}

export function CivilRightsTimeline({ onSelectLandmark }: CivilRightsTimelineProps) {
  const {
    landmarks,
    selectedName,
    setSelectedName,
    selectedLandmark,
    eras,
    handleSelect,
    scrollTimeline,
    scrollRef,
  } = useCivilRightsData({ onSelectLandmark });

  const selectedIndex = useMemo(
    () => landmarks.findIndex((l) => l.name === selectedName),
    [landmarks, selectedName],
  );

  const goToPrev = useCallback(() => {
    if (selectedIndex > 0) {
      const prev = landmarks[selectedIndex - 1];
      setSelectedName(prev.name);
      onSelectLandmark?.(prev);
    }
  }, [landmarks, selectedIndex, setSelectedName, onSelectLandmark]);

  const goToNext = useCallback(() => {
    if (selectedIndex < landmarks.length - 1) {
      const next = landmarks[selectedIndex + 1];
      setSelectedName(next.name);
      onSelectLandmark?.(next);
    }
  }, [landmarks, selectedIndex, setSelectedName, onSelectLandmark]);

  if (landmarks.length === 0) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header bar */}
      <div className="shrink-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${GOLD}15` }}
          >
            <Calendar className="size-3.5" style={{ color: GOLD }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight truncate">
              Montgomery Civil Rights Timeline
            </h2>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              {landmarks.length} historic sites &middot; {landmarks[0]?.year}–
              {landmarks[landmarks.length - 1]?.year}
            </p>
          </div>
        </div>
        <EraLegend eras={eras} />
      </div>

      {/* Content area */}
      {selectedLandmark ? (
        /* Resizable split: timeline top, detail bottom */
        <div className="min-h-0 flex-1">
          <Group orientation="vertical" style={{ display: "flex", height: "100%", width: "100%" }}>
            <Panel defaultSize="50%" minSize="25%" className="overflow-hidden">
              <div className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TimelineRail
                  landmarks={landmarks}
                  selectedName={selectedName}
                  onSelect={handleSelect}
                  scrollRef={scrollRef}
                  onScroll={scrollTimeline}
                />
              </div>
            </Panel>
            <VerticalHandle />
            <Panel defaultSize="50%" minSize="20%" className="overflow-hidden">
              <DetailPanel
                landmark={selectedLandmark}
                onClose={() => setSelectedName(null)}
                onPrev={selectedIndex > 0 ? goToPrev : undefined}
                onNext={selectedIndex < landmarks.length - 1 ? goToNext : undefined}
                currentIndex={selectedIndex}
                totalCount={landmarks.length}
              />
            </Panel>
          </Group>
        </div>
      ) : (
        /* No selection — timeline takes full space */
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TimelineRail
            landmarks={landmarks}
            selectedName={selectedName}
            onSelect={handleSelect}
            scrollRef={scrollRef}
            onScroll={scrollTimeline}
          />
        </div>
      )}
    </div>
  );
}

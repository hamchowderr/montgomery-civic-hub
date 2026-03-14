"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Building2, CalendarRange, Landmark, Phone, Radio, Table2, Users } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, MapPin } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYearFilter } from "@/lib/contexts/year-filter";

// ── Layer filter slot context ─────────────────────────────────────────────────
// Allows map components to portal their layer filter into the DataPanel header.

const LayerFilterSlotContext = createContext<HTMLDivElement | null>(null);

/**
 * Renders children into the DataPanel header slot (next to the tab switcher).
 * Must be used inside a DataPanel > mapContent tree.
 */
export function LayerFilterPortal({ children }: { children: ReactNode }) {
  const slot = useContext(LayerFilterSlotContext);
  if (!slot) return null;
  return createPortal(children, slot);
}

// ── DataPanel ─────────────────────────────────────────────────────────────────

interface DataPanelProps {
  portalId: string;
  mapContent: React.ReactNode;
  tableContent: React.ReactNode;
  chartContent: React.ReactNode;
  landContent?: React.ReactNode;
  staffingContent?: React.ReactNode;
  emergencyContent?: React.ReactNode;
  newsfeedContent?: React.ReactNode;
  timelineContent?: React.ReactNode;
  defaultTab?:
    | "map"
    | "table"
    | "chart"
    | "land"
    | "staffing"
    | "emergency"
    | "newsfeed"
    | "timeline";
}

export function DataPanel({
  portalId,
  mapContent,
  tableContent,
  chartContent,
  landContent,
  staffingContent,
  emergencyContent,
  newsfeedContent,
  timelineContent,
  defaultTab = "map",
}: DataPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(() => new Set([defaultTab]));
  const { yearRange, setFrom, setTo, yearOptions } = useYearFilter();
  const [slotNode, setSlotNode] = useState<HTMLDivElement | null>(null);
  const slotRef = useCallback((node: HTMLDivElement | null) => {
    setSlotNode(node);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setMountedTabs((prev) => {
      if (prev.has(value)) return prev;
      const next = new Set(prev);
      next.add(value);
      return next;
    });
  };

  // AI-readable: current data panel state
  useCopilotReadable({
    description: "Data panel state including active tab and year range filter",
    value: {
      activeTab,
      yearRange: { from: yearRange.from, to: yearRange.to },
      availableYears: yearOptions,
    },
  });

  // AI action: switch tabs
  useCopilotAction({
    name: "switch_data_tab",
    description: "Switch the data panel view between Map, Table, Chart, and Land tabs",
    parameters: [
      {
        name: "tab",
        type: "string",
        description: "The tab to switch to",
        required: true,
        enum: [
          "map",
          "table",
          "chart",
          ...(landContent ? ["land"] : []),
          ...(staffingContent ? ["staffing"] : []),
          ...(emergencyContent ? ["emergency"] : []),
          ...(newsfeedContent ? ["newsfeed"] : []),
          ...(timelineContent ? ["timeline"] : []),
        ],
      },
    ],
    handler: ({ tab }) => {
      handleTabChange(tab);
      return `Switched to ${tab} view`;
    },
  });

  // AI action: set year range filter
  useCopilotAction({
    name: "set_year_range",
    description: "Set the year range filter for all data queries (maps, tables, charts)",
    parameters: [
      {
        name: "from",
        type: "number",
        description: "Start year (e.g. 2020)",
        required: true,
      },
      {
        name: "to",
        type: "number",
        description: "End year (e.g. 2024)",
        required: true,
      },
    ],
    handler: ({ from, to }) => {
      setFrom(from);
      setTo(to);
      return `Year range set to ${from}–${to}`;
    },
  });

  return (
    <div className="@container flex h-full flex-col overflow-hidden bg-card">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 w-full flex-1 flex-col"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-3 py-2">
          {/* Tabs — compact on narrow containers, labeled when space allows */}
          <TabsList className="gap-1 shrink-0">
            <TabsTrigger
              value="map"
              data-tour-step-id={`${portalId}-map-view`}
              className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
            >
              <MapPin size={16} />
              <span className="hidden @[440px]:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger
              value="table"
              data-tour-step-id={`${portalId}-table-view`}
              className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
            >
              <Table2 className="size-4" />
              <span className="hidden @[440px]:inline">Table</span>
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              data-tour-step-id={`${portalId}-chart-view`}
              className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
            >
              <BarChart3 size={16} />
              <span className="hidden @[440px]:inline">Chart</span>
            </TabsTrigger>
            {landContent && (
              <TabsTrigger
                value="land"
                data-tour-step-id="business-land-tab"
                className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
              >
                <Building2 className="size-4" />
                <span className="hidden @[440px]:inline">Properties</span>
              </TabsTrigger>
            )}
            {staffingContent && (
              <TabsTrigger
                value="staffing"
                data-tour-step-id="citystaff-staffing-tab"
                className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
              >
                <Users className="size-4" />
                <span className="hidden @[440px]:inline">Staffing</span>
              </TabsTrigger>
            )}
            {emergencyContent && (
              <TabsTrigger
                value="emergency"
                data-tour-step-id="resident-emergency-tab"
                className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
              >
                <Phone className="size-4" />
                <span className="hidden @[440px]:inline">Emergency</span>
              </TabsTrigger>
            )}
            {newsfeedContent && (
              <TabsTrigger
                value="newsfeed"
                data-tour-step-id="resident-newsfeed-tab"
                className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
              >
                <Radio className="size-4" />
                <span className="hidden @[440px]:inline">Incidents</span>
              </TabsTrigger>
            )}
            {timelineContent && (
              <TabsTrigger
                value="timeline"
                data-tour-step-id="researcher-timeline-tab"
                className="gap-1.5 px-2.5 @[440px]:gap-2 @[440px]:px-4"
              >
                <Landmark className="size-4" />
                <span className="hidden @[440px]:inline">Civil Rights</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Year filter + portal slot — wraps naturally when space is tight */}
          <div className="flex items-center gap-2 ml-auto">
            <div
              className="flex items-center gap-1.5"
              data-tour-step-id={`${portalId}-year-filter`}
            >
              <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" />
              <Select value={String(yearRange.from)} onValueChange={(v) => setFrom(Number(v))}>
                <SelectTrigger className="h-7 w-[76px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)} disabled={y > yearRange.to}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">to</span>
              <Select value={String(yearRange.to)} onValueChange={(v) => setTo(Number(v))}>
                <SelectTrigger className="h-7 w-[76px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)} disabled={y < yearRange.from}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Slot where map layer filter portals into */}
            <div
              ref={slotRef}
              className="flex items-center gap-2"
              data-tour-step-id={`${portalId}-layers`}
            />
          </div>
        </div>

        {/* Lazy-mount tabs on first visit; forceMount on map/table preserves MapLibre/scroll state once mounted */}
        <TabsContent value="map" forceMount className="flex-1 data-[state=inactive]:hidden">
          <LayerFilterSlotContext.Provider value={slotNode}>
            {mountedTabs.has("map") ? mapContent : null}
          </LayerFilterSlotContext.Provider>
        </TabsContent>
        <TabsContent
          value="table"
          forceMount
          className="flex-1 overflow-auto data-[state=inactive]:hidden"
        >
          {mountedTabs.has("table") ? tableContent : null}
        </TabsContent>
        <TabsContent value="chart" className="min-h-0 flex-1 overflow-auto p-4">
          {mountedTabs.has("chart") ? chartContent : null}
        </TabsContent>
        {landContent && (
          <TabsContent
            value="land"
            forceMount
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            {landContent}
          </TabsContent>
        )}
        {staffingContent && (
          <TabsContent
            value="staffing"
            forceMount
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            {staffingContent}
          </TabsContent>
        )}
        {emergencyContent && (
          <TabsContent
            value="emergency"
            forceMount
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            {emergencyContent}
          </TabsContent>
        )}
        {newsfeedContent && (
          <TabsContent
            value="newsfeed"
            forceMount
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            {newsfeedContent}
          </TabsContent>
        )}
        {timelineContent && (
          <TabsContent
            value="timeline"
            forceMount
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            {timelineContent}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

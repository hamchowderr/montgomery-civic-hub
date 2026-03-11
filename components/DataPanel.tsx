"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { BarChart3, CalendarRange, MapPin, Table2 } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
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
  defaultTab?: "map" | "table" | "chart";
}

export function DataPanel({
  portalId,
  mapContent,
  tableContent,
  chartContent,
  defaultTab = "map",
}: DataPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const { yearRange, setFrom, setTo, yearOptions } = useYearFilter();
  const [slotNode, setSlotNode] = useState<HTMLDivElement | null>(null);
  const slotRef = useCallback((node: HTMLDivElement | null) => {
    setSlotNode(node);
  }, []);

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
    description: "Switch the data panel view between Map, Table, and Chart tabs",
    parameters: [
      {
        name: "tab",
        type: "string",
        description: "The tab to switch to",
        required: true,
        enum: ["map", "table", "chart"],
      },
    ],
    handler: ({ tab }) => {
      setActiveTab(tab);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex w-full flex-1 flex-col">
        <div className="border-b px-3 py-2 flex flex-col gap-2 @[500px]:flex-row @[500px]:items-center @[500px]:justify-between @[500px]:px-fluid-sm">
          <TabsList className="gap-1">
            <TabsTrigger
              value="map"
              data-tour-step-id={`${portalId}-map-view`}
              className="gap-1.5 px-3 sm:gap-2 sm:px-5"
            >
              <MapPin className="size-4" />
              <span className="hidden @[400px]:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger
              value="table"
              data-tour-step-id={`${portalId}-table-view`}
              className="gap-1.5 px-3 sm:gap-2 sm:px-5"
            >
              <Table2 className="size-4" />
              <span className="hidden @[400px]:inline">Table</span>
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              data-tour-step-id={`${portalId}-chart-view`}
              className="gap-1.5 px-3 sm:gap-2 sm:px-5"
            >
              <BarChart3 className="size-4" />
              <span className="hidden @[400px]:inline">Chart</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Year filter */}
            <div className="flex items-center gap-2">
              <CalendarRange className="size-3.5 text-muted-foreground" />
              <Select value={String(yearRange.from)} onValueChange={(v) => setFrom(Number(v))}>
                <SelectTrigger className="h-7 w-[80px] text-xs">
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
                <SelectTrigger className="h-7 w-[80px] text-xs">
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
              className="flex items-center gap-4 [&>*+*]:border-l [&>*+*]:border-border [&>*+*]:pl-4"
            />
          </div>
        </div>

        {/* forceMount all tabs to preserve state across switches (avoids MapLibre re-init, table scroll reset, etc.) */}
        <TabsContent value="map" forceMount className="flex-1 data-[state=inactive]:hidden">
          <LayerFilterSlotContext.Provider value={slotNode}>
            {mapContent}
          </LayerFilterSlotContext.Provider>
        </TabsContent>
        <TabsContent
          value="table"
          forceMount
          className="flex-1 overflow-auto data-[state=inactive]:hidden"
        >
          {tableContent}
        </TabsContent>
        <TabsContent value="chart" className="flex-1 overflow-auto">
          {chartContent}
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Table2, BarChart3, CalendarRange } from "lucide-react";
import { useCopilotAction } from "@copilotkit/react-core";
import { useYearFilter } from "@/lib/contexts/year-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Layer filter slot context ─────────────────────────────────────────────────
const LayerFilterSlotContext = createContext<HTMLDivElement | null>(null);

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

  useCopilotAction({
    name: "switch_data_tab",
    description:
      "Switch the data panel view between Map, Table, and Chart tabs",
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

  return (
    <div className="@container/data flex h-full flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex w-full flex-1 flex-col"
      >
        {/* Header — compact on narrow, full on wide */}
        <div className="flex items-center justify-between border-b px-2 py-1.5 @[500px]/data:px-4 @[500px]/data:py-2">
          {/* Tabs — always visible, icon-only on narrow */}
          <TabsList className="gap-0.5 @[400px]/data:gap-1">
            <TabsTrigger
              value="map"
              data-tour-step-id={`${portalId}-map-view`}
              className="gap-1 px-2 @[400px]/data:gap-2 @[400px]/data:px-4"
            >
              <MapPin className="size-4" />
              <span className="sr-only @[400px]/data:not-sr-only">Map</span>
            </TabsTrigger>
            <TabsTrigger
              value="table"
              data-tour-step-id={`${portalId}-table-view`}
              className="gap-1 px-2 @[400px]/data:gap-2 @[400px]/data:px-4"
            >
              <Table2 className="size-4" />
              <span className="sr-only @[400px]/data:not-sr-only">Table</span>
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              data-tour-step-id={`${portalId}-chart-view`}
              className="gap-1 px-2 @[400px]/data:gap-2 @[400px]/data:px-4"
            >
              <BarChart3 className="size-4" />
              <span className="sr-only @[400px]/data:not-sr-only">Chart</span>
            </TabsTrigger>
          </TabsList>

          {/* Filters — hidden on narrow, AI handles them instead */}
          <div className="hidden @[520px]/data:flex items-center gap-2 @[600px]/data:gap-4">
            <div className="flex items-center gap-1.5">
              <CalendarRange className="size-3.5 text-muted-foreground" />
              <Select
                value={String(yearRange.from)}
                onValueChange={(v) => setFrom(Number(v))}
              >
                <SelectTrigger className="h-7 w-[72px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem
                      key={y}
                      value={String(y)}
                      disabled={y > yearRange.to}
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">to</span>
              <Select
                value={String(yearRange.to)}
                onValueChange={(v) => setTo(Number(v))}
              >
                <SelectTrigger className="h-7 w-[72px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem
                      key={y}
                      value={String(y)}
                      disabled={y < yearRange.from}
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Layer filter slot — only when there's room */}
            <div
              ref={slotRef}
              className="hidden @[700px]/data:flex items-center gap-4 [&>*+*]:border-l [&>*+*]:border-border [&>*+*]:pl-4"
            />
          </div>
        </div>

        <TabsContent
          value="map"
          forceMount
          className="flex-1 data-[state=inactive]:hidden"
        >
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

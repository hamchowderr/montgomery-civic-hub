"use client";

import { BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { NeighborhoodTable } from "./NeighborhoodTable";
import { SummaryStats } from "./SummaryStats";
import type { VacantProperty } from "./types";
import { ZoningChart } from "./ZoningChart";

interface AnalyticsPanelProps {
  properties: VacantProperty[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsPanel({ properties, open, onOpenChange }: AnalyticsPanelProps) {
  if (properties.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleContent>
        <div className="space-y-4 border-b px-4 py-4 sm:px-6">
          <SummaryStats properties={properties} />
          <div className="grid gap-3 lg:grid-cols-2">
            <ZoningChart properties={properties} />
            <NeighborhoodTable properties={properties} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Toggle button for the analytics panel, used in the filter toolbar */
export function AnalyticsToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onToggle}>
      <BarChart3 className="size-3" />
      Analytics
      {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
    </Button>
  );
}

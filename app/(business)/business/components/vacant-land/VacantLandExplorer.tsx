"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { FilterSheet } from "./FilterSheet";
import { FilterToolbar } from "./FilterToolbar";
import { PropertyDetail } from "./PropertyDetail";
import { PropertyDetailSheet } from "./PropertyDetailSheet";
import { PropertyList } from "./PropertyList";
import type { VacantProperty } from "./types";
import { useVacantLandData } from "./useVacantLandData";
import { classifyZoning, generateReuseSuggestions } from "./utils";

export function VacantLandExplorer() {
  const data = useVacantLandData();
  const [selectedProperty, setSelectedProperty] = useState<VacantProperty | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── CopilotKit readable ─────────────────────────────────────────────────

  useCopilotReadable({
    description:
      "Filtered city-owned properties with zoning, status, maintenance, and appraisal data",
    value: {
      total: data.properties.length,
      filtered: data.filtered.length,
      topProperties: data.filtered.slice(0, 10).map((p) => ({
        address: p.address,
        zoning: `${p.zoning} (${classifyZoning(p.zoning)})`,
        status: p.use,
        acreage: p.acreage,
        appraised: p.appraised,
        neighborhood: p.neighborhood,
        maintainedBy: p.maintainedBy,
        notes: p.notes,
      })),
    },
  });

  useCopilotReadable({
    description:
      "Neighborhood-level summary of city-owned properties with counts, acreage, value, and availability percentage",
    value: data.neighborhoodSummary,
  });

  // ── CopilotKit actions ──────────────────────────────────────────────────

  useCopilotAction({
    name: "filter_land_by_neighborhood",
    description: "Filter land explorer to specified neighborhoods",
    parameters: [
      {
        name: "neighborhoods",
        type: "string[]",
        description: "Array of neighborhood names to filter by",
        required: true,
      },
    ],
    handler: ({ neighborhoods }: { neighborhoods: string[] }) => {
      data.setSelectedNeighborhoods(new Set(neighborhoods));
      return `Filtered to neighborhoods: ${neighborhoods.join(", ")}`;
    },
  });

  useCopilotAction({
    name: "filter_land_by_status",
    description:
      "Filter properties by disposition status (AVAILABLE, HOLDING, USE, LEASED, DUE DILIGENCE)",
    parameters: [
      {
        name: "statuses",
        type: "string[]",
        description: "Array of disposition statuses",
        required: true,
      },
    ],
    handler: ({ statuses }: { statuses: string[] }) => {
      data.setSelectedDisposition(new Set(statuses));
      return `Filtered to statuses: ${statuses.join(", ")}`;
    },
  });

  useCopilotAction({
    name: "suggest_land_reuse",
    description:
      "Suggest reuse ideas for a city-owned property based on its zoning, acreage, and current use",
    parameters: [
      {
        name: "propertyAddress",
        type: "string",
        description: "Street address of the property",
        required: true,
      },
      {
        name: "zoningCode",
        type: "string",
        description: "Current zoning code (e.g. R-1, C-2)",
        required: true,
      },
      {
        name: "acreage",
        type: "number",
        description: "Property size in acres",
        required: true,
      },
      {
        name: "currentUse",
        type: "string",
        description: "Current use of the property",
        required: true,
      },
    ],
    handler: ({
      propertyAddress,
      zoningCode,
      acreage,
      currentUse,
    }: {
      propertyAddress: string;
      zoningCode: string;
      acreage: number;
      currentUse: string;
    }) => {
      const tempProperty: VacantProperty = {
        address: propertyAddress,
        zoning: zoningCode,
        acreage,
        use: currentUse,
        owner: "City of Montgomery",
        neighborhood: "Unknown",
        maintainedBy: "Unknown",
        appraised: 0,
        location: "",
        notes: "",
      };
      return generateReuseSuggestions(tempProperty);
    },
  });

  // ── Layout ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Filter Toolbar */}
      {!data.isLoading && (
        <FilterToolbar
          selectedZoning={data.selectedZoning}
          selectedDisposition={data.selectedDisposition}
          selectedManagedBy={data.selectedManagedBy}
          selectedNeighborhoods={data.selectedNeighborhoods}
          allNeighborhoods={data.allNeighborhoods}
          minAcreage={data.minAcreage}
          sortField={data.sortField}
          activeFilterCount={data.activeFilterCount}
          filteredCount={data.filtered.length}
          totalCount={data.properties.length}
          analyticsOpen={analyticsOpen}
          onAnalyticsToggle={() => setAnalyticsOpen((o) => !o)}
          toggleSet={data.toggleSet}
          toggleNeighborhood={data.toggleNeighborhood}
          setSelectedZoning={data.setSelectedZoning}
          setSelectedDisposition={data.setSelectedDisposition}
          setSelectedManagedBy={data.setSelectedManagedBy}
          setMinAcreage={data.setMinAcreage}
          setSortField={data.setSortField}
          clearAllFilters={data.clearAllFilters}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        />
      )}

      {/* Collapsible Analytics */}
      <AnalyticsPanel
        properties={data.filtered}
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />

      {/* Main content: Property list + Detail panel */}
      <div className="flex min-h-0 flex-1">
        {/* Property grid */}
        <div className="flex min-w-0 flex-1 flex-col">
          <PropertyList
            properties={data.filtered}
            isLoading={data.isLoading}
            error={data.error}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
          />
        </div>

        {/* Desktop detail panel */}
        {selectedProperty && (
          <div className="hidden lg:flex w-[440px] shrink-0 border-l">
            <PropertyDetail property={selectedProperty} onClose={() => setSelectedProperty(null)} />
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      <FilterSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        selectedZoning={data.selectedZoning}
        selectedDisposition={data.selectedDisposition}
        selectedManagedBy={data.selectedManagedBy}
        selectedNeighborhoods={data.selectedNeighborhoods}
        allNeighborhoods={data.allNeighborhoods}
        minAcreage={data.minAcreage}
        activeFilterCount={data.activeFilterCount}
        toggleSet={data.toggleSet}
        toggleNeighborhood={data.toggleNeighborhood}
        setSelectedZoning={data.setSelectedZoning}
        setSelectedDisposition={data.setSelectedDisposition}
        setSelectedManagedBy={data.setSelectedManagedBy}
        setMinAcreage={data.setMinAcreage}
        clearAllFilters={data.clearAllFilters}
      />

      {/* Mobile detail sheet */}
      <div className="lg:hidden">
        <PropertyDetailSheet
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      </div>
    </div>
  );
}

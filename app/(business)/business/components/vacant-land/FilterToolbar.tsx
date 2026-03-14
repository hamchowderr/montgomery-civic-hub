"use client";

import { Filter, SortAsc, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { AnalyticsToggle } from "./AnalyticsPanel";
import {
  DISPOSITION_LABELS,
  DISPOSITION_STATUSES,
  MANAGED_BY_CATEGORIES,
  type ManagedByCategory,
  SORT_OPTIONS,
  type SortField,
  ZONING_CATEGORIES,
  type ZoningCategory,
} from "./types";
import { dispositionColor } from "./utils";

interface FilterToolbarProps {
  // Filter state
  selectedZoning: Set<ZoningCategory>;
  selectedDisposition: Set<string>;
  selectedManagedBy: Set<ManagedByCategory>;
  selectedNeighborhoods: Set<string> | null;
  allNeighborhoods: string[];
  minAcreage: number;
  sortField: SortField;
  activeFilterCount: number;

  // Results
  filteredCount: number;
  totalCount: number;

  // Analytics
  analyticsOpen: boolean;
  onAnalyticsToggle: () => void;

  // Setters
  toggleSet: <T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => void;
  toggleNeighborhood: (n: string) => void;
  setSelectedZoning: React.Dispatch<React.SetStateAction<Set<ZoningCategory>>>;
  setSelectedDisposition: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedManagedBy: React.Dispatch<React.SetStateAction<Set<ManagedByCategory>>>;
  setMinAcreage: React.Dispatch<React.SetStateAction<number>>;
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;
  clearAllFilters: () => void;

  // Mobile
  onOpenMobileFilters: () => void;
}

export function FilterToolbar({
  selectedZoning,
  selectedDisposition,
  selectedManagedBy,
  selectedNeighborhoods,
  allNeighborhoods,
  minAcreage,
  sortField,
  activeFilterCount,
  filteredCount,
  totalCount,
  analyticsOpen,
  onAnalyticsToggle,
  toggleSet,
  toggleNeighborhood,
  setSelectedZoning,
  setSelectedDisposition,
  setSelectedManagedBy,
  setMinAcreage,
  setSortField,
  clearAllFilters,
  onOpenMobileFilters,
}: FilterToolbarProps) {
  return (
    <div className="border-b bg-muted/10 px-4 py-2.5 sm:px-6">
      {/* Desktop toolbar */}
      <div className="hidden lg:flex flex-wrap items-center gap-2">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1">
          {DISPOSITION_STATUSES.map((s) => {
            const active = selectedDisposition.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSet(setSelectedDisposition, s as string)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                  active
                    ? dispositionColor(s)
                    : "bg-muted/50 text-muted-foreground/60 border-transparent"
                }`}
              >
                {DISPOSITION_LABELS[s] ?? s}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Zoning popover */}
        <FilterPopover label="Zoning" count={ZONING_CATEGORIES.length - selectedZoning.size}>
          <div className="space-y-2.5">
            {ZONING_CATEGORIES.map((z) => (
              <label key={z} className="flex cursor-pointer items-center gap-2 text-xs">
                <Checkbox
                  checked={selectedZoning.has(z)}
                  onCheckedChange={() => toggleSet(setSelectedZoning, z)}
                  className="size-4"
                />
                <span>{z}</span>
              </label>
            ))}
          </div>
        </FilterPopover>

        {/* Managed By popover */}
        <FilterPopover
          label="Managed By"
          count={MANAGED_BY_CATEGORIES.length - selectedManagedBy.size}
        >
          <div className="space-y-2.5">
            {MANAGED_BY_CATEGORIES.map((cat) => (
              <label key={cat} className="flex cursor-pointer items-center gap-2 text-xs">
                <Checkbox
                  checked={selectedManagedBy.has(cat)}
                  onCheckedChange={() => toggleSet(setSelectedManagedBy, cat)}
                  className="size-4"
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </FilterPopover>

        {/* Neighborhood popover */}
        {allNeighborhoods.length > 0 && (
          <FilterPopover
            label="Neighborhood"
            count={selectedNeighborhoods ? allNeighborhoods.length - selectedNeighborhoods.size : 0}
          >
            <ScrollArea className="max-h-56">
              <div className="space-y-2.5 pr-2">
                {allNeighborhoods.map((n) => (
                  <label key={n} className="flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox
                      checked={selectedNeighborhoods?.has(n) ?? true}
                      onCheckedChange={() => toggleNeighborhood(n)}
                      className="size-4"
                    />
                    <span className="truncate">{n}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </FilterPopover>
        )}

        {/* Acreage popover */}
        <FilterPopover label="Acreage" count={minAcreage > 0 ? 1 : 0}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {minAcreage === 0 ? "No minimum" : `${minAcreage} acres+`}
              </span>
              {minAcreage > 0 && (
                <button
                  onClick={() => setMinAcreage(0)}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline"
                >
                  Reset
                </button>
              )}
            </div>
            <Slider
              value={[minAcreage]}
              onValueChange={([v]: number[]) => setMinAcreage(v)}
              min={0}
              max={50}
              step={0.5}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>50 acres</span>
            </div>
          </div>
        </FilterPopover>

        <div className="h-4 w-px bg-border" />

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <SortAsc className="size-3 text-muted-foreground" />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="h-7 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Analytics toggle */}
        <AnalyticsToggle open={analyticsOpen} onToggle={onAnalyticsToggle} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Result count */}
        <span className="text-xs font-medium text-foreground">
          {filteredCount}
          <span className="text-muted-foreground font-normal"> of {totalCount} properties</span>
        </span>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={clearAllFilters}
          >
            <X className="size-3" />
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Mobile toolbar */}
      <div className="flex lg:hidden items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onOpenMobileFilters}
        >
          <Filter className="size-3" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        <AnalyticsToggle open={analyticsOpen} onToggle={onAnalyticsToggle} />

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          {filteredCount} of {totalCount}
        </span>

        <div className="flex items-center gap-1.5">
          <SortAsc className="size-3 text-muted-foreground" />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="h-7 rounded-md border bg-background px-2 text-xs text-foreground outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Reusable filter popover ────────────────────────────────────────────────

function FilterPopover({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          {label}
          {count > 0 && (
            <Badge variant="default" className="h-4 min-w-[18px] px-1 text-[10px]">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <p className="text-xs font-semibold mb-3">{label}</p>
        {children}
      </PopoverContent>
    </Popover>
  );
}

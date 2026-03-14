"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  DISPOSITION_LABELS,
  DISPOSITION_STATUSES,
  MANAGED_BY_CATEGORIES,
  type ManagedByCategory,
  ZONING_CATEGORIES,
  type ZoningCategory,
} from "./types";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  selectedZoning: Set<ZoningCategory>;
  selectedDisposition: Set<string>;
  selectedManagedBy: Set<ManagedByCategory>;
  selectedNeighborhoods: Set<string> | null;
  allNeighborhoods: string[];
  minAcreage: number;
  activeFilterCount: number;

  toggleSet: <T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => void;
  toggleNeighborhood: (n: string) => void;
  setSelectedZoning: React.Dispatch<React.SetStateAction<Set<ZoningCategory>>>;
  setSelectedDisposition: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedManagedBy: React.Dispatch<React.SetStateAction<Set<ManagedByCategory>>>;
  setMinAcreage: React.Dispatch<React.SetStateAction<number>>;
  clearAllFilters: () => void;
}

export function FilterSheet({
  open,
  onOpenChange,
  selectedZoning,
  selectedDisposition,
  selectedManagedBy,
  selectedNeighborhoods,
  allNeighborhoods,
  minAcreage,
  activeFilterCount,
  toggleSet,
  toggleNeighborhood,
  setSelectedZoning,
  setSelectedDisposition,
  setSelectedManagedBy,
  setMinAcreage,
  clearAllFilters,
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Filter properties by status, zoning, and more</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-full max-h-[60vh] px-4 pb-4">
          <div className="space-y-6">
            {/* Status */}
            <FilterGroup title="Status">
              {DISPOSITION_STATUSES.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedDisposition.has(s)}
                    onCheckedChange={() => toggleSet(setSelectedDisposition, s as string)}
                  />
                  <span>{DISPOSITION_LABELS[s] ?? s}</span>
                </label>
              ))}
            </FilterGroup>

            {/* Zoning */}
            <FilterGroup title="Zoning">
              {ZONING_CATEGORIES.map((z) => (
                <label key={z} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedZoning.has(z)}
                    onCheckedChange={() => toggleSet(setSelectedZoning, z)}
                  />
                  <span>{z}</span>
                </label>
              ))}
            </FilterGroup>

            {/* Managed By */}
            <FilterGroup title="Managed By">
              {MANAGED_BY_CATEGORIES.map((cat) => (
                <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedManagedBy.has(cat)}
                    onCheckedChange={() => toggleSet(setSelectedManagedBy, cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </FilterGroup>

            {/* Neighborhood */}
            {allNeighborhoods.length > 0 && (
              <FilterGroup title="Neighborhood">
                {allNeighborhoods.map((n) => (
                  <label key={n} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedNeighborhoods?.has(n) ?? true}
                      onCheckedChange={() => toggleNeighborhood(n)}
                    />
                    <span className="truncate">{n}</span>
                  </label>
                ))}
              </FilterGroup>
            )}

            {/* Acreage */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Minimum Acreage</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {minAcreage === 0 ? "No minimum" : `${minAcreage} acres+`}
                </span>
                {minAcreage > 0 && (
                  <button
                    onClick={() => setMinAcreage(0)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
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
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  clearAllFilters();
                  onOpenChange(false);
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ARCGIS_URLS, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";
import {
  DISPOSITION_STATUSES,
  MANAGED_BY_CATEGORIES,
  type ManagedByCategory,
  type SortField,
  type VacantProperty,
  ZONING_CATEGORIES,
  type ZoningCategory,
} from "./types";
import { classifyManagedBy, classifyZoning, parseProperty, sortProperties } from "./utils";

// ── Hook Return Type ────────────────────────────────────────────────────────

export interface UseVacantLandDataReturn {
  // State
  properties: VacantProperty[];
  isLoading: boolean;
  error: string | null;
  selectedZoning: Set<ZoningCategory>;
  selectedDisposition: Set<string>;
  selectedManagedBy: Set<ManagedByCategory>;
  selectedNeighborhoods: Set<string> | null;
  minAcreage: number;
  sortField: SortField;

  // Computed
  allNeighborhoods: string[];
  filtered: VacantProperty[];
  activeFilterCount: number;
  neighborhoodSummary: {
    neighborhood: string;
    properties: number;
    totalAcres: number;
    totalValue: number;
    pctAvailable: number;
  }[];

  // Setters
  setSelectedZoning: React.Dispatch<React.SetStateAction<Set<ZoningCategory>>>;
  setSelectedDisposition: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedManagedBy: React.Dispatch<React.SetStateAction<Set<ManagedByCategory>>>;
  setSelectedNeighborhoods: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  setMinAcreage: React.Dispatch<React.SetStateAction<number>>;
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;

  // Helpers
  toggleSet: <T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => void;
  toggleNeighborhood: (n: string) => void;
  clearAllFilters: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useVacantLandData(): UseVacantLandDataReturn {
  // Core state
  const [properties, setProperties] = useState<VacantProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("acreage-desc");

  // Filter state
  const [selectedZoning, setSelectedZoning] = useState<Set<ZoningCategory>>(
    () => new Set(ZONING_CATEGORIES),
  );
  const [selectedDisposition, setSelectedDisposition] = useState<Set<string>>(
    () => new Set<string>(DISPOSITION_STATUSES),
  );
  const [selectedManagedBy, setSelectedManagedBy] = useState<Set<ManagedByCategory>>(
    () => new Set(MANAGED_BY_CATEGORIES),
  );
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string> | null>(null);
  const [minAcreage, setMinAcreage] = useState(0);

  // ── Computed: unique neighborhoods ──────────────────────────────────────────

  const allNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) set.add(p.neighborhood);
    return [...set].sort();
  }, [properties]);

  // ── Effect: initialize neighborhood filter once data loads ─────────────────

  useEffect(() => {
    if (properties.length > 0 && selectedNeighborhoods === null) {
      setSelectedNeighborhoods(new Set(allNeighborhoods));
    }
  }, [properties, allNeighborhoods, selectedNeighborhoods]);

  // ── Effect: fetch data ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const geojson = await queryFeaturesAsGeoJSON({
          url: ARCGIS_URLS.cityOwnedProperties,
          outFields:
            "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE,Maint_By,NBHD,APPRAISED_,LOCATION,NOTES",
          returnGeometry: false,
        });
        if (!cancelled) {
          const parsed = geojson.features.map(parseProperty);
          if (parsed.length === 0) {
            setError(
              "No properties returned from the server. The data source may be temporarily unavailable.",
            );
          }
          setProperties(parsed);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[VacantLandExplorer] fetch failed:", err);
        if (!cancelled) {
          setError("Failed to load property data. Please try again.");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Computed: filtered + sorted results ────────────────────────────────────

  const filtered = useMemo(() => {
    const result = properties.filter((p) => {
      if (!selectedZoning.has(classifyZoning(p.zoning))) return false;
      if (!selectedDisposition.has(p.use)) return false;
      if (!selectedManagedBy.has(classifyManagedBy(p.maintainedBy))) return false;
      if (selectedNeighborhoods && !selectedNeighborhoods.has(p.neighborhood)) return false;
      if (p.acreage < minAcreage) return false;
      return true;
    });
    return sortProperties(result, sortField);
  }, [
    properties,
    selectedZoning,
    selectedDisposition,
    selectedManagedBy,
    selectedNeighborhoods,
    minAcreage,
    sortField,
  ]);

  // ── Computed: active filter count ──────────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedZoning.size < ZONING_CATEGORIES.length) count++;
    if (selectedDisposition.size < DISPOSITION_STATUSES.length) count++;
    if (selectedManagedBy.size < MANAGED_BY_CATEGORIES.length) count++;
    if (selectedNeighborhoods && selectedNeighborhoods.size < allNeighborhoods.length) count++;
    if (minAcreage > 0) count++;
    return count;
  }, [
    selectedZoning,
    selectedDisposition,
    selectedManagedBy,
    selectedNeighborhoods,
    allNeighborhoods,
    minAcreage,
  ]);

  // ── Computed: neighborhood summary (for CopilotKit) ────────────────────────

  const neighborhoodSummary = useMemo(() => {
    const map = new Map<
      string,
      { count: number; acres: number; value: number; available: number }
    >();
    for (const p of filtered) {
      const row = map.get(p.neighborhood) ?? { count: 0, acres: 0, value: 0, available: 0 };
      row.count++;
      row.acres += p.acreage;
      row.value += p.appraised;
      if (p.use === "AVAILABLE") row.available++;
      map.set(p.neighborhood, row);
    }
    return [...map.entries()]
      .map(([name, r]) => ({
        neighborhood: name,
        properties: r.count,
        totalAcres: Math.round(r.acres * 10) / 10,
        totalValue: r.value,
        pctAvailable: r.count > 0 ? Math.round((r.available / r.count) * 100) : 0,
      }))
      .sort((a, b) => b.properties - a.properties)
      .slice(0, 15);
  }, [filtered]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleSet = useCallback(
    <T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });
    },
    [],
  );

  const toggleNeighborhood = useCallback((n: string) => {
    setSelectedNeighborhoods((prev) => {
      if (!prev) return prev;
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedZoning(new Set(ZONING_CATEGORIES));
    setSelectedDisposition(new Set<string>(DISPOSITION_STATUSES));
    setSelectedManagedBy(new Set(MANAGED_BY_CATEGORIES));
    setSelectedNeighborhoods(allNeighborhoods.length > 0 ? new Set(allNeighborhoods) : null);
    setMinAcreage(0);
  }, [allNeighborhoods]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    properties,
    isLoading,
    error,
    selectedZoning,
    selectedDisposition,
    selectedManagedBy,
    selectedNeighborhoods,
    minAcreage,
    sortField,

    // Computed
    allNeighborhoods,
    filtered,
    activeFilterCount,
    neighborhoodSummary,

    // Setters
    setSelectedZoning,
    setSelectedDisposition,
    setSelectedManagedBy,
    setSelectedNeighborhoods,
    setMinAcreage,
    setSortField,

    // Helpers
    toggleSet,
    toggleNeighborhood,
    clearAllFilters,
  };
}

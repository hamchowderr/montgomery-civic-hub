"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Filter, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ARCGIS_URLS, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface VacantProperty {
  address: string;
  owner: string;
  zoning: string;
  use: string;
  acreage: number;
  district: number;
}

interface VacantLandExplorerProps {
  onSelectProperty: (property: VacantProperty) => void;
}

// ── Filter constants ─────────────────────────────────────────────────────────

const DISTRICTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ZONING_CODES = ["R-1", "R-2", "C-1", "C-2", "M-1", "M-2", "Other"] as const;
type ZoningCode = (typeof ZONING_CODES)[number];

const USE_TYPES = ["Vacant", "Park", "Government", "Infrastructure", "Other"] as const;
type UseType = (typeof USE_TYPES)[number];

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyZoning(raw: string | undefined): ZoningCode {
  if (!raw) return "Other";
  const upper = raw.toUpperCase().trim();
  for (const code of ZONING_CODES) {
    if (code === "Other") continue;
    if (upper.startsWith(code)) return code;
  }
  return "Other";
}

function classifyUse(raw: string | undefined): UseType {
  if (!raw) return "Other";
  const lower = raw.toLowerCase();
  if (lower.includes("vacant")) return "Vacant";
  if (lower.includes("park") || lower.includes("recreation")) return "Park";
  if (lower.includes("government") || lower.includes("municipal") || lower.includes("city"))
    return "Government";
  if (
    lower.includes("infrastructure") ||
    lower.includes("utility") ||
    lower.includes("drainage") ||
    lower.includes("road")
  )
    return "Infrastructure";
  return "Other";
}

function parseProperty(feature: GeoJSON.Feature): VacantProperty {
  const p = feature.properties ?? {};
  return {
    address: String(p.PROP_ADDRE ?? "Unknown"),
    owner: String(p.OWNER1_1 ?? "City of Montgomery"),
    zoning: String(p.ZONING ?? "Unknown"),
    use: String(p.Use_ ?? "Unknown"),
    acreage: Number(p.CALC_ACRE ?? 0),
    district: Number(p.CouncilDist ?? 0),
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function VacantLandExplorer({ onSelectProperty }: VacantLandExplorerProps) {
  const [properties, setProperties] = useState<VacantProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter state
  const [selectedDistricts, setSelectedDistricts] = useState<Set<number>>(() => new Set(DISTRICTS));
  const [selectedZoning, setSelectedZoning] = useState<Set<ZoningCode>>(
    () => new Set(ZONING_CODES),
  );
  const [selectedUseTypes, setSelectedUseTypes] = useState<Set<UseType>>(() => new Set(USE_TYPES));
  const [minAcreage, setMinAcreage] = useState(0);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const geojson = await queryFeaturesAsGeoJSON({
          url: ARCGIS_URLS.cityOwnedProperties,
          outFields: "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE,CouncilDist",
        });
        if (!cancelled) {
          setProperties(geojson.features.map(parseProperty));
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered results
  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        if (!selectedDistricts.has(p.district)) return false;
        if (!selectedZoning.has(classifyZoning(p.zoning))) return false;
        if (!selectedUseTypes.has(classifyUse(p.use))) return false;
        if (p.acreage < minAcreage) return false;
        return true;
      }),
    [properties, selectedDistricts, selectedZoning, selectedUseTypes, minAcreage],
  );

  // Toggle helpers
  const toggleDistrict = useCallback((d: number) => {
    setSelectedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }, []);

  const toggleZoning = useCallback((z: ZoningCode) => {
    setSelectedZoning((prev) => {
      const next = new Set(prev);
      if (next.has(z)) next.delete(z);
      else next.add(z);
      return next;
    });
  }, []);

  const toggleUseType = useCallback((u: UseType) => {
    setSelectedUseTypes((prev) => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u);
      else next.add(u);
      return next;
    });
  }, []);

  // CopilotKit readable — top 10 filtered properties
  useCopilotReadable({
    description: "Filtered city-owned properties",
    value: filtered.slice(0, 10).map((p) => ({
      address: p.address,
      zoning: p.zoning,
      acreage: p.acreage,
      use: p.use,
    })),
  });

  // CopilotKit action — filter by district
  useCopilotAction({
    name: "filter_land_by_district",
    description: "Filter land explorer to specified council districts",
    parameters: [
      {
        name: "districts",
        type: "number[]",
        description: "Array of council district numbers (1-9)",
        required: true,
      },
    ],
    handler: ({ districts }: { districts: number[] }) => {
      setSelectedDistricts(new Set(districts));
      return `Filtered to districts: ${districts.join(", ")}`;
    },
  });

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-60 shrink-0 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* Districts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Council District</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {DISTRICTS.map((d) => (
                    <label key={d} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={selectedDistricts.has(d)}
                        onCheckedChange={() => toggleDistrict(d)}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              {/* Zoning */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Zoning</p>
                <div className="space-y-1.5">
                  {ZONING_CODES.map((z) => (
                    <label key={z} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={selectedZoning.has(z)}
                        onCheckedChange={() => toggleZoning(z)}
                      />
                      {z}
                    </label>
                  ))}
                </div>
              </div>

              {/* Use type */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Use Type</p>
                <div className="space-y-1.5">
                  {USE_TYPES.map((u) => (
                    <label key={u} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={selectedUseTypes.has(u)}
                        onCheckedChange={() => toggleUseType(u)}
                      />
                      {u}
                    </label>
                  ))}
                </div>
              </div>

              {/* Acreage slider */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Min Acreage: {minAcreage}
                </p>
                <Slider
                  value={[minAcreage]}
                  onValueChange={([v]) => setMinAcreage(v)}
                  min={0}
                  max={50}
                  step={0.5}
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Property cards */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setSidebarOpen(true)}
            >
              <Filter className="size-3.5" />
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {properties.length} properties
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-3 pb-2">
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-1.5">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ))
              : filtered.map((property, i) => (
                  <Card
                    key={`${property.address}-${i}`}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm leading-tight truncate">
                        {property.address}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {property.zoning}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {classifyUse(property.use)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {property.acreage.toFixed(2)} acres
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-full text-xs"
                        onClick={() => onSelectProperty(property)}
                      >
                        View on Map
                      </Button>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

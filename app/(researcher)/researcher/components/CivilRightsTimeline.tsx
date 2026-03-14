"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import {
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Library,
  MapPin,
  Quote,
  TreePine,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ARCGIS_URLS,
  queryFeatureCount,
  queryFeatureStats,
  queryTotalStats,
} from "@/lib/arcgis-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineLandmark {
  name: string;
  year: number;
  event: string;
  era: string;
  significance: string;
  description: string;
  details: string;
  keyFigures: string[];
  coordinates: [number, number];
  imageUrl: string;
  imageCaption: string;
  dateSpecific: string;
  outcome: string;
}

interface CivilRightsTimelineProps {
  onSelectLandmark?: (landmark: TimelineLandmark) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERA_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Before the Movement": {
    bg: "bg-stone-500/10",
    text: "text-stone-700 dark:text-stone-300",
    border: "border-stone-400/30",
    dot: "bg-stone-500",
  },
  "Bus Boycott Era": {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-400/30",
    dot: "bg-amber-500",
  },
  "Freedom Rides": {
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-400/30",
    dot: "bg-red-500",
  },
  "Voting Rights": {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-400/30",
    dot: "bg-blue-500",
  },
  "Legacy & Remembrance": {
    bg: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-400/30",
    dot: "bg-violet-500",
  },
};

const GOLD = "#D4AF37";

// ---------------------------------------------------------------------------
// Detail Panel (expanded view for a selected landmark)
// ---------------------------------------------------------------------------

function DetailPanel({ landmark, onClose }: { landmark: TimelineLandmark; onClose: () => void }) {
  const eraStyle = ERA_COLORS[landmark.era] ?? ERA_COLORS["Legacy & Remembrance"];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`${eraStyle.bg} ${eraStyle.text} ${eraStyle.border} text-[10px] font-medium`}
            >
              {landmark.era}
            </Badge>
            <span className="text-xs text-muted-foreground">{landmark.dateSpecific}</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
            {landmark.event}
          </h2>
          <p className="text-sm text-muted-foreground">{landmark.name}</p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 size-8" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        <div className="space-y-5 px-4 py-4 sm:px-6">
          {/* Image placeholder with gradient overlay */}
          <div className="relative overflow-hidden rounded-lg bg-muted aspect-[16/9]">
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)`,
              }}
            >
              <div className="text-center space-y-2 px-6">
                <BookOpen className="mx-auto size-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground/60 italic">{landmark.imageCaption}</p>
              </div>
            </div>
          </div>

          {/* Detailed narrative */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Quote className="size-3.5" style={{ color: GOLD }} />
              The Story
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{landmark.details}</p>
          </div>

          {/* Key Figures */}
          {landmark.keyFigures.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="size-3.5" style={{ color: GOLD }} />
                Key Figures
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {landmark.keyFigures.map((figure) => (
                  <Badge
                    key={figure}
                    variant="secondary"
                    className="text-xs font-normal px-2.5 py-0.5"
                  >
                    {figure}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Outcome */}
          <div className="rounded-lg border p-3 sm:p-4" style={{ borderColor: `${GOLD}30` }}>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: GOLD }}
            >
              Historical Impact
            </h3>
            <p className="text-sm leading-relaxed text-foreground">{landmark.outcome}</p>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{landmark.name}</p>
              <p className="text-xs text-muted-foreground">
                {landmark.coordinates[1].toFixed(4)}°N,{" "}
                {Math.abs(landmark.coordinates[0]).toFixed(4)}°W
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline Card
// ---------------------------------------------------------------------------

function TimelineCard({
  landmark,
  isSelected,
  onClick,
  layout,
}: {
  landmark: TimelineLandmark;
  isSelected: boolean;
  onClick: () => void;
  layout: "horizontal" | "vertical";
}) {
  const eraStyle = ERA_COLORS[landmark.era] ?? ERA_COLORS["Legacy & Remembrance"];

  if (layout === "horizontal") {
    return (
      <button
        onClick={onClick}
        className="group w-[260px] shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <Card
          className={`h-full transition-all duration-200 overflow-hidden ${
            isSelected
              ? "ring-2 shadow-lg -translate-y-1"
              : "hover:shadow-md hover:-translate-y-0.5"
          }`}
          style={
            isSelected
              ? ({
                  "--tw-ring-color": GOLD,
                  boxShadow: `0 4px 20px rgba(212, 175, 55, 0.2)`,
                } as React.CSSProperties)
              : {}
          }
        >
          {/* Mini image/color bar */}
          <div
            className="h-2 w-full"
            style={{
              background: `linear-gradient(90deg, ${GOLD}40 0%, ${GOLD}10 100%)`,
            }}
          />
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className={`${eraStyle.bg} ${eraStyle.text} ${eraStyle.border} text-[10px] shrink-0`}
              >
                {landmark.era}
              </Badge>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {landmark.dateSpecific}
              </span>
            </div>

            <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2">
              {landmark.event}
            </h3>

            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
              {landmark.description}
            </p>

            <div className="flex items-center justify-between pt-1">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest truncate"
                style={{ color: GOLD, opacity: 0.8 }}
              >
                {landmark.name}
              </p>
              <ChevronRight
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                style={isSelected ? { color: GOLD } : {}}
              />
            </div>
          </CardContent>
        </Card>
      </button>
    );
  }

  // Vertical layout for mobile
  return (
    <button onClick={onClick} className="group w-full text-left focus-visible:outline-none">
      <Card
        className={`transition-all duration-200 ${
          isSelected ? "ring-2 shadow-md" : "hover:shadow-sm"
        }`}
        style={
          isSelected
            ? ({
                "--tw-ring-color": GOLD,
                boxShadow: `0 2px 12px rgba(212, 175, 55, 0.15)`,
              } as React.CSSProperties)
            : {}
        }
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums" style={{ color: GOLD }}>
              {landmark.year}
            </span>
            <Badge
              variant="outline"
              className={`${eraStyle.bg} ${eraStyle.text} ${eraStyle.border} text-[10px]`}
            >
              {landmark.era}
            </Badge>
          </div>
          <h3 className="text-sm font-bold leading-snug">{landmark.event}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {landmark.description}
          </p>
          <div className="flex items-center justify-between">
            <p
              className="text-[10px] font-medium uppercase tracking-widest truncate"
              style={{ color: GOLD, opacity: 0.7 }}
            >
              {landmark.name}
            </p>
            <span className="text-[10px] text-muted-foreground">{landmark.dateSpecific}</span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Era Legend
// ---------------------------------------------------------------------------

function EraLegend({ eras }: { eras: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {eras.map((era) => {
        const style = ERA_COLORS[era];
        if (!style) return null;
        return (
          <div key={era} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${style.dot}`} />
            <span className="text-[10px] text-muted-foreground">{era}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demographics Donut Chart
// ---------------------------------------------------------------------------

const DEMO_COLORS = [
  "#6366f1", // White — indigo
  "#3b82f6", // Black — blue
  "#8b5cf6", // American Indian — violet
  "#06b6d4", // Asian — cyan
  "#14b8a6", // Pacific Islander — teal
  "#22c55e", // Other — green
  "#a855f7", // Two or More — purple
];

interface DemoSlice {
  name: string;
  value: number;
}

function DemographicsChart() {
  const [data, setData] = useState<DemoSlice[]>([]);
  const [households, setHouseholds] = useState<{ occupied: number; vacant: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stats = await queryTotalStats({
          url: ARCGIS_URLS.censusBlock,
          statistics: [
            { field: "P1_003N", type: "sum", alias: "white" },
            { field: "P1_004N", type: "sum", alias: "black" },
            { field: "P1_005N", type: "sum", alias: "americanIndian" },
            { field: "P1_006N", type: "sum", alias: "asian" },
            { field: "P1_007N", type: "sum", alias: "pacificIslander" },
            { field: "P1_008N", type: "sum", alias: "other" },
            { field: "P1_009N", type: "sum", alias: "twoOrMore" },
            { field: "OCC_HH", type: "sum", alias: "occHH" },
            { field: "VAC_HH", type: "sum", alias: "vacHH" },
          ],
        });

        if (cancelled) return;

        const slices: DemoSlice[] = [
          { name: "White", value: stats.white ?? 0 },
          { name: "Black", value: stats.black ?? 0 },
          { name: "American Indian", value: stats.americanIndian ?? 0 },
          { name: "Asian", value: stats.asian ?? 0 },
          { name: "Pacific Islander", value: stats.pacificIslander ?? 0 },
          { name: "Other", value: stats.other ?? 0 },
          { name: "Two or More", value: stats.twoOrMore ?? 0 },
        ].filter((s) => s.value > 0);

        setData(slices);
        setHouseholds({ occupied: stats.occHH ?? 0, vacant: stats.vacHH ?? 0 });
      } catch {
        // silently fail — skeleton stays
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useCopilotReadable({
    description: "Montgomery demographics racial breakdown from 2020 Census",
    value: data.length > 0 ? data : "Loading demographics...",
  });

  const totalPop = data.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold" style={{ color: GOLD }}>
          Montgomery Demographics (2020 Census)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="size-[200px] rounded-full" />
            <div className="space-y-2 flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut chart */}
            <div className="w-full sm:w-[320px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {data.map((_, index) => (
                      <Cell key={index} fill={DEMO_COLORS[index % DEMO_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Household stats sidebar */}
            <div className="flex-1 space-y-4">
              <div className="text-center sm:text-left">
                <p className="text-2xl font-bold">{totalPop.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Population</p>
              </div>
              {households && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-semibold">{households.occupied.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Occupied Households</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-semibold">{households.vacant.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Vacant Households</p>
                  </div>
                  <div className="col-span-2 rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Occupancy Rate:{" "}
                      <span className="font-semibold text-foreground">
                        {households.occupied + households.vacant > 0
                          ? (
                              (households.occupied / (households.occupied + households.vacant)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Equity Indicators Table
// ---------------------------------------------------------------------------

interface DistrictRow {
  district: number;
  requests311: number;
  violations: number;
  ratio: number;
}

function EquityIndicators() {
  const [rows, setRows] = useState<DistrictRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [stats311, statsViol] = await Promise.all([
          queryFeatureStats({
            url: ARCGIS_URLS.serviceRequests311,
            groupByField: "District",
            statisticField: "OBJECTID",
          }),
          queryFeatureStats({
            url: ARCGIS_URLS.codeViolations,
            groupByField: "CouncilDistrict",
            statisticField: "OffenceNum",
          }),
        ]);

        if (cancelled) return;

        // Normalize: extract numeric district from both datasets
        const extractNum = (s: string): number | null => {
          const m = s.match(/(\d+)/);
          return m ? parseInt(m[1], 10) : null;
        };

        const map311 = new Map<number, number>();
        for (const r of stats311) {
          const d = extractNum(r.group);
          if (d !== null) map311.set(d, (map311.get(d) ?? 0) + r.value);
        }

        const mapViol = new Map<number, number>();
        for (const r of statsViol) {
          const d = extractNum(r.group);
          if (d !== null) mapViol.set(d, (mapViol.get(d) ?? 0) + r.value);
        }

        // Merge all district numbers
        const allDistricts = new Set([...map311.keys(), ...mapViol.keys()]);
        const merged: DistrictRow[] = Array.from(allDistricts)
          .sort((a, b) => a - b)
          .map((district) => {
            const r = map311.get(district) ?? 0;
            const v = mapViol.get(district) ?? 0;
            return {
              district,
              requests311: r,
              violations: v,
              ratio: v > 0 ? parseFloat((r / v).toFixed(2)) : 0,
            };
          });

        setRows(merged);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useCopilotReadable({
    description:
      "Equity indicators by council district: 311 requests, code violations, service ratio",
    value: rows.length > 0 ? rows : "Loading equity data...",
  });

  // Color-code ratio: green for high service, red for low
  const ratioColor = (ratio: number): string => {
    if (ratio === 0) return "text-muted-foreground";
    const values = rows.map((r) => r.ratio).filter((r) => r > 0);
    if (values.length === 0) return "text-foreground";
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    if (ratio >= median * 1.2) return "text-emerald-600 dark:text-emerald-400";
    if (ratio <= median * 0.8) return "text-red-600 dark:text-red-400";
    return "text-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold" style={{ color: GOLD }}>
          Equity Indicators by District
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No district data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">District</TableHead>
                  <TableHead className="text-right">311 Requests</TableHead>
                  <TableHead className="text-right">Code Violations</TableHead>
                  <TableHead className="text-right">Service Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.district}>
                    <TableCell className="font-medium">District {row.district}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.requests311.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.violations.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-semibold ${ratioColor(row.ratio)}`}
                    >
                      {row.ratio > 0 ? row.ratio.toFixed(2) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Service Ratio = 311 Requests / Code Violations. Higher ratio indicates more
              resident-initiated service activity relative to enforcement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Montgomery Today Context Cards
// ---------------------------------------------------------------------------

interface CityMetric {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}

function MontgomeryToday() {
  const [metrics, setMetrics] = useState<CityMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [popStats, neighborhoods, centers, libraries, schools] = await Promise.all([
          queryTotalStats({
            url: ARCGIS_URLS.censusBlock,
            statistics: [{ field: "P1_001N", type: "sum", alias: "totalPop" }],
          }),
          queryFeatureCount(ARCGIS_URLS.neighborhoods),
          queryFeatureCount(ARCGIS_URLS.communityCenters),
          queryFeatureCount(ARCGIS_URLS.libraries),
          queryFeatureCount(ARCGIS_URLS.educationFacilities),
        ]);

        if (cancelled) return;

        setMetrics([
          {
            label: "Total Population",
            value: popStats.totalPop ?? null,
            icon: <Users className="size-5" />,
          },
          {
            label: "Neighborhoods",
            value: neighborhoods,
            icon: <TreePine className="size-5" />,
          },
          {
            label: "Community Centers",
            value: centers,
            icon: <Building2 className="size-5" />,
          },
          {
            label: "Libraries",
            value: libraries,
            icon: <Library className="size-5" />,
          },
          {
            label: "Schools",
            value: schools,
            icon: <GraduationCap className="size-5" />,
          },
        ]);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h3 className="text-base font-semibold mb-3" style={{ color: GOLD }}>
        Montgomery Today
      </h3>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <Card key={m.label} className="text-center">
              <CardContent className="flex flex-col items-center gap-2 py-4 px-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                >
                  {m.icon}
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {m.value !== null ? m.value.toLocaleString() : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CivilRightsTimeline({ onSelectLandmark }: CivilRightsTimelineProps) {
  const [landmarks, setLandmarks] = useState<TimelineLandmark[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/civil-rights-landmarks.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        const parsed = data.features
          .map((f) => ({
            name: (f.properties?.name as string) ?? "",
            year: (f.properties?.year as number) ?? 0,
            event: (f.properties?.event as string) ?? "",
            era: (f.properties?.era as string) ?? "Legacy & Remembrance",
            significance: (f.properties?.significance as string) ?? "heritage",
            description: (f.properties?.description as string) ?? "",
            details: (f.properties?.details as string) ?? "",
            keyFigures: (f.properties?.keyFigures as string[]) ?? [],
            coordinates: (f.geometry as GeoJSON.Point).coordinates as [number, number],
            imageUrl: (f.properties?.imageUrl as string) ?? "",
            imageCaption: (f.properties?.imageCaption as string) ?? "",
            dateSpecific: (f.properties?.dateSpecific as string) ?? "",
            outcome: (f.properties?.outcome as string) ?? "",
          }))
          .sort((a, b) => a.year - b.year);
        setLandmarks(parsed);
      })
      .catch(() => {});
  }, []);

  const selectedLandmark = useMemo(
    () => landmarks.find((l) => l.name === selectedName) ?? null,
    [landmarks, selectedName],
  );

  const eras = useMemo(() => {
    const seen = new Set<string>();
    return landmarks.reduce<string[]>((acc, l) => {
      if (!seen.has(l.era)) {
        seen.add(l.era);
        acc.push(l.era);
      }
      return acc;
    }, []);
  }, [landmarks]);

  const handleSelect = useCallback(
    (landmark: TimelineLandmark) => {
      setSelectedName((prev) => (prev === landmark.name ? null : landmark.name));
      onSelectLandmark(landmark);
    },
    [onSelectLandmark],
  );

  const scrollTimeline = useCallback((direction: "left" | "right") => {
    // ScrollArea uses a viewport div as the actual scrollable element
    const container = scrollRef.current;
    if (!container) return;
    const viewport =
      container.closest("[data-radix-scroll-area-viewport]") ?? container.parentElement;
    if (!viewport) return;
    const scrollAmount = direction === "left" ? -340 : 340;
    viewport.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  if (landmarks.length === 0) return null;

  return (
    <div className="flex flex-col">
      {/* Original timeline section */}
      <div className="flex flex-col">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4">
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

        {/* Content area: timeline + optional detail panel */}
        <div className="relative flex min-h-[360px] overflow-hidden">
          {/* Timeline section — always full width */}
          <div className="flex w-full flex-col">
            {/* Desktop: horizontal timeline */}
            <div className="hidden sm:flex flex-col">
              {/* Scroll buttons */}
              <div className="flex items-center justify-end gap-1 px-3 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => scrollTimeline("left")}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => scrollTimeline("right")}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>

              <ScrollArea>
                <div ref={scrollRef} className="relative flex items-start gap-6 px-6 pb-4 pt-2">
                  {/* Timeline rail */}
                  <div
                    className="absolute left-6 right-6 top-[30px] h-[2px]"
                    style={{ backgroundColor: GOLD, opacity: 0.2 }}
                  />

                  {landmarks.map((landmark) => {
                    const isSelected = selectedName === landmark.name;

                    return (
                      <div
                        key={landmark.name}
                        className="relative flex flex-col items-center shrink-0"
                      >
                        {/* Year label */}
                        <span
                          className="mb-1.5 text-xs font-bold tabular-nums"
                          style={{ color: GOLD }}
                        >
                          {landmark.year}
                        </span>

                        {/* Node dot */}
                        <div
                          className={`relative z-10 mb-3 size-3 rounded-full border-2 transition-all duration-200 ${
                            isSelected ? "scale-125" : "hover:scale-110"
                          }`}
                          style={{
                            borderColor: GOLD,
                            backgroundColor: isSelected ? GOLD : "var(--background)",
                            boxShadow: isSelected ? `0 0 8px ${GOLD}40` : "none",
                          }}
                        />

                        {/* Card */}
                        <TimelineCard
                          landmark={landmark}
                          isSelected={isSelected}
                          onClick={() => handleSelect(landmark)}
                          layout="horizontal"
                        />
                      </div>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Mobile: vertical timeline */}
            <div className="sm:hidden">
              <div className="flex flex-col px-3 py-3">
                {landmarks.map((landmark, index) => {
                  const isSelected = selectedName === landmark.name;
                  const isLast = index === landmarks.length - 1;

                  return (
                    <div key={landmark.name} className="relative flex gap-3">
                      {/* Vertical rail + node */}
                      <div className="flex flex-col items-center pt-4">
                        <div
                          className={`size-3 shrink-0 rounded-full border-2 transition-all ${
                            isSelected ? "scale-125" : ""
                          }`}
                          style={{
                            borderColor: GOLD,
                            backgroundColor: isSelected ? GOLD : "var(--background)",
                          }}
                        />
                        {!isLast && (
                          <div
                            className="w-[2px] flex-1 mt-1"
                            style={{ backgroundColor: GOLD, opacity: 0.2 }}
                          />
                        )}
                      </div>

                      {/* Card */}
                      <div className="mb-3 flex-1">
                        <TimelineCard
                          landmark={landmark}
                          isSelected={isSelected}
                          onClick={() => handleSelect(landmark)}
                          layout="vertical"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail panel — overlay that slides in from right */}
          <div
            className={`absolute inset-y-0 right-0 z-20 w-full border-l bg-background shadow-xl transition-transform duration-300 ease-in-out sm:w-[420px] ${
              selectedLandmark ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {selectedLandmark && (
              <DetailPanel landmark={selectedLandmark} onClose={() => setSelectedName(null)} />
            )}
          </div>
        </div>
      </div>

      {/* Analytics sections below timeline */}
      <div className="space-y-6 border-t p-4 sm:p-6">
        <DemographicsChart />
        <EquityIndicators />
        <MontgomeryToday />
      </div>
    </div>
  );
}

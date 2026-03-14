"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import {
  Baby,
  Building2,
  ChevronDown,
  ChevronRight,
  Flame,
  Heart,
  Home,
  Landmark,
  LandPlot,
  MapPin,
  Music,
  Recycle,
  Shield,
  TreePine,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { PieLegendContent, renderPieLabel, SkeletonBars } from "@/components/chart-helpers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD = "#D4AF37";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
];

const raceChartConfig = {
  value: { label: "Population", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const housingChartConfig = {
  value: { label: "Households", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

// ── Types ─────────────────────────────────────────────────────────────────────

interface CensusStats {
  totalPop: number;
  white: number;
  black: number;
  americanIndian: number;
  asian: number;
  pacificIslander: number;
  other: number;
  twoOrMore: number;
  occupiedHH: number;
  vacantHH: number;
}

interface InfraCount {
  label: string;
  icon: React.ReactNode;
  count: number | null;
}

interface EquityRow {
  district: string;
  requests311: number;
  violations: number;
  serviceRatio: number;
}

// ── SectionWrapper (inline, matches StaffingDashboard pattern) ────────────────

function SectionWrapper({
  icon,
  title,
  badge,
  badgeVariant = "secondary",
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            {icon}
          </span>
          <span className="flex-1 text-sm font-semibold">{title}</span>
          {badge && (
            <Badge variant={badgeVariant} className="px-1.5 py-0 text-[10px]">
              {badge}
            </Badge>
          )}
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── KPI Badge ─────────────────────────────────────────────────────────────────

function KpiBadge({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}10` }}
    >
      <span className="font-normal text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-3 w-8" />
      ) : (
        <span className="font-bold tabular-nums">{value}</span>
      )}
    </div>
  );
}

// ── Infrastructure Card ───────────────────────────────────────────────────────

function InfraCard({
  label,
  icon,
  count,
}: {
  label: string;
  icon: React.ReactNode;
  count: number | null;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${GOLD}15` }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {count === null ? (
            <Skeleton className="mt-1 h-5 w-10" />
          ) : (
            <p className="text-lg font-bold tabular-nums">{count.toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function DemographicsDashboard() {
  const [census, setCensus] = useState<CensusStats | null>(null);
  const [neighborhoodCount, setNeighborhoodCount] = useState<number | null>(null);
  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [libraryCount, setLibraryCount] = useState<number | null>(null);
  const [schoolCount, setSchoolCount] = useState<number | null>(null);
  const [infraCounts, setInfraCounts] = useState<InfraCount[]>([]);
  const [equityData, setEquityData] = useState<EquityRow[]>([]);
  const [cityOwnedCount, setCityOwnedCount] = useState<number | null>(null);
  const [zoningCount, setZoningCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);

      // Census demographics
      const censusPromise = queryTotalStats({
        url: ARCGIS_URLS.censusBlock,
        statistics: [
          { field: "P1_001N", type: "sum", alias: "totalPop" },
          { field: "P1_003N", type: "sum", alias: "white" },
          { field: "P1_004N", type: "sum", alias: "black" },
          { field: "P1_005N", type: "sum", alias: "americanIndian" },
          { field: "P1_006N", type: "sum", alias: "asian" },
          { field: "P1_007N", type: "sum", alias: "pacificIslander" },
          { field: "P1_008N", type: "sum", alias: "other" },
          { field: "P1_009N", type: "sum", alias: "twoOrMore" },
          { field: "OCC_HH", type: "sum", alias: "occupiedHH" },
          { field: "VAC_HH", type: "sum", alias: "vacantHH" },
        ],
      });

      // Counts for KPI bar
      const neighborhoodPromise = queryFeatureCount(ARCGIS_URLS.neighborhoods);
      const communityPromise = queryFeatureCount(ARCGIS_URLS.communityCenters);
      const libraryPromise = queryFeatureCount(ARCGIS_URLS.libraries);
      const schoolPromise = queryFeatureCount(ARCGIS_URLS.educationFacilities);

      // Infrastructure counts
      const policePromise = queryFeatureCount(ARCGIS_URLS.policeFacilities);
      const firePromise = queryFeatureCount(ARCGIS_URLS.fireStations);
      const healthPromise = queryFeatureCount(ARCGIS_URLS.healthCare);
      const daycarePromise = queryFeatureCount(ARCGIS_URLS.daycareCenters);
      const recyclingPromise = queryFeatureCount(ARCGIS_URLS.recyclingLocations);
      const parksPromise = queryFeatureCount(ARCGIS_URLS.cityParks);
      const entertainmentPromise = queryFeatureCount(ARCGIS_URLS.entertainmentDistricts);

      // Housing & Land
      const cityOwnedPromise = queryFeatureCount(ARCGIS_URLS.cityOwnedProperties);
      const zoningPromise = queryFeatureCount(ARCGIS_URLS.zoning);

      // Equity Indicators — 311 and violations by district
      const requests311Promise = queryFeatureStats({
        url: ARCGIS_URLS.serviceRequests311,
        groupByField: "District",
        statisticField: "District",
      });
      const violationsPromise = queryFeatureStats({
        url: ARCGIS_URLS.codeViolations,
        groupByField: "CouncilDistrict",
        statisticField: "CouncilDistrict",
      });

      const [
        censusResult,
        neighborhoods,
        community,
        library,
        school,
        police,
        fire,
        health,
        daycare,
        recycling,
        parks,
        entertainment,
        cityOwned,
        zoning,
        requests311,
        violations,
      ] = await Promise.all([
        censusPromise,
        neighborhoodPromise,
        communityPromise,
        libraryPromise,
        schoolPromise,
        policePromise,
        firePromise,
        healthPromise,
        daycarePromise,
        recyclingPromise,
        parksPromise,
        entertainmentPromise,
        cityOwnedPromise,
        zoningPromise,
        requests311Promise,
        violationsPromise,
      ]);

      if (cancelled) return;

      // Census
      setCensus({
        totalPop: censusResult.totalPop ?? 0,
        white: censusResult.white ?? 0,
        black: censusResult.black ?? 0,
        americanIndian: censusResult.americanIndian ?? 0,
        asian: censusResult.asian ?? 0,
        pacificIslander: censusResult.pacificIslander ?? 0,
        other: censusResult.other ?? 0,
        twoOrMore: censusResult.twoOrMore ?? 0,
        occupiedHH: censusResult.occupiedHH ?? 0,
        vacantHH: censusResult.vacantHH ?? 0,
      });

      // KPI counts
      setNeighborhoodCount(neighborhoods);
      setCommunityCount(community);
      setLibraryCount(library);
      setSchoolCount(school);

      // Infrastructure
      setInfraCounts([
        {
          label: "Police Facilities",
          icon: <Shield className="size-5" style={{ color: GOLD }} />,
          count: police,
        },
        {
          label: "Fire Stations",
          icon: <Flame className="size-5" style={{ color: GOLD }} />,
          count: fire,
        },
        {
          label: "Health Care",
          icon: <Heart className="size-5" style={{ color: GOLD }} />,
          count: health,
        },
        {
          label: "Daycare Centers",
          icon: <Baby className="size-5" style={{ color: GOLD }} />,
          count: daycare,
        },
        {
          label: "Recycling Locations",
          icon: <Recycle className="size-5" style={{ color: GOLD }} />,
          count: recycling,
        },
        {
          label: "City Parks",
          icon: <TreePine className="size-5" style={{ color: GOLD }} />,
          count: parks,
        },
        {
          label: "Entertainment Districts",
          icon: <Music className="size-5" style={{ color: GOLD }} />,
          count: entertainment,
        },
      ]);

      // Housing & Land
      setCityOwnedCount(cityOwned);
      setZoningCount(zoning);

      // Equity — merge 311 requests and violations by district
      const districtMap = new Map<string, { requests: number; violations: number }>();
      for (const r of requests311) {
        if (!r.group || r.group === "Unknown" || r.group === "null") continue;
        const existing = districtMap.get(r.group) ?? {
          requests: 0,
          violations: 0,
        };
        existing.requests = r.value;
        districtMap.set(r.group, existing);
      }
      for (const v of violations) {
        if (!v.group || v.group === "Unknown" || v.group === "null") continue;
        const existing = districtMap.get(v.group) ?? {
          requests: 0,
          violations: 0,
        };
        existing.violations = v.value;
        districtMap.set(v.group, existing);
      }
      const equityRows: EquityRow[] = Array.from(districtMap.entries())
        .map(([district, data]) => ({
          district,
          requests311: data.requests,
          violations: data.violations,
          serviceRatio:
            data.violations > 0 ? Math.round((data.requests / data.violations) * 100) / 100 : 0,
        }))
        .sort((a, b) => a.district.localeCompare(b.district));
      setEquityData(equityRows);

      setLoading(false);
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────

  const totalHouseholds = census ? census.occupiedHH + census.vacantHH : 0;
  const occupancyRate =
    totalHouseholds > 0 && census
      ? Math.round((census.occupiedHH / totalHouseholds) * 1000) / 10
      : 0;

  const raceData = census
    ? [
        { name: "White", value: census.white },
        { name: "Black / African American", value: census.black },
        { name: "American Indian", value: census.americanIndian },
        { name: "Asian", value: census.asian },
        { name: "Pacific Islander", value: census.pacificIslander },
        { name: "Other", value: census.other },
        { name: "Two or More", value: census.twoOrMore },
      ].filter((d) => d.value > 0)
    : [];

  const housingData = census
    ? [
        { name: "Occupied", value: census.occupiedHH },
        { name: "Vacant", value: census.vacantHH },
      ]
    : [];

  // ── CopilotKit readables ──────────────────────────────────────────────────

  useCopilotReadable({
    description:
      "Montgomery census demographics — total population, racial breakdown, household occupancy",
    value: census
      ? {
          totalPopulation: census.totalPop.toLocaleString(),
          racialBreakdown: {
            white: census.white.toLocaleString(),
            black: census.black.toLocaleString(),
            americanIndian: census.americanIndian.toLocaleString(),
            asian: census.asian.toLocaleString(),
            pacificIslander: census.pacificIslander.toLocaleString(),
            other: census.other.toLocaleString(),
            twoOrMore: census.twoOrMore.toLocaleString(),
          },
          households: {
            occupied: census.occupiedHH.toLocaleString(),
            vacant: census.vacantHH.toLocaleString(),
            occupancyRate: `${occupancyRate}%`,
          },
        }
      : "Loading...",
  });

  useCopilotReadable({
    description:
      "Community infrastructure counts — neighborhoods, schools, libraries, community centers, parks, and more",
    value: {
      neighborhoods: neighborhoodCount,
      schools: schoolCount,
      libraries: libraryCount,
      communityCenters: communityCount,
      infrastructure: infraCounts.map((i) => ({
        name: i.label,
        count: i.count,
      })),
    },
  });

  useCopilotReadable({
    description:
      "Equity indicators by council district — 311 requests, code violations, and service ratio",
    value: equityData.length > 0 ? equityData : "Loading...",
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 overflow-auto">
      {/* ── Sticky KPI Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b bg-background/95 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-wrap items-center gap-2">
          <KpiBadge
            label="Population"
            value={census?.totalPop.toLocaleString() ?? "—"}
            loading={loading}
          />
          <KpiBadge
            label="Neighborhoods"
            value={neighborhoodCount?.toLocaleString() ?? "—"}
            loading={loading}
          />
          <KpiBadge
            label="Community Centers"
            value={communityCount?.toLocaleString() ?? "—"}
            loading={loading}
          />
          <KpiBadge
            label="Libraries"
            value={libraryCount?.toLocaleString() ?? "—"}
            loading={loading}
          />
          <KpiBadge
            label="Schools"
            value={schoolCount?.toLocaleString() ?? "—"}
            loading={loading}
          />

          <div className="h-4 w-px bg-border" />

          <KpiBadge label="Occupancy Rate" value={`${occupancyRate}%`} loading={loading} />

          <div className="flex-1" />

          <span className="text-[10px] text-muted-foreground">
            Source: 2020 Census, Montgomery GIS
          </span>
        </div>
      </div>

      {/* ── Section 1: Population Breakdown ────────────────────────────────── */}
      <SectionWrapper
        icon={<Users className="size-4 text-muted-foreground" />}
        title="Population Breakdown"
        badge={census ? census.totalPop.toLocaleString() : undefined}
        defaultOpen
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Racial demographics donut chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Racial Demographics</CardTitle>
              <CardDescription>
                2020 Census racial breakdown &middot; {census?.totalPop.toLocaleString() ?? "—"}{" "}
                total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!census ? (
                <SkeletonBars />
              ) : (
                <ChartContainer config={raceChartConfig} className="mx-auto h-[350px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={raceData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {raceData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartLegend content={<PieLegendContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Household stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Household Occupancy</CardTitle>
              <CardDescription>
                {totalHouseholds.toLocaleString()} total households &middot; {occupancyRate}%
                occupancy rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!census ? (
                <SkeletonBars />
              ) : (
                <div className="space-y-6">
                  {/* Stats summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {census.occupiedHH.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Occupied</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {census.vacantHH.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Vacant</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-primary">
                        {occupancyRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Occupancy Rate</p>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <ChartContainer config={housingChartConfig} className="h-[200px] w-full">
                    <BarChart data={housingData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="housingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar dataKey="value" fill="url(#housingGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      {/* ── Section 2: Equity Indicators ───────────────────────────────────── */}
      <SectionWrapper
        icon={<Landmark className="size-4 text-muted-foreground" />}
        title="Equity Indicators"
        badge={equityData.length > 0 ? `${equityData.length} Districts` : undefined}
        defaultOpen
      >
        <Card>
          <CardContent className="p-0">
            {equityData.length === 0 ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Council District</TableHead>
                    <TableHead className="text-right">311 Requests</TableHead>
                    <TableHead className="text-right">Code Violations</TableHead>
                    <TableHead className="text-right">Service Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equityData.map((row) => {
                    const ratioColor =
                      row.serviceRatio >= 2
                        ? "text-emerald-600 dark:text-emerald-400"
                        : row.serviceRatio >= 1
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400";
                    return (
                      <TableRow key={row.district}>
                        <TableCell className="font-medium">District {row.district}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.requests311.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.violations.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${ratioColor}`}
                        >
                          {row.serviceRatio.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Service Ratio = 311 Requests / Code Violations. Higher ratio indicates more proactive
          service relative to enforcement.
        </p>
      </SectionWrapper>

      {/* ── Section 3: Community Infrastructure ────────────────────────────── */}
      <SectionWrapper
        icon={<Building2 className="size-4 text-muted-foreground" />}
        title="Community Infrastructure"
        badge={infraCounts.length > 0 ? `${infraCounts.length} Categories` : undefined}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {infraCounts.length === 0
            ? Array.from({ length: 7 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-3 w-16" />
                      <Skeleton className="h-5 w-10" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : infraCounts.map((item) => (
                <InfraCard
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  count={item.count}
                />
              ))}
        </div>
      </SectionWrapper>

      {/* ── Section 4: Housing & Land ──────────────────────────────────────── */}
      <SectionWrapper
        icon={<Home className="size-4 text-muted-foreground" />}
        title="Housing & Land"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Occupied vs Vacant */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${GOLD}15` }}
              >
                <Home className="size-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Households</p>
                {!census ? (
                  <Skeleton className="mt-1 h-5 w-16" />
                ) : (
                  <p className="text-lg font-bold tabular-nums">
                    {totalHouseholds.toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* City-Owned Properties */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${GOLD}15` }}
              >
                <MapPin className="size-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">City-Owned Properties</p>
                {cityOwnedCount === null ? (
                  <Skeleton className="mt-1 h-5 w-16" />
                ) : (
                  <p className="text-lg font-bold tabular-nums">
                    {cityOwnedCount.toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Zoning Areas */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${GOLD}15` }}
              >
                <LandPlot className="size-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zoning Areas</p>
                {zoningCount === null ? (
                  <Skeleton className="mt-1 h-5 w-16" />
                ) : (
                  <p className="text-lg font-bold tabular-nums">{zoningCount.toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
    </div>
  );
}

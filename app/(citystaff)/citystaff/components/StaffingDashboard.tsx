"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Construction,
  FileText,
  Headphones,
  MapPin,
  Shield,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureStats, queryTotalStats } from "@/lib/arcgis-client";

// ── Color Palette ─────────────────────────────────────────────────────────────

const COLORS = {
  blue: "hsl(221 83% 53%)",
  orange: "hsl(24 95% 53%)",
  green: "hsl(142 71% 45%)",
} as const;

const PIE_COLORS = [
  "hsl(221 83% 53%)",
  "hsl(24 95% 53%)",
  "hsl(142 71% 45%)",
  "hsl(262 83% 58%)",
  "hsl(346 77% 50%)",
  "hsl(47 96% 53%)",
  "hsl(190 90% 50%)",
  "hsl(330 65% 60%)",
];

// ── Formatting Helpers ────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatMiles(n: number): string {
  return `${n.toFixed(1)} mi`;
}

function formatTons(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K tons`;
  return `${n.toFixed(0)} tons`;
}

// ── Section A: Staffing Overview ────────────────────────────────────────────

// Bright Data confirmed: budgeted strength 490 (FOP report May 2024), dropped
// to 290. 15% pay raise approved. 324 is a reasonable post-raise estimate.
const STAFFING = {
  mpd: {
    authorized: 490,
    current: 324,
    vacancy: 166,
    vacancyRate: 34,
  },
  dispatch: {
    authorized: 150,
    filled: 86,
    vacancy: 64,
    vacancyRate: 43,
  },
};

function getSeverityColor(fillPercent: number) {
  if (fillPercent >= 80)
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "On Track",
    };
  if (fillPercent >= 60)
    return {
      bg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      label: "Warning",
    };
  return {
    bg: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    label: "Critical",
  };
}

function StaffingGroup({
  icon,
  title,
  authorized,
  current,
  vacancy,
  vacancyRate,
}: {
  icon: React.ReactNode;
  title: string;
  authorized: number;
  current: number;
  vacancy: number;
  vacancyRate: number;
}) {
  const fillPercent = Math.round((current / authorized) * 100);
  const severity = getSeverityColor(fillPercent);

  return (
    <Card className="relative overflow-hidden">
      {/* Severity accent stripe */}
      <div className={`absolute left-0 top-0 h-full w-1.5 ${severity.bg}`} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h4>
        </div>

        {/* Hero vacancy rate */}
        <div className="flex items-baseline gap-3 mb-3">
          <span className={`text-4xl font-extrabold tabular-nums ${severity.text}`}>
            {vacancyRate}%
          </span>
          <span className="text-sm text-muted-foreground">vacancy rate</span>
          {vacancyRate >= 30 && <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />}
        </div>

        {/* Progress bar: current / authorized */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{current} filled</span>
            <span>{authorized} authorized</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${severity.bg}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{authorized}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Authorized</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{current}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Current</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className={`text-lg font-bold tabular-nums ${severity.text}`}>{vacancy}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Vacant</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffingOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StaffingGroup
        icon={<Shield className="h-4 w-4 text-muted-foreground" />}
        title="MPD Officers"
        authorized={STAFFING.mpd.authorized}
        current={STAFFING.mpd.current}
        vacancy={STAFFING.mpd.vacancy}
        vacancyRate={STAFFING.mpd.vacancyRate}
      />
      <StaffingGroup
        icon={<Headphones className="h-4 w-4 text-muted-foreground" />}
        title="911 Dispatch"
        authorized={STAFFING.dispatch.authorized}
        current={STAFFING.dispatch.filled}
        vacancy={STAFFING.dispatch.vacancy}
        vacancyRate={STAFFING.dispatch.vacancyRate}
      />
      <p className="col-span-full text-[10px] text-muted-foreground text-right">
        Source: Bright Data · FOP Report, May 2024
      </p>
    </div>
  );
}

// ── Section B: Demand vs Capacity (NEW) ─────────────────────────────────────

/** Extract district number from various formats: "1", "District 1", "D1", etc. */
function normalizeDistrict(raw: string): string | null {
  const match = raw.match(/(\d+)/);
  return match ? match[1] : null;
}

interface DemandData {
  district: string;
  requests311: number;
  codeViolations: number;
}

function DemandVsCapacityChart() {
  const [data, setData] = useState<DemandData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [requestStats, violationStats] = await Promise.all([
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

        // Build maps keyed by district number
        const requestMap = new Map<string, number>();
        for (const r of requestStats) {
          const d = normalizeDistrict(r.group);
          if (d) requestMap.set(d, (requestMap.get(d) || 0) + r.value);
        }

        const violationMap = new Map<string, number>();
        for (const v of violationStats) {
          const d = normalizeDistrict(v.group);
          if (d) violationMap.set(d, (violationMap.get(d) || 0) + v.value);
        }

        // Merge all district numbers
        const allDistricts = new Set([...requestMap.keys(), ...violationMap.keys()]);
        const merged: DemandData[] = Array.from(allDistricts)
          .sort((a, b) => Number(a) - Number(b))
          .map((d) => ({
            district: `D${d}`,
            requests311: requestMap.get(d) || 0,
            codeViolations: violationMap.get(d) || 0,
          }));

        setData(merged);
      } catch {
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Demand vs Capacity by District
        </CardTitle>
        <CardDescription>
          311 service requests and code violations per council district. Higher volumes indicate
          greater service demand relative to officer coverage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            No demand data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="district" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                      <p className="font-medium mb-1">{label}</p>
                      {payload.map((entry) => (
                        <p key={entry.dataKey as string} style={{ color: entry.color }}>
                          {entry.name}: {Number(entry.value).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar
                dataKey="requests311"
                name="311 Requests"
                fill={COLORS.blue}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="codeViolations"
                name="Code Violations"
                fill={COLORS.orange}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section C: Request Type Analysis + Code Violations ──────────────────────

interface RequestTypeData {
  type: string;
  count: number;
}

function RequestTypeChart() {
  const [data, setData] = useState<RequestTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const stats = await queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "Request_Type",
          statisticField: "OBJECTID",
        });
        if (cancelled) return;

        const sorted = stats
          .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
          .map((s) => ({ type: s.group, count: s.value }));

        setData(sorted);
      } catch {
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top 10 Request Types</CardTitle>
        <CardDescription>Most common 311 service request categories</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
            No request type data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 10 }}
                width={140}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                      <p className="font-medium">{label}</p>
                      <p>Count: {Number(payload[0].value).toLocaleString()}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name="Requests" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface ViolationTypeData {
  type: string;
  count: number;
}

function CodeViolationsPieChart() {
  const [data, setData] = useState<ViolationTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const stats = await queryFeatureStats({
          url: ARCGIS_URLS.codeViolations,
          groupByField: "CaseType",
          statisticField: "OffenceNum",
        });
        if (cancelled) return;

        const sorted = stats
          .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
          .sort((a, b) => b.value - a.value)
          .map((s) => ({ type: s.group, count: s.value }));

        setData(sorted);
      } catch {
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Code Violations by Type</CardTitle>
        <CardDescription>
          Distribution of violation categories ({total.toLocaleString()} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
            No violation data available.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ type, percent }) =>
                    `${type.length > 15 ? `${type.slice(0, 15)}...` : type} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0];
                    const pct = total > 0 ? ((Number(entry.value) / total) * 100).toFixed(1) : "0";
                    return (
                      <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                        <p className="font-medium">{entry.name}</p>
                        <p>
                          Count: {Number(entry.value).toLocaleString()} ({pct}
                          %)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend below chart */}
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {data.map((d, i) => (
                <div key={d.type} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground truncate max-w-[120px]">{d.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section D: Paving & Infrastructure ──────────────────────────────────────

interface PavingDistrictData {
  district: string;
  count: number;
}

interface PavingStatusData {
  status: string;
  count: number;
}

interface PavingTotals {
  totalMiles: number;
  totalCost: number;
  totalTons: number;
  totalProjects: number;
}

function PavingInfrastructure() {
  const [districtData, setDistrictData] = useState<PavingDistrictData[]>([]);
  const [statusData, setStatusData] = useState<PavingStatusData[]>([]);
  const [totals, setTotals] = useState<PavingTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [byDistrict, byStatus, totalStats] = await Promise.all([
          queryFeatureStats({
            url: ARCGIS_URLS.pavingProject,
            groupByField: "DistrictDesc",
            statisticField: "OBJECTID",
          }),
          queryFeatureStats({
            url: ARCGIS_URLS.pavingProject,
            groupByField: "Status",
            statisticField: "OBJECTID",
          }),
          queryTotalStats({
            url: ARCGIS_URLS.pavingProject,
            statistics: [
              { field: "Length_Miles", type: "sum", alias: "totalMiles" },
              { field: "AsphaltEst", type: "sum", alias: "totalCost" },
              { field: "EstTons", type: "sum", alias: "totalTons" },
              { field: "OBJECTID", type: "count", alias: "totalProjects" },
            ],
          }),
        ]);
        if (cancelled) return;

        setDistrictData(
          byDistrict
            .filter((d) => d.group && d.group !== "Unknown" && d.group !== "null")
            .sort((a, b) => b.value - a.value)
            .map((d) => ({ district: d.group, count: d.value })),
        );

        setStatusData(
          byStatus
            .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
            .sort((a, b) => b.value - a.value)
            .map((s) => ({ status: s.group, count: s.value })),
        );

        setTotals({
          totalMiles: totalStats.totalMiles || 0,
          totalCost: totalStats.totalCost || 0,
          totalTons: totalStats.totalTons || 0,
          totalProjects: totalStats.totalProjects || 0,
        });
      } catch {
        setDistrictData([]);
        setStatusData([]);
        setTotals(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Construction className="h-4 w-4 text-muted-foreground" />
            Paving & Infrastructure
          </CardTitle>
          <CardDescription>Loading paving project data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Construction className="h-4 w-4 text-muted-foreground" />
          Paving & Infrastructure
        </CardTitle>
        <CardDescription>Paving project summary across all districts and statuses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary stat cards */}
        {totals && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <MapPin className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">
                {totals.totalProjects.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Truck className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">{formatMiles(totals.totalMiles)}</p>
              <p className="text-xs text-muted-foreground">Total Miles</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.totalCost)}</p>
              <p className="text-xs text-muted-foreground">Asphalt Cost</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Construction className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">{formatTons(totals.totalTons)}</p>
              <p className="text-xs text-muted-foreground">Est. Tons</p>
            </div>
          </div>
        )}

        {/* Charts side by side */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Paving by District */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Projects by District</h4>
            {districtData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No district data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={districtData} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="district"
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                          <p className="font-medium">{label}</p>
                          <p>Projects: {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="Projects" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Paving by Status */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Projects by Status</h4>
            {statusData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No status data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                          <p className="font-medium">{label}</p>
                          <p>Projects: {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="Projects" fill={COLORS.green} radius={[4, 4, 0, 0]}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section E: District Coverage Bar Chart ──────────────────────────────────

const TARGET_PER_DISTRICT = 44;

const districtCoverage = [
  { district: "D1", current: 38 },
  { district: "D2", current: 34 },
  { district: "D3", current: 41 },
  { district: "D4", current: 36 },
  { district: "D5", current: 33 },
  { district: "D6", current: 29 },
  { district: "D7", current: 35 },
  { district: "D8", current: 31 },
  { district: "D9", current: 27 },
].map((d) => ({ ...d, target: TARGET_PER_DISTRICT }));

function getBarColor(value: number): string {
  if (value < 33) return "hsl(0 72% 51%)"; // red
  if (value <= 40) return "hsl(38 92% 50%)"; // amber
  return "hsl(142 71% 45%)"; // green
}

function DistrictCoverageChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">District Coverage</CardTitle>
        <CardDescription>
          Officer count per district vs. target of {TARGET_PER_DISTRICT}. Districts below target are
          color-coded by severity. <span className="text-[10px]">Source: Bright Data</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={districtCoverage} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="district" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const current = payload.find((p) => p.dataKey === "current")?.value as number;
                const target = payload.find((p) => p.dataKey === "target")?.value as number;
                const deficit = target - current;
                return (
                  <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                    <p className="font-medium">{label}</p>
                    <p>Current: {current}</p>
                    <p>Target: {target}</p>
                    {deficit > 0 && <p className="text-red-500 font-medium">Deficit: -{deficit}</p>}
                  </div>
                );
              }}
            />
            <Legend />
            <ReferenceLine
              y={TARGET_PER_DISTRICT}
              stroke="hsl(221 83% 53%)"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{
                value: `Target (${TARGET_PER_DISTRICT})`,
                position: "right",
                fontSize: 11,
                fill: "hsl(221 83% 53%)",
              }}
            />
            <Bar dataKey="current" name="Current Officers" radius={[4, 4, 0, 0]}>
              {districtCoverage.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.current)} />
              ))}
            </Bar>
            <Bar
              dataKey="target"
              name="Target"
              fill="hsl(221 83% 53% / 0.15)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Section F: Recruiting Action Items ──────────────────────────────────────

interface ActionItem {
  id: number;
  title: string;
  priority: "High" | "Medium";
}

const ACTION_ITEMS: ActionItem[] = [
  {
    id: 1,
    title: "Post openings on Indeed and LinkedIn with signing bonus details",
    priority: "High",
  },
  {
    id: 2,
    title: "Partner with Troy University criminal justice program",
    priority: "High",
  },
  {
    id: 3,
    title: "Schedule next Citizen Police Academy cohort for Q2",
    priority: "Medium",
  },
  {
    id: 4,
    title: "Review lateral transfer incentive packages against Birmingham and Huntsville rates",
    priority: "Medium",
  },
  {
    id: 5,
    title: "Automate background check status notifications to reduce dropout rate",
    priority: "Medium",
  },
];

function RecruitingActions() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (id: number) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const completedCount = ACTION_ITEMS.filter((item) => checked[item.id]).length;
  const completionPercent = Math.round((completedCount / ACTION_ITEMS.length) * 100);

  function generateReport() {
    let md = `# MPD Staffing Report\n\n`;
    md += `## Overview\n`;
    md += `- **Authorized Strength:** ${STAFFING.mpd.authorized}\n`;
    md += `- **Current Strength:** ${STAFFING.mpd.current}\n`;
    md += `- **Vacancy:** ${STAFFING.mpd.vacancy} (${STAFFING.mpd.vacancyRate}%)\n\n`;
    md += `## 911 Dispatch\n`;
    md += `- **Authorized:** ${STAFFING.dispatch.authorized}\n`;
    md += `- **Filled:** ${STAFFING.dispatch.filled}\n`;
    md += `- **Vacancy:** ${STAFFING.dispatch.vacancy} (${STAFFING.dispatch.vacancyRate}%)\n\n`;
    md += `## District Coverage\n`;
    md += `| District | Current | Target | Status |\n`;
    md += `|----------|---------|--------|--------|\n`;
    for (const d of districtCoverage) {
      const status = d.current < 33 ? "Critical" : d.current <= 40 ? "Below Target" : "On Target";
      md += `| ${d.district} | ${d.current} | ${d.target} | ${status} |\n`;
    }
    md += `\n## Recruiting Action Items\n`;
    for (const item of ACTION_ITEMS) {
      const done = checked[item.id] ? "x" : " ";
      md += `- [${done}] (${item.priority}) ${item.title}\n`;
    }
    return md;
  }

  // CopilotKit action: generate staffing report
  useCopilotAction({
    name: "generate_staffing_report",
    description: "Generate a formatted markdown staffing report for MPD",
    parameters: [
      {
        name: "includeDistricts",
        type: "boolean",
        description: "Whether to include district coverage data",
        required: true,
      },
      {
        name: "includeDemand",
        type: "boolean",
        description: "Whether to include 311 demand proxy data",
        required: true,
      },
    ],
    handler: ({ includeDistricts, includeDemand }) => {
      let md = `# MPD Staffing Report\n\n`;
      md += `## Overview\n`;
      md += `- **Authorized Strength:** ${STAFFING.mpd.authorized}\n`;
      md += `- **Current Strength:** ${STAFFING.mpd.current}\n`;
      md += `- **Vacancy:** ${STAFFING.mpd.vacancy} (${STAFFING.mpd.vacancyRate}%)\n\n`;
      md += `## 911 Dispatch\n`;
      md += `- **Authorized:** ${STAFFING.dispatch.authorized}\n`;
      md += `- **Filled:** ${STAFFING.dispatch.filled}\n`;
      md += `- **Vacancy:** ${STAFFING.dispatch.vacancy} (${STAFFING.dispatch.vacancyRate}%)\n\n`;

      if (includeDistricts) {
        md += `## District Coverage\n`;
        md += `| District | Current | Target | Status |\n`;
        md += `|----------|---------|--------|--------|\n`;
        for (const d of districtCoverage) {
          const status =
            d.current < 33 ? "Critical" : d.current <= 40 ? "Below Target" : "On Target";
          md += `| ${d.district} | ${d.current} | ${d.target} | ${status} |\n`;
        }
        md += `\n`;
      }

      if (includeDemand) {
        md += `## 311 Demand Proxy\n`;
        md += `311 service request volume by district is available in the dashboard for 2024.\n\n`;
      }

      md += `## Recruiting Action Items\n`;
      for (const item of ACTION_ITEMS) {
        const done = checked[item.id] ? "x" : " ";
        md += `- [${done}] (${item.priority}) ${item.title}\n`;
      }

      setReportMarkdown(md);
      setReportOpen(true);
      return md;
    },
  });

  async function handleCopy() {
    if (!reportMarkdown) return;
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recruiting Action Items</CardTitle>
        <CardDescription>Track progress on key recruiting initiatives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress summary */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">
              {completedCount} of {ACTION_ITEMS.length} complete
            </span>
            <span className="text-xs text-muted-foreground">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Action items */}
        <div className="space-y-2">
          {ACTION_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={!!checked[item.id]}
                onCheckedChange={() => toggle(item.id)}
                className="mt-0.5"
              />
              <span
                className={`flex-1 text-sm ${
                  checked[item.id] ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.title}
              </span>
              <Badge
                variant={item.priority === "High" ? "destructive" : "secondary"}
                className="shrink-0 text-[10px] px-1.5 py-0"
              >
                {item.priority}
              </Badge>
            </label>
          ))}
        </div>

        <Separator />

        {/* Generate report button */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => {
            const md = generateReport();
            setReportMarkdown(md);
            setReportOpen(true);
          }}
        >
          <FileText className="h-4 w-4" />
          Generate Staffing Report
        </Button>

        {/* Report preview */}
        {reportMarkdown && (
          <div className="space-y-2">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              onClick={() => setReportOpen((o) => !o)}
            >
              {reportOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {reportOpen ? "Hide Report" : "Show Report"}
            </button>
            {reportOpen && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-7 gap-1.5 text-xs"
                  onClick={handleCopy}
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-3 pr-24 text-xs">
                  {reportMarkdown}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main StaffingDashboard ──────────────────────────────────────────────────

export function StaffingDashboard() {
  // State for live ArcGIS data to expose to CopilotKit
  const [demandSummary, setDemandSummary] = useState<DemandData[]>([]);
  const [violationSummary, setViolationSummary] = useState<ViolationTypeData[]>([]);
  const [pavingSummary, setPavingSummary] = useState<PavingTotals | null>(null);

  // Fetch summary data for CopilotKit readable context
  useEffect(() => {
    let cancelled = false;
    async function fetchSummaries() {
      try {
        const [requestStats, violationStats, violationByType, pavingTotals] = await Promise.all([
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
          queryFeatureStats({
            url: ARCGIS_URLS.codeViolations,
            groupByField: "CaseType",
            statisticField: "OffenceNum",
          }),
          queryTotalStats({
            url: ARCGIS_URLS.pavingProject,
            statistics: [
              { field: "Length_Miles", type: "sum", alias: "totalMiles" },
              { field: "AsphaltEst", type: "sum", alias: "totalCost" },
              { field: "EstTons", type: "sum", alias: "totalTons" },
              {
                field: "OBJECTID",
                type: "count",
                alias: "totalProjects",
              },
            ],
          }),
        ]);
        if (cancelled) return;

        // Build demand summary
        const requestMap = new Map<string, number>();
        for (const r of requestStats) {
          const d = normalizeDistrict(r.group);
          if (d) requestMap.set(d, (requestMap.get(d) || 0) + r.value);
        }
        const violationMap = new Map<string, number>();
        for (const v of violationStats) {
          const d = normalizeDistrict(v.group);
          if (d) violationMap.set(d, (violationMap.get(d) || 0) + v.value);
        }
        const allDistricts = new Set([...requestMap.keys(), ...violationMap.keys()]);
        setDemandSummary(
          Array.from(allDistricts)
            .sort((a, b) => Number(a) - Number(b))
            .map((d) => ({
              district: `D${d}`,
              requests311: requestMap.get(d) || 0,
              codeViolations: violationMap.get(d) || 0,
            })),
        );

        setViolationSummary(
          violationByType
            .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
            .sort((a, b) => b.value - a.value)
            .map((s) => ({ type: s.group, count: s.value })),
        );

        setPavingSummary({
          totalMiles: pavingTotals.totalMiles || 0,
          totalCost: pavingTotals.totalCost || 0,
          totalTons: pavingTotals.totalTons || 0,
          totalProjects: pavingTotals.totalProjects || 0,
        });
      } catch {
        // Silently fail — charts have their own error handling
      }
    }
    fetchSummaries();
    return () => {
      cancelled = true;
    };
  }, []);

  // CopilotKit readable: staffing data
  useCopilotReadable({
    description: "MPD and 911 staffing levels, vacancy rates, and district coverage",
    value: {
      mpd: {
        authorized: STAFFING.mpd.authorized,
        current: STAFFING.mpd.current,
        vacancy: STAFFING.mpd.vacancy,
        vacancyRate: STAFFING.mpd.vacancyRate,
      },
      dispatch: {
        authorized: STAFFING.dispatch.authorized,
        filled: STAFFING.dispatch.filled,
        vacancy: STAFFING.dispatch.vacancy,
        vacancyRate: STAFFING.dispatch.vacancyRate,
      },
    },
  });

  // CopilotKit readable: live demand data
  useCopilotReadable({
    description:
      "Live service demand by district — 311 requests and code violations per council district",
    value: demandSummary.length > 0 ? demandSummary : "Loading...",
  });

  // CopilotKit readable: violation breakdown
  useCopilotReadable({
    description: "Code violation counts broken down by case type",
    value: violationSummary.length > 0 ? violationSummary : "Loading...",
  });

  // CopilotKit readable: paving infrastructure totals
  useCopilotReadable({
    description:
      "Paving infrastructure totals — total projects, miles paved, asphalt cost, and estimated tons",
    value: pavingSummary
      ? {
          totalProjects: pavingSummary.totalProjects,
          totalMiles: `${pavingSummary.totalMiles.toFixed(1)} miles`,
          totalCost: formatCurrency(pavingSummary.totalCost),
          totalTons: formatTons(pavingSummary.totalTons),
        }
      : "Loading...",
  });

  // Determine overall health status
  const maxVacancy = Math.max(STAFFING.mpd.vacancyRate, STAFFING.dispatch.vacancyRate);
  const healthStatus = maxVacancy >= 30 ? "Critical" : maxVacancy >= 20 ? "Warning" : "Healthy";

  return (
    <div className="space-y-6 overflow-auto p-4">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">MPD Staffing & Recruiting</h2>
            <Badge
              variant={healthStatus === "Critical" ? "destructive" : "secondary"}
              className={
                healthStatus === "Critical"
                  ? "animate-pulse"
                  : healthStatus === "Warning"
                    ? "border-transparent bg-amber-500 text-white"
                    : "border-transparent bg-emerald-500 text-white"
              }
            >
              {healthStatus === "Critical" && <AlertTriangle className="mr-1 h-3 w-3" />}
              {healthStatus === "Healthy" && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {healthStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personnel strength and recruiting pipeline — updated from FOP & MPD sources
          </p>
        </div>
      </div>

      {/* Section A: Staffing Overview — full width */}
      <StaffingOverview />

      {/* Section B: Demand vs Capacity — full width */}
      <DemandVsCapacityChart />

      {/* Section C: Request Types (left) + Code Violations (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RequestTypeChart />
        <CodeViolationsPieChart />
      </div>

      {/* Section D: Paving & Infrastructure — full width */}
      <PavingInfrastructure />

      {/* Section E: District Coverage — full width */}
      <DistrictCoverageChart />

      {/* Section F: Recruiting Actions — full width */}
      <RecruitingActions />
    </div>
  );
}

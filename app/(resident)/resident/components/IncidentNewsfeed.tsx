"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Radio,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureAttributes, queryFeatureStats } from "@/lib/arcgis-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncidentItem {
  id: string;
  type: string;
  address: string;
  status: "Open" | "In Progress" | "Closed";
  date: Date;
  closeDate: Date | null;
  department: string;
  district: string;
  origin: string;
  year: number;
}

interface FilterState {
  departments: string[];
  status: "All" | "Open" | "In Progress" | "Closed";
  district: string;
  origin: string;
  requestType: string;
}

interface StatsSummary {
  total: number;
  open: number;
  closed: number;
  inProgress: number;
}

interface TypeBreakdown {
  name: string;
  value: number;
}

interface YearTrend {
  year: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function statusColor(status: IncidentItem["status"]) {
  switch (status) {
    case "Open":
      return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700";
    case "In Progress":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700";
    case "Closed":
      return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
  }
}

function statusBorderColor(status: IncidentItem["status"]) {
  switch (status) {
    case "Open":
      return "border-l-red-500";
    case "In Progress":
      return "border-l-amber-500";
    case "Closed":
      return "border-l-green-500";
  }
}

function normalizeStatus(raw: string): IncidentItem["status"] {
  const lower = raw.toLowerCase();
  if (lower.includes("progress")) return "In Progress";
  if (lower.includes("closed") || lower.includes("resolved")) return "Closed";
  return "Open";
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Build a WHERE clause from the current filter state */
function buildWhereClause(filters: FilterState): string {
  const clauses: string[] = [];

  if (filters.departments.length > 0) {
    const deptList = filters.departments.map((d) => `'${d.replace(/'/g, "''")}'`).join(",");
    clauses.push(`Department IN (${deptList})`);
  }

  if (filters.status !== "All") {
    clauses.push(`Status = '${filters.status}'`);
  }

  if (filters.district && filters.district !== "all") {
    clauses.push(`District = ${filters.district}`);
  }

  if (filters.origin && filters.origin !== "all") {
    clauses.push(`Origin = '${filters.origin.replace(/'/g, "''")}'`);
  }

  if (filters.requestType) {
    clauses.push(`Request_Type = '${filters.requestType.replace(/'/g, "''")}'`);
  }

  return clauses.length > 0 ? clauses.join(" AND ") : "1=1";
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

const STATUS_OPTIONS = ["All", "Open", "In Progress", "Closed"] as const;
const DISTRICTS = ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const CHART_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IncidentNewsfeed() {
  // ── State ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    status: "All",
    district: "all",
    origin: "all",
    requestType: "",
  });

  const [stats, setStats] = useState<StatsSummary>({
    total: 0,
    open: 0,
    closed: 0,
    inProgress: 0,
  });
  const [items, setItems] = useState<IncidentItem[]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<TypeBreakdown[]>([]);
  const [yearTrend, setYearTrend] = useState<YearTrend[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [originOptions, setOriginOptions] = useState<string[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const url = ARCGIS_URLS.serviceRequests311;

  // ── Fetch filter options (departments, origins) ────────────────────────
  const fetchFilterOptions = useCallback(async () => {
    setIsLoadingFilters(true);
    try {
      const [deptStats, originStats] = await Promise.all([
        queryFeatureStats({
          url,
          groupByField: "Department",
          statisticField: "OBJECTID",
        }),
        queryFeatureStats({
          url,
          groupByField: "Origin",
          statisticField: "OBJECTID",
        }),
      ]);

      setDepartmentOptions(
        deptStats
          .filter((d) => d.group && d.group !== "Unknown" && d.group !== "null")
          .sort((a, b) => b.value - a.value)
          .map((d) => d.group),
      );
      setOriginOptions(
        originStats
          .filter((o) => o.group && o.group !== "Unknown" && o.group !== "null")
          .sort((a, b) => b.value - a.value)
          .map((o) => o.group),
      );
    } catch (err) {
      console.error("[IncidentNewsfeed] filter options fetch failed:", err);
    } finally {
      setIsLoadingFilters(false);
    }
  }, [url]);

  // ── Fetch summary stats ───────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const where = buildWhereClause(filters);
      const statusStats = await queryFeatureStats({
        url,
        where,
        groupByField: "Status",
        statisticField: "OBJECTID",
      });

      const summary: StatsSummary = { total: 0, open: 0, closed: 0, inProgress: 0 };
      for (const s of statusStats) {
        const normalized = normalizeStatus(s.group);
        if (normalized === "Open") summary.open += s.value;
        else if (normalized === "In Progress") summary.inProgress += s.value;
        else if (normalized === "Closed") summary.closed += s.value;
        summary.total += s.value;
      }
      setStats(summary);
    } catch (err) {
      console.error("[IncidentNewsfeed] stats fetch failed:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [url, filters]);

  // ── Fetch feed items ──────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const where = buildWhereClause(filters);
      const rows = await queryFeatureAttributes({
        url,
        where,
        outFields:
          "Request_ID,Create_Date,Department,Request_Type,Address,District,Status,Close_Date,Origin,Year",
      });

      const parsed: IncidentItem[] = rows.map((r) => {
        const rawCreate = r.Create_Date;
        const createDate =
          typeof rawCreate === "number" ? new Date(rawCreate) : new Date(String(rawCreate));
        const rawClose = r.Close_Date;
        const closeDate = rawClose && typeof rawClose === "number" ? new Date(rawClose) : null;

        return {
          id: String(r.Request_ID ?? crypto.randomUUID()),
          type: String(r.Request_Type ?? "Service Request"),
          address: String(r.Address ?? "Unknown address"),
          status: normalizeStatus(String(r.Status ?? "Open")),
          date: isNaN(createDate.getTime()) ? new Date() : createDate,
          closeDate: closeDate && !isNaN(closeDate.getTime()) ? closeDate : null,
          department: String(r.Department ?? ""),
          district: String(r.District ?? ""),
          origin: String(r.Origin ?? ""),
          year: Number(r.Year) || new Date().getFullYear(),
        };
      });

      // Sort newest first, take 200
      parsed.sort((a, b) => b.date.getTime() - a.date.getTime());
      setItems(parsed.slice(0, 200));
    } catch (err) {
      console.error("[IncidentNewsfeed] feed fetch failed:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [url, filters]);

  // ── Fetch type breakdown chart ────────────────────────────────────────
  const fetchTypeBreakdown = useCallback(async () => {
    setIsLoadingChart(true);
    try {
      const where = buildWhereClause(filters);
      const typeStats = await queryFeatureStats({
        url,
        where,
        groupByField: "Request_Type",
        statisticField: "OBJECTID",
      });

      const sorted = typeStats
        .filter((t) => t.group && t.group !== "Unknown" && t.group !== "null")
        .sort((a, b) => b.value - a.value)
        .slice(0, 15)
        .map((t) => ({ name: t.group, value: t.value }));

      setTypeBreakdown(sorted);
    } catch (err) {
      console.error("[IncidentNewsfeed] type breakdown fetch failed:", err);
    } finally {
      setIsLoadingChart(false);
    }
  }, [url, filters]);

  // ── Fetch year trend ──────────────────────────────────────────────────
  const fetchYearTrend = useCallback(async () => {
    setIsLoadingTrend(true);
    try {
      const where = buildWhereClause(filters);
      const yearStats = await queryFeatureStats({
        url,
        where,
        groupByField: "Year",
        statisticField: "OBJECTID",
      });

      const sorted = yearStats
        .filter(
          (y) => y.group && y.group !== "Unknown" && y.group !== "null" && Number(y.group) > 2000,
        )
        .sort((a, b) => Number(a.group) - Number(b.group))
        .map((y) => ({ year: Number(y.group), count: y.value }));

      setYearTrend(sorted);
    } catch (err) {
      console.error("[IncidentNewsfeed] year trend fetch failed:", err);
    } finally {
      setIsLoadingTrend(false);
    }
  }, [url, filters]);

  // ── Effects ────────────────────────────────────────────────────────────

  // Load filter options once on mount
  useEffect(() => {
    let cancelled = false;
    fetchFilterOptions().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [fetchFilterOptions]);

  // Reload data when filters change
  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchStats(), fetchFeed(), fetchTypeBreakdown(), fetchYearTrend()]).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [fetchStats, fetchFeed, fetchTypeBreakdown, fetchYearTrend]);

  // ── Refresh all ────────────────────────────────────────────────────────
  const isLoading = isLoadingStats || isLoadingFeed || isLoadingChart || isLoadingTrend;

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchFeed();
    fetchTypeBreakdown();
    fetchYearTrend();
  }, [fetchStats, fetchFeed, fetchTypeBreakdown, fetchYearTrend]);

  // ── Derived: resolution time stats ────────────────────────────────────
  const avgResolutionTime = useMemo(() => {
    const resolved = items.filter((i) => i.closeDate && i.date);
    if (resolved.length === 0) return null;
    const totalMs = resolved.reduce(
      (sum, i) => sum + (i.closeDate!.getTime() - i.date.getTime()),
      0,
    );
    return totalMs / resolved.length;
  }, [items]);

  // ── CopilotKit readable ───────────────────────────────────────────────
  useCopilotReadable({
    description: "311 Service Request summary stats and current filter state",
    value: {
      stats,
      filters: {
        status: filters.status,
        district: filters.district,
        origin: filters.origin,
        departmentCount: filters.departments.length,
        requestType: filters.requestType || "all",
      },
      recentItems: items.slice(0, 10).map((i) => ({
        id: i.id,
        type: i.type,
        address: i.address,
        status: i.status,
        department: i.department,
        date: i.date.toISOString(),
        resolutionTime: i.closeDate
          ? formatDuration(i.closeDate.getTime() - i.date.getTime())
          : null,
      })),
      topRequestTypes: typeBreakdown.slice(0, 5).map((t) => ({
        type: t.name,
        count: t.value,
      })),
      avgResolutionTime: avgResolutionTime ? formatDuration(avgResolutionTime) : "N/A",
    },
  });

  // ── Filter handlers ───────────────────────────────────────────────────
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleBarClick = useCallback((data: TypeBreakdown) => {
    setFilters((prev) => ({
      ...prev,
      requestType: prev.requestType === data.name ? "" : data.name,
    }));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div data-tour-step-id="resident-newsfeed" className="max-w-7xl mx-auto space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2 className="text-lg font-semibold">311 Service Requests</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={refreshAll}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>

      {/* ── Section 1: Summary Stats Bar ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  Total Requests
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(stats.total)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Open
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(stats.open)}</p>
                <Badge
                  variant="outline"
                  className="mt-1 bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 text-[10px]"
                >
                  {stats.total > 0 ? ((stats.open / stats.total) * 100).toFixed(1) : 0}%
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Closed
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(stats.closed)}</p>
                <Badge
                  variant="outline"
                  className="mt-1 bg-green-500/15 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 text-[10px]"
                >
                  {stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(1) : 0}%
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  In Progress
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {formatNumber(stats.inProgress)}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-[10px]"
                >
                  {stats.total > 0 ? ((stats.inProgress / stats.total) * 100).toFixed(1) : 0}%
                </Badge>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Section 2: Filter Bar ─────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Department filter */}
            <Select
              value={filters.departments.length === 1 ? filters.departments[0] : "all"}
              onValueChange={(val) => updateFilter("departments", val === "all" ? [] : [val])}
              disabled={isLoadingFilters}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status toggle */}
            <div className="flex rounded-md border">
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s}
                  variant={filters.status === s ? "default" : "ghost"}
                  size="sm"
                  className="h-8 rounded-none px-3 text-xs first:rounded-l-md last:rounded-r-md"
                  onClick={() => updateFilter("status", s as FilterState["status"])}
                >
                  {s}
                </Button>
              ))}
            </div>

            {/* District picker */}
            <Select value={filters.district} onValueChange={(val) => updateFilter("district", val)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d === "all" ? "All Districts" : `District ${d}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Origin filter */}
            <Select
              value={filters.origin}
              onValueChange={(val) => updateFilter("origin", val)}
              disabled={isLoadingFilters}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="All Origins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Origins</SelectItem>
                {originOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active request type filter indicator */}
            {filters.requestType && (
              <Badge
                variant="secondary"
                className="h-7 cursor-pointer gap-1 text-xs"
                onClick={() => updateFilter("requestType", "")}
              >
                {filters.requestType}
                <span className="ml-1 text-muted-foreground">&times;</span>
              </Badge>
            )}

            {/* Average resolution time */}
            {avgResolutionTime && !isLoadingFeed && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Avg resolution: {formatDuration(avgResolutionTime)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Feed + Type Breakdown ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Feed — left 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-semibold">Recent Requests</CardTitle>
              {!isLoadingFeed && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-bold tabular-nums"
                >
                  {items.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            {isLoadingFeed ? (
              <div className="space-y-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-lg border border-l-4 border-l-muted p-2.5"
                  >
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                        <Skeleton className="h-4 w-10 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-10 shrink-0" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No requests found matching current filters.
              </p>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const resolutionMs = item.closeDate
                      ? item.closeDate.getTime() - item.date.getTime()
                      : null;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border border-l-4 ${statusBorderColor(item.status)} p-2.5 transition-colors hover:bg-muted/50`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight line-clamp-2">
                            {item.type}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {relativeTime(item.date)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.address}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`h-5 px-1.5 text-[10px] ${statusColor(item.status)}`}
                          >
                            {item.status}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="h-5 gap-1 px-1.5 text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          >
                            <Radio className="h-2.5 w-2.5" />
                            311
                          </Badge>
                          {item.department && (
                            <span className="truncate text-[10px] text-muted-foreground">
                              {item.department}
                            </span>
                          )}
                          {item.district && item.district !== "0" && (
                            <span className="text-[10px] text-muted-foreground">
                              D{item.district}
                            </span>
                          )}
                          {item.origin && (
                            <span className="text-[10px] text-muted-foreground">
                              via {item.origin}
                            </span>
                          )}
                          {resolutionMs !== null && resolutionMs > 0 && (
                            <Badge
                              variant="outline"
                              className="h-5 gap-1 px-1.5 text-[10px] bg-green-500/10 text-green-700 dark:text-green-400"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {formatDuration(resolutionMs)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Type Breakdown Chart — right 1/3 */}
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm font-semibold">Top Request Types</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            {isLoadingChart ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 flex-1" />
                  </div>
                ))}
              </div>
            ) : typeBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={typeBreakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 14) + "..." : v)}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value: number) => [formatNumber(value), "Requests"]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(_: unknown, index: number) => {
                      if (typeBreakdown[index]) {
                        handleBarClick(typeBreakdown[index]);
                      }
                    }}
                  >
                    {typeBreakdown.map((_, index) => (
                      <rect
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {!isLoadingChart && typeBreakdown.length > 0 && (
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Click a bar to filter the feed by that type
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4: Year Trend Sparkline ───────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 p-3 pb-0">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Request Volume by Year</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          {isLoadingTrend ? (
            <Skeleton className="h-[140px] w-full" />
          ) : yearTrend.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No trend data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={yearTrend} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => String(v)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => formatNumber(v)}
                  width={45}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: number) => [formatNumber(value), "Requests"]}
                  labelFormatter={(label: number) => `Year ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

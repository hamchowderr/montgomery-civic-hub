"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Hash,
  MapPin,
  Phone,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureAttributes, queryFeatureStats } from "@/lib/arcgis-client";
import { useYearFilter } from "@/lib/contexts/year-filter";

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

/** Build a WHERE clause from the current filter state and year range */
function buildIncidentWhereClause(
  filters: FilterState,
  yearRange: { from: number; to: number },
): string {
  const clauses: string[] = [];

  // Always apply year filter
  clauses.push(`Year >= ${yearRange.from} AND Year <= ${yearRange.to}`);

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

  return clauses.join(" AND ");
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
  const { yearRange } = useYearFilter();

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
      const where = buildIncidentWhereClause(filters, yearRange);
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
  }, [url, filters, yearRange]);

  // ── Fetch feed items ──────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const where = buildIncidentWhereClause(filters, yearRange);
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
  }, [url, filters, yearRange]);

  // ── Fetch type breakdown chart ────────────────────────────────────────
  const fetchTypeBreakdown = useCallback(async () => {
    setIsLoadingChart(true);
    try {
      const where = buildIncidentWhereClause(filters, yearRange);
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
  }, [url, filters, yearRange]);

  // ── Fetch year trend ──────────────────────────────────────────────────
  const fetchYearTrend = useCallback(async () => {
    setIsLoadingTrend(true);
    try {
      // Use a wide year range so the trend chart always shows all years,
      // regardless of the selected year filter — otherwise it would only
      // show a single data point for the currently selected year.
      const allYearsRange = { from: 2018, to: new Date().getFullYear() };
      const where = buildIncidentWhereClause(filters, allYearsRange);
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

  // ── Expandable items ────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Pagination ──────────────────────────────────────────────────────
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(
    () => items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [items, currentPage],
  );

  // Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters, yearRange]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div data-tour-step-id="resident-newsfeed" className="space-y-4">
      {/* ── Header + Stats (compact row) ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2 className="text-lg font-semibold">311 Service Requests</h2>
        </div>

        {/* Inline stats */}
        {!isLoadingStats && (
          <div className="flex items-center gap-3 text-sm tabular-nums">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-semibold">{formatNumber(stats.total)}</span>
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {formatNumber(stats.open)}
            </span>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {formatNumber(stats.closed)}
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              {formatNumber(stats.inProgress)}
            </span>
            {avgResolutionTime && !isLoadingFeed && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                Avg: {formatDuration(avgResolutionTime)}
              </span>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8"
          onClick={refreshAll}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
        <Filter className="h-4 w-4 text-muted-foreground" />

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
      </div>

      {/* ── Feed List with Pagination ─────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold">Recent Requests</span>
            {!isLoadingFeed && (
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-bold tabular-nums"
              >
                {items.length}
              </Badge>
            )}
          </div>
          {/* Pagination controls */}
          {!isLoadingFeed && items.length > PAGE_SIZE && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[60px] text-center text-xs tabular-nums text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isLoadingFeed ? (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-l-4 border-l-muted p-2.5">
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
          <div className="space-y-1.5">
            {pagedItems.map((item) => {
              const resolutionMs = item.closeDate
                ? item.closeDate.getTime() - item.date.getTime()
                : null;
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border border-l-4 ${statusBorderColor(item.status)} transition-colors hover:bg-muted/50 cursor-pointer`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* Collapsed summary row */}
                  <div className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <ChevronDown
                          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                        />
                        <span className="text-sm font-medium leading-tight line-clamp-2">
                          {item.type}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {relativeTime(item.date)}
                      </span>
                    </div>
                    <p className="mt-0.5 ml-6 text-xs text-muted-foreground">{item.address}</p>
                    <div className="mt-1.5 ml-6 flex flex-wrap items-center gap-1.5">
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

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Request ID</span>
                          <span className="ml-auto font-mono text-xs">{item.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Created</span>
                          <span className="ml-auto text-xs">
                            {item.date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            {item.date.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Address</span>
                          <span className="ml-auto text-xs text-right max-w-[200px] truncate">
                            {item.address}
                          </span>
                        </div>
                        {item.district && item.district !== "0" && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">District</span>
                            <span className="ml-auto text-xs">District {item.district}</span>
                          </div>
                        )}
                        {item.department && (
                          <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Department</span>
                            <span className="ml-auto text-xs">{item.department}</span>
                          </div>
                        )}
                        {item.origin && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Origin</span>
                            <span className="ml-auto text-xs">{item.origin}</span>
                          </div>
                        )}
                        {item.closeDate && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-muted-foreground">Closed</span>
                            <span className="ml-auto text-xs">
                              {item.closeDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {resolutionMs !== null && resolutionMs > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Resolution Time</span>
                            <span className="ml-auto text-xs font-semibold">
                              {formatDuration(resolutionMs)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick filter button */}
                      {item.type && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFilter(
                              "requestType",
                              filters.requestType === item.type ? "" : item.type,
                            );
                          }}
                        >
                          <Filter className="mr-1.5 h-3 w-3" />
                          {filters.requestType === item.type
                            ? "Clear filter"
                            : `Show all "${item.type}" requests`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom pagination for long lists */}
        {!isLoadingFeed && items.length > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(0)}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Prev
            </Button>
            <span className="px-3 text-xs tabular-nums text-muted-foreground">
              Page {currentPage + 1} of {totalPages} ({items.length} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(totalPages - 1)}
            >
              Last
            </Button>
          </div>
        )}
      </div>

      {/* ── Charts Row: Type Breakdown + Year Trend ───────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Type Breakdown — horizontal bar chart */}
        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Top Request Types</CardTitle>
              {!isLoadingChart && typeBreakdown.length > 0 && (
                <span className="text-[10px] text-muted-foreground">Click a bar to filter</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {isLoadingChart ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 flex-1 rounded" />
                  </div>
                ))}
              </div>
            ) : typeBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              <div className="space-y-1.5">
                {typeBreakdown.map((item, index) => {
                  const maxVal = typeBreakdown[0]?.value ?? 1;
                  const pct = (item.value / maxVal) * 100;
                  const isActive = filters.requestType === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={`group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
                        isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60"
                      }`}
                      onClick={() => handleBarClick(item)}
                    >
                      <span
                        className="w-[110px] shrink-0 truncate text-xs text-muted-foreground group-hover:text-foreground"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <div className="relative flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            opacity: isActive ? 1 : 0.75,
                          }}
                        />
                        <span className="relative z-10 flex h-full items-center px-2 text-[11px] font-semibold tabular-nums text-foreground">
                          {formatNumber(item.value)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Year Trend — area chart */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 p-4 pb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Request Volume by Year</CardTitle>
            {!isLoadingTrend && yearTrend.length > 1 && (
              <Badge variant="outline" className="ml-auto text-[10px] font-normal tabular-nums">
                {(() => {
                  const last = yearTrend[yearTrend.length - 1];
                  const prev = yearTrend[yearTrend.length - 2];
                  if (!last || !prev || prev.count === 0) return null;
                  const change = ((last.count - prev.count) / prev.count) * 100;
                  return (
                    <span
                      className={
                        change >= 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(1)}% vs {prev.year}
                    </span>
                  );
                })()}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {isLoadingTrend ? (
              <Skeleton className="h-[300px] w-full rounded" />
            ) : yearTrend.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No trend data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={yearTrend} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => String(v)}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => formatNumber(v)}
                    width={50}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      ...CHART_TOOLTIP_STYLE,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [formatNumber(value), "Requests"]}
                    labelFormatter={(label: number) => `Year ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#trendGradient)"
                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

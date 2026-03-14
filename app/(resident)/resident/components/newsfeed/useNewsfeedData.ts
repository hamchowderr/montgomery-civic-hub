"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ARCGIS_URLS, queryFeatureAttributes, queryFeatureStats } from "@/lib/arcgis-client";
import { useYearFilter } from "@/lib/contexts/year-filter";
import type { FilterState, IncidentItem, StatsSummary, TypeBreakdown, YearTrend } from "./types";
import { PAGE_SIZE } from "./types";
import { buildIncidentWhereClause, formatDuration, normalizeStatus } from "./utils";

export interface UseNewsfeedDataReturn {
  // Filter
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  departmentOptions: string[];
  originOptions: string[];
  isLoadingFilters: boolean;

  // Stats
  stats: StatsSummary;
  avgResolutionTime: number | null;
  isLoadingStats: boolean;

  // Feed
  items: IncidentItem[];
  pagedItems: IncidentItem[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isLoadingFeed: boolean;

  // Charts
  typeBreakdown: TypeBreakdown[];
  isLoadingChart: boolean;
  yearTrend: YearTrend[];
  isLoadingTrend: boolean;
  handleBarClick: (data: TypeBreakdown) => void;

  // Expand
  expandedId: string | null;
  setExpandedId: React.Dispatch<React.SetStateAction<string | null>>;

  // Global
  isLoading: boolean;
  refreshAll: () => void;

  // Helpers exposed for CopilotReadable
  formatDuration: typeof formatDuration;
}

export function useNewsfeedData(): UseNewsfeedDataReturn {
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

  return {
    filters,
    updateFilter,
    departmentOptions,
    originOptions,
    isLoadingFilters,

    stats,
    avgResolutionTime,
    isLoadingStats,

    items,
    pagedItems,
    currentPage,
    totalPages,
    setCurrentPage,
    isLoadingFeed,

    typeBreakdown,
    isLoadingChart,
    yearTrend,
    isLoadingTrend,
    handleBarClick,

    expandedId,
    setExpandedId,

    isLoading,
    refreshAll,

    formatDuration,
  };
}

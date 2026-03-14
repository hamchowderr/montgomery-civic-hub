"use client";

import { CalendarDays, Construction, Newspaper, ShieldAlert, Vote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  type NewsResult,
  searchCityGovernment,
  searchCommunityEvents,
  searchInfrastructure,
  searchLocalNews,
  searchPublicSafety,
} from "@/app/actions/resident-news";
import { ARCGIS_URLS, queryFeatureStats } from "@/lib/arcgis-client";
import type { CategoryConfig, PulseStats, ServiceRequestSummaryData } from "./types";
import { groupByCategory, groupBySource } from "./utils";

// ---------------------------------------------------------------------------
// Category config — the single source of truth
// ---------------------------------------------------------------------------

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "news",
    label: "Local News",
    icon: Newspaper,
    color: "text-blue-600 dark:text-blue-400",
    fetcher: searchLocalNews,
  },
  {
    id: "government",
    label: "City Government",
    icon: Vote,
    color: "text-purple-600 dark:text-purple-400",
    fetcher: searchCityGovernment,
  },
  {
    id: "safety",
    label: "Public Safety",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    fetcher: searchPublicSafety,
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    color: "text-emerald-600 dark:text-emerald-400",
    fetcher: searchCommunityEvents,
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: Construction,
    color: "text-amber-600 dark:text-amber-400",
    fetcher: searchInfrastructure,
  },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
);

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseCityPulseDataReturn {
  news: Record<string, NewsResult[]>;
  loading: Record<string, boolean>;
  stats: PulseStats;
  serviceRequests: ServiceRequestSummaryData[];
  serviceRequestsLoading: boolean;
  sourceDistribution: { source: string; count: number }[];
  categoryDistribution: {
    category: string;
    id: string;
    count: number;
    color: string;
  }[];
  refreshCategory: (id: string) => void;
  refreshAll: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function normalizeDistrict(raw: string): string | null {
  const num = raw?.replace(/\D/g, "");
  return num && num.length <= 2 ? num : null;
}

export function useCityPulseData(): UseCityPulseDataReturn {
  const [news, setNews] = useState<Record<string, NewsResult[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestSummaryData[]>([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(true);

  // ── Fetch a single news category ────────────────────────────────────────
  const fetchCategory = useCallback(async (cat: CategoryConfig) => {
    setLoading((prev) => ({ ...prev, [cat.id]: true }));
    try {
      const data = await cat.fetcher();
      setNews((prev) => ({ ...prev, [cat.id]: data }));
    } catch (err) {
      console.error(`[CityPulse] Failed to fetch ${cat.id}:`, err);
      setNews((prev) => ({ ...prev, [cat.id]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [cat.id]: false }));
    }
  }, []);

  // ── Fetch 311 service requests by district ──────────────────────────────
  const fetchServiceRequests = useCallback(async () => {
    setServiceRequestsLoading(true);
    try {
      const stats = await queryFeatureStats({
        url: ARCGIS_URLS.serviceRequests311,
        groupByField: "District",
        statisticField: "OBJECTID",
      });

      const districtMap = new Map<string, number>();
      for (const r of stats) {
        const d = normalizeDistrict(r.group);
        if (d) districtMap.set(d, (districtMap.get(d) || 0) + r.value);
      }

      setServiceRequests(
        Array.from(districtMap.entries())
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([district, count]) => ({
            district: `District ${district}`,
            count,
          })),
      );
    } catch (err) {
      console.error("[CityPulse] Failed to fetch 311 stats:", err);
      setServiceRequests([]);
    } finally {
      setServiceRequestsLoading(false);
    }
  }, []);

  // ── Refresh helpers ─────────────────────────────────────────────────────
  const refreshCategory = useCallback(
    (id: string) => {
      const cat = CATEGORIES.find((c) => c.id === id);
      if (cat) fetchCategory(cat);
    },
    [fetchCategory],
  );

  const refreshAll = useCallback(() => {
    for (const cat of CATEGORIES) {
      fetchCategory(cat);
    }
    fetchServiceRequests();
  }, [fetchCategory, fetchServiceRequests]);

  // ── Initial fetch: all categories in parallel + 311 ─────────────────────
  useEffect(() => {
    for (const cat of CATEGORIES) {
      fetchCategory(cat);
    }
    fetchServiceRequests();
  }, [fetchCategory, fetchServiceRequests]);

  // ── Derived state ───────────────────────────────────────────────────────
  const totalArticles = Object.values(news).reduce((sum, arr) => sum + arr.length, 0);
  const totalServiceRequests = serviceRequests.reduce((sum, r) => sum + r.count, 0);
  const safetyAlerts = (news.safety ?? []).length;
  const communityEvents = (news.events ?? []).length;

  const stats: PulseStats = {
    totalArticles,
    totalServiceRequests,
    safetyAlerts,
    communityEvents,
  };

  const sourceDistribution = groupBySource(news);
  const categoryDistribution = groupByCategory(news, CATEGORY_LABELS);

  return {
    news,
    loading,
    stats,
    serviceRequests,
    serviceRequestsLoading,
    sourceDistribution,
    categoryDistribution,
    refreshCategory,
    refreshAll,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ARCGIS_URLS,
  queryFeatureCount,
  queryFeatureAttributes,
} from "@/lib/arcgis-client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HomepageStats {
  serviceRequests: number | null;
  constructionPermits: number | null;
  businessLicenses: number | null;
  codeViolations: number | null;
}

export interface RequestTypeEntry {
  type: string;
  count: number;
}

export interface PermitStatusEntry {
  status: string;
  count: number;
}

interface UseHomepageDataReturn {
  stats: HomepageStats | null;
  requestTypes: RequestTypeEntry[];
  permitStatus: PermitStatusEntry[];
  loading: boolean;
  error: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR = 2025;

/** Simple year WHERE clause for the homepage (not using the YearRange context). */
function yearEq(field: string = "Year", quoted: boolean = false): string {
  const val = quoted ? `'${CURRENT_YEAR}'` : String(CURRENT_YEAR);
  return `${field} = ${val}`;
}

/**
 * Fetch grouped statistics via ArcGIS outStatistics.
 * queryFeatureAttributes doesn't support outStatistics, so we use raw fetch.
 */
async function fetchGroupedStats(
  url: string,
  statField: string,
  groupField: string,
  where: string = "1=1",
): Promise<{ name: string; count: number }[]> {
  try {
    const params = new URLSearchParams({
      where,
      outStatistics: JSON.stringify([
        {
          statisticType: "count",
          onStatisticField: statField,
          outStatisticFieldName: "cnt",
        },
      ]),
      groupByFieldsForStatistics: groupField,
      orderByFields: "cnt DESC",
      f: "json",
    });

    const res = await fetch(`${url}/query?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (data.error || !Array.isArray(data.features)) return [];

    return data.features.map((f: { attributes: Record<string, unknown> }) => ({
      name: String(f.attributes[groupField] ?? "Unknown"),
      count: Number(f.attributes.cnt ?? 0),
    }));
  } catch (err) {
    console.error("[use-homepage-data] fetchGroupedStats failed:", err);
    return [];
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useHomepageData(): UseHomepageDataReturn {
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [requestTypes, setRequestTypes] = useState<RequestTypeEntry[]>([]);
  const [permitStatus, setPermitStatus] = useState<PermitStatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        serviceRequests,
        constructionPermits,
        businessLicenses,
        codeViolations,
        topRequestTypes,
        permitBreakdown,
      ] = await Promise.all([
        // 1. 311 Service Requests count (current year)
        queryFeatureCount(ARCGIS_URLS.serviceRequests311, yearEq()),
        // 2. Active Construction Permits count (current year — Year field is quoted string)
        queryFeatureCount(
          ARCGIS_URLS.constructionPermits,
          yearEq("Year", true),
        ),
        // 3. Business Licenses count (current year — pvYEAR field)
        queryFeatureCount(ARCGIS_URLS.businessLicense, yearEq("pvYEAR")),
        // 4. Code Violations count (current year — Year field is quoted string)
        queryFeatureCount(ARCGIS_URLS.codeViolations, yearEq("Year", true)),
        // 5. Top 5 service request types grouped by Request_Type
        fetchGroupedStats(
          ARCGIS_URLS.serviceRequests311,
          "OBJECTID",
          "Request_Type",
          yearEq(),
        ),
        // 6. Permits by status breakdown
        fetchGroupedStats(
          ARCGIS_URLS.constructionPermits,
          "OBJECTID",
          "Status",
          yearEq("Year", true),
        ),
      ]);

      setStats({
        serviceRequests,
        constructionPermits,
        businessLicenses,
        codeViolations,
      });

      // Take top 5 request types
      setRequestTypes(
        topRequestTypes.slice(0, 5).map((r) => ({
          type: r.name,
          count: r.count,
        })),
      );

      // Normalize permit status to Pending/Approved/Issued buckets (plus any others)
      setPermitStatus(
        permitBreakdown.map((p) => ({
          status: p.name,
          count: p.count,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch homepage data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, requestTypes, permitStatus, loading, error };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ARCGIS_URLS,
  queryFeatureAttributes,
  queryFeatureCount,
  queryFeatureStats,
  queryMultiStats,
  queryTotalStats,
} from "@/lib/arcgis-client";
import { yearWhere } from "@/lib/arcgis-helpers";
import { useYearFilter, type YearRange } from "@/lib/contexts/year-filter";

interface UseChartDataReturn {
  data: any[] | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// Normalize district values to "D1", "D2", etc.
function normalizeDistrict(raw: unknown): string {
  const s = String(raw ?? "0").trim();
  if (s === "0" || s === "" || s.toLowerCase() === "unknown") return "Unassigned";
  const num = s.replace(/\D+/g, "");
  return num ? `D${num}` : "Unassigned";
}

const TRANSPORTATION_TERMS = /road|street|traffic|pothole|transit|sidewalk|signal/i;

// ---------------------------------------------------------------------------
// Fetchers: Shared / Existing
// ---------------------------------------------------------------------------

async function fetchBudgetChartData(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.constructionPermits,
    where: yearWhere(yr, "Year", true),
    groupByField: "DistrictCouncil",
    statisticField: "EstimatedCost",
    statisticType: "sum",
  });

  return stats
    .map((s) => {
      const key = s.group === "0" || s.group === "Unknown" ? "Unassigned" : `District ${s.group}`;
      return { department: key, budget: Math.round((s.value / 1_000_000) * 10) / 10 };
    })
    .sort((a, b) => a.department.localeCompare(b.department));
}

async function fetchCrimeTrendsData(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.serviceRequests311,
    where: yearWhere(yr),
    groupByField: "Year",
    statisticField: "Request_ID",
    statisticType: "count",
  });

  return stats
    .filter((s) => s.group !== "Unknown" && s.group !== "0" && s.group !== "null")
    .sort((a, b) => a.group.localeCompare(b.group))
    .map((s) => ({ year: s.group, count: s.value }));
}

async function fetchServiceRequestsData(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.serviceRequests311,
    where: yearWhere(yr),
    groupByField: "Request_Type",
    statisticField: "Request_ID",
    statisticType: "count",
  });

  return stats
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((s) => ({ type: s.group, count: s.value }));
}

async function fetchPermitActivityData(yr: YearRange): Promise<any[]> {
  const rows = await queryMultiStats({
    url: ARCGIS_URLS.constructionPermits,
    where: yearWhere(yr, "Year", true),
    groupByField: "Year",
    statistics: [
      { field: "PermitNo", type: "count", alias: "permit_count" },
      { field: "EstimatedCost", type: "sum", alias: "total_cost" },
    ],
  });

  return rows
    .map((r) => {
      const year = String(r.Year ?? "Unknown");
      return { year, permits: Number(r.permit_count) || 0, cost: Number(r.total_cost) || 0 };
    })
    .filter((r) => r.year !== "Unknown" && r.year !== "0")
    .sort((a, b) => a.year.localeCompare(b.year));
}

async function fetchCityOwnedPropertiesData(): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.cityOwnedProperties,
    groupByField: "Use_",
    statisticField: "OBJECTID_1",
    statisticType: "count",
  });

  return stats
    .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((s) => ({ type: s.group, count: s.value }));
}

async function fetchTransportationRequestsData(yr: YearRange): Promise<any[]> {
  // Get all request type counts, then filter client-side by transportation terms.
  // Stats result set is small (one row per type) so no pagination issue.
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.serviceRequests311,
    where: yearWhere(yr),
    groupByField: "Request_Type",
    statisticField: "Request_ID",
    statisticType: "count",
  });

  return stats
    .filter((s) => TRANSPORTATION_TERMS.test(s.group))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((s) => ({ type: s.group, count: s.value }));
}

// ---------------------------------------------------------------------------
// Fetchers: Resident
// ---------------------------------------------------------------------------

async function fetchRequestsByStatus(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.serviceRequests311,
    where: yearWhere(yr),
    groupByField: "Status",
    statisticField: "Request_ID",
    statisticType: "count",
  });

  return stats.sort((a, b) => b.value - a.value).map((s) => ({ status: s.group, count: s.value }));
}

async function fetchRequestsByDistrict(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.serviceRequests311,
    where: yearWhere(yr),
    groupByField: "District",
    statisticField: "Request_ID",
    statisticType: "count",
  });

  return stats
    .map((s) => {
      const key = s.group === "0" || s.group === "Unknown" ? "Unassigned" : `District ${s.group}`;
      return { district: key, count: s.value };
    })
    .sort((a, b) => a.district.localeCompare(b.district));
}

async function fetchFacilityCounts(): Promise<any[]> {
  const [police, fire, community, libraries, schools, daycare, health] = await Promise.all([
    queryFeatureCount(ARCGIS_URLS.policeFacilities),
    queryFeatureCount(ARCGIS_URLS.fireStations),
    queryFeatureCount(ARCGIS_URLS.communityCenters),
    queryFeatureCount(ARCGIS_URLS.libraries),
    queryFeatureCount(ARCGIS_URLS.educationFacilities),
    queryFeatureCount(ARCGIS_URLS.daycareCenters),
    queryFeatureCount(ARCGIS_URLS.healthCare),
  ]);

  return [
    { facility: "Schools", count: schools ?? 0 },
    { facility: "Health Care", count: health ?? 0 },
    { facility: "Daycare Centers", count: daycare ?? 0 },
    { facility: "Community Centers", count: community ?? 0 },
    { facility: "Fire Stations", count: fire ?? 0 },
    { facility: "Police Facilities", count: police ?? 0 },
    { facility: "Libraries", count: libraries ?? 0 },
  ].sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Fetchers: Business
// ---------------------------------------------------------------------------

async function fetchLicensesByCategory(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.businessLicense,
    where: yearWhere(yr, "pvYEAR"),
    groupByField: "scNAME",
    statisticField: "scNAME",
    statisticType: "count",
  });

  return stats
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((s) => ({ category: s.group, count: s.value }));
}

async function fetchPermitStatusBreakdown(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.constructionPermits,
    where: yearWhere(yr, "Year", true),
    groupByField: "PermitStatus",
    statisticField: "PermitNo",
    statisticType: "count",
  });

  return stats.sort((a, b) => b.value - a.value).map((s) => ({ status: s.group, count: s.value }));
}

async function fetchLicensesByYear(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.businessLicense,
    where: yearWhere(yr, "pvYEAR"),
    groupByField: "pvYEAR",
    statisticField: "pvYEAR",
    statisticType: "count",
  });

  return stats
    .filter((s) => s.group !== "Unknown" && s.group !== "0" && s.group !== "null")
    .sort((a, b) => a.group.localeCompare(b.group))
    .map((s) => ({ year: s.group, count: s.value }));
}

// ---------------------------------------------------------------------------
// Fetchers: City Staff
// ---------------------------------------------------------------------------

async function fetchViolationsByStatus(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.codeViolations,
    where: yearWhere(yr, "Year", true),
    groupByField: "CaseStatus",
    statisticField: "OffenceNum",
    statisticType: "count",
  });

  return stats.sort((a, b) => b.value - a.value).map((s) => ({ status: s.group, count: s.value }));
}

async function fetchViolationsByDistrict(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.codeViolations,
    where: yearWhere(yr, "Year", true),
    groupByField: "CouncilDistrict",
    statisticField: "OffenceNum",
    statisticType: "count",
  });

  // Merge normalized district keys (e.g. "DISTRICT 5" → "D5")
  const districtMap = new Map<string, number>();
  for (const s of stats) {
    const key = normalizeDistrict(s.group);
    districtMap.set(key, (districtMap.get(key) ?? 0) + s.value);
  }

  return Array.from(districtMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([district, count]) => ({ district, count }));
}

async function fetchPavingByStatus(): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.pavingProject,
    groupByField: "Status",
    statisticField: "Status",
    statisticType: "count",
  });

  return stats.sort((a, b) => b.value - a.value).map((s) => ({ status: s.group, count: s.value }));
}

async function fetchNuisanceByType(_yr: YearRange): Promise<any[]> {
  // Nuisance Remark field is comma-separated keywords — must parse client-side.
  // Dataset is small (~hundreds of records), so pagination isn't a concern here.
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.nuisance,
    outFields: "Remark",
  });

  const typeMap = new Map<string, number>();
  for (const row of attrs) {
    const remark = String(row.Remark ?? "");
    if (!remark) continue;
    const keywords = remark
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const kw of keywords) {
      typeMap.set(kw, (typeMap.get(kw) ?? 0) + 1);
    }
  }

  return Array.from(typeMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

// ---------------------------------------------------------------------------
// Fetchers: Researcher
// ---------------------------------------------------------------------------

async function fetchViolationsByYear(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.codeViolations,
    where: yearWhere(yr, "Year", true),
    groupByField: "Year",
    statisticField: "OffenceNum",
    statisticType: "count",
  });

  return stats
    .filter((s) => s.group !== "Unknown" && s.group !== "0" && s.group !== "null")
    .sort((a, b) => a.group.localeCompare(b.group))
    .map((s) => ({ year: s.group, count: s.value }));
}

async function fetchPermitsByYear(yr: YearRange): Promise<any[]> {
  const stats = await queryFeatureStats({
    url: ARCGIS_URLS.constructionPermits,
    where: yearWhere(yr, "Year", true),
    groupByField: "Year",
    statisticField: "PermitNo",
    statisticType: "count",
  });

  return stats
    .filter((s) => s.group !== "Unknown" && s.group !== "0" && s.group !== "null")
    .sort((a, b) => a.group.localeCompare(b.group))
    .map((s) => ({ year: s.group, count: s.value }));
}

async function fetchDistrictComparison(yr: YearRange): Promise<any[]> {
  const [requestStats, violationStats] = await Promise.all([
    queryFeatureStats({
      url: ARCGIS_URLS.serviceRequests311,
      where: yearWhere(yr),
      groupByField: "District",
      statisticField: "Request_ID",
      statisticType: "count",
    }),
    queryFeatureStats({
      url: ARCGIS_URLS.codeViolations,
      where: yearWhere(yr, "Year", true),
      groupByField: "CouncilDistrict",
      statisticField: "OffenceNum",
      statisticType: "count",
    }),
  ]);

  const districtData = new Map<string, { requests: number; violations: number }>();

  for (const s of requestStats) {
    const key = normalizeDistrict(s.group);
    const entry = districtData.get(key) ?? { requests: 0, violations: 0 };
    entry.requests += s.value;
    districtData.set(key, entry);
  }

  for (const s of violationStats) {
    const key = normalizeDistrict(s.group);
    const entry = districtData.get(key) ?? { requests: 0, violations: 0 };
    entry.violations += s.value;
    districtData.set(key, entry);
  }

  return Array.from(districtData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([district, data]) => ({
      district,
      requests: data.requests,
      violations: data.violations,
    }));
}

async function fetchCensusData(): Promise<any[]> {
  const totals = await queryTotalStats({
    url: ARCGIS_URLS.censusBlock,
    statistics: [
      { field: "P1_003N", type: "sum", alias: "white" },
      { field: "P1_004N", type: "sum", alias: "black" },
      { field: "P1_005N", type: "sum", alias: "native" },
      { field: "P1_006N", type: "sum", alias: "asian" },
      { field: "P1_007N", type: "sum", alias: "pacific" },
      { field: "P1_008N", type: "sum", alias: "other" },
    ],
  });

  return [
    { category: "Black / African Am.", value: totals.black ?? 0 },
    { category: "White", value: totals.white ?? 0 },
    { category: "Asian", value: totals.asian ?? 0 },
    { category: "Native American", value: totals.native ?? 0 },
    { category: "Pacific Islander", value: totals.pacific ?? 0 },
    { category: "Other", value: totals.other ?? 0 },
  ].sort((a, b) => b.value - a.value);
}

async function fetchHouseholdData(): Promise<any[]> {
  const totals = await queryTotalStats({
    url: ARCGIS_URLS.censusBlock,
    statistics: [
      { field: "OCC_HH", type: "sum", alias: "occupied" },
      { field: "VAC_HH", type: "sum", alias: "vacant" },
    ],
  });

  return [
    { category: "Occupied", value: totals.occupied ?? 0 },
    { category: "Vacant", value: totals.vacant ?? 0 },
  ];
}

// ---------------------------------------------------------------------------
// Master hook
// ---------------------------------------------------------------------------

export function useChartData(chartId: string): UseChartDataReturn {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { yearRange } = useYearFilter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result: any[];
      switch (chartId) {
        // Existing
        case "budget":
          result = await fetchBudgetChartData(yearRange);
          break;
        case "crimeTrends":
          result = await fetchCrimeTrendsData(yearRange);
          break;
        case "serviceRequests":
          result = await fetchServiceRequestsData(yearRange);
          break;
        case "permitActivity":
          result = await fetchPermitActivityData(yearRange);
          break;
        case "cityOwnedProperties":
          result = await fetchCityOwnedPropertiesData();
          break;
        case "transportationRequests":
          result = await fetchTransportationRequestsData(yearRange);
          break;
        // Resident
        case "requestsByStatus":
          result = await fetchRequestsByStatus(yearRange);
          break;
        case "requestsByDistrict":
          result = await fetchRequestsByDistrict(yearRange);
          break;
        case "facilityCounts":
          result = await fetchFacilityCounts();
          break;
        // Business
        case "licensesByCategory":
          result = await fetchLicensesByCategory(yearRange);
          break;
        case "permitStatusBreakdown":
          result = await fetchPermitStatusBreakdown(yearRange);
          break;
        case "licensesByYear":
          result = await fetchLicensesByYear(yearRange);
          break;
        // City Staff
        case "violationsByStatus":
          result = await fetchViolationsByStatus(yearRange);
          break;
        case "violationsByDistrict":
          result = await fetchViolationsByDistrict(yearRange);
          break;
        case "pavingByStatus":
          result = await fetchPavingByStatus();
          break;
        case "nuisanceByType":
          result = await fetchNuisanceByType(yearRange);
          break;
        // Researcher
        case "violationsByYear":
          result = await fetchViolationsByYear(yearRange);
          break;
        case "permitsByYear":
          result = await fetchPermitsByYear(yearRange);
          break;
        case "districtComparison":
          result = await fetchDistrictComparison(yearRange);
          break;
        case "censusData":
          result = await fetchCensusData();
          break;
        case "householdData":
          result = await fetchHouseholdData();
          break;
        default:
          result = [];
      }
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load chart data";
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [chartId, yearRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}

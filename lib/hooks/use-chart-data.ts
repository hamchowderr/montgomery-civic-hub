"use client";

import { useCallback, useEffect, useState } from "react";
import { ARCGIS_URLS, queryFeatureAttributes } from "@/lib/arcgis-client";
import { useYearFilter, type YearRange } from "@/lib/contexts/year-filter";
import { yearWhere } from "@/lib/arcgis-helpers";

interface UseChartDataReturn {
  data: any[] | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Shared / existing fetchers (now year-aware)
// ---------------------------------------------------------------------------

async function fetchBudgetChartData(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.constructionPermits,
    outFields: "PermitNo,DistrictCouncil,EstimatedCost",
    where: yearWhere(yr, "Year", true),
  });

  const districtMap = new Map<string, number>();
  for (const row of attrs) {
    const district = String(row.DistrictCouncil ?? "Unknown");
    const cost = Number(row.EstimatedCost) || 0;
    const key =
      district === "0" || district === "Unknown"
        ? "Unassigned"
        : `District ${district}`;
    districtMap.set(key, (districtMap.get(key) ?? 0) + cost);
  }

  return Array.from(districtMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([department, budget]) => ({
      department,
      budget: Math.round((budget / 1_000_000) * 10) / 10,
    }));
}

async function fetchCrimeTrendsData(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.serviceRequests311,
    outFields: "Year,Request_ID",
    where: yearWhere(yr),
  });

  const yearMap = new Map<number, number>();
  for (const row of attrs) {
    const year = Number(row.Year);
    if (year > 0) {
      yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
    }
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year: year.toString(), count }));
}

async function fetchServiceRequestsData(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.serviceRequests311,
    outFields: "Request_Type,Year",
    where: yearWhere(yr),
  });

  const typeMap = new Map<string, number>();
  for (const row of attrs) {
    const type = String(row.Request_Type ?? "Other");
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  }

  return Array.from(typeMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

async function fetchPermitActivityData(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.constructionPermits,
    outFields: "Year,PermitNo,EstimatedCost",
    where: yearWhere(yr, "Year", true),
  });

  const yearMap = new Map<string, { count: number; cost: number }>();
  for (const row of attrs) {
    const year = String(row.Year ?? "Unknown");
    if (year === "Unknown" || year === "0") continue;
    const entry = yearMap.get(year) ?? { count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += Number(row.EstimatedCost) || 0;
    yearMap.set(year, entry);
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, { count, cost }]) => ({ year, permits: count, cost }));
}

async function fetchCityOwnedPropertiesData(): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.cityOwnedProperties,
    outFields: "Property_Type,Ward",
  });

  const typeMap = new Map<string, number>();
  for (const row of attrs) {
    const type = String(row.Property_Type ?? "Unknown");
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  }

  return Array.from(typeMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

const TRANSPORTATION_TERMS =
  /road|street|traffic|pothole|transit|sidewalk|signal/i;

async function fetchTransportationRequestsData(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.serviceRequests311,
    outFields: "Request_Type,Year",
    where: yearWhere(yr),
  });

  const typeMap = new Map<string, number>();
  for (const row of attrs) {
    const type = String(row.Request_Type ?? "");
    if (TRANSPORTATION_TERMS.test(type)) {
      typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
    }
  }

  return Array.from(typeMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

// ---------------------------------------------------------------------------
// NEW fetchers: Resident
// ---------------------------------------------------------------------------

async function fetchRequestsByStatus(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.serviceRequests311,
    outFields: "Status,Year",
    where: yearWhere(yr),
  });

  const statusMap = new Map<string, number>();
  for (const row of attrs) {
    const status = String(row.Status ?? "Unknown");
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return Array.from(statusMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({ status, count }));
}

async function fetchRequestsByDistrict(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.serviceRequests311,
    outFields: "District,Year",
    where: yearWhere(yr),
  });

  const districtMap = new Map<string, number>();
  for (const row of attrs) {
    const d = String(row.District ?? "Unknown");
    const key = d === "0" || d === "Unknown" ? "Unassigned" : `District ${d}`;
    districtMap.set(key, (districtMap.get(key) ?? 0) + 1);
  }

  return Array.from(districtMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([district, count]) => ({ district, count }));
}

async function fetchFacilityCounts(): Promise<any[]> {
  const [police, fire, community, libraries, schools, daycare, health] =
    await Promise.all([
      queryFeatureAttributes({
        url: ARCGIS_URLS.policeFacilities,
        outFields: "Facility_Name",
      }),
      queryFeatureAttributes({
        url: ARCGIS_URLS.fireStations,
        outFields: "Name",
      }),
      queryFeatureAttributes({
        url: ARCGIS_URLS.communityCenters,
        outFields: "FACILITY_N",
      }),
      queryFeatureAttributes({
        url: ARCGIS_URLS.libraries,
        outFields: "BRANCH_NAME",
      }),
      queryFeatureAttributes({
        url: ARCGIS_URLS.educationFacilities,
        outFields: "NAME",
      }),
      queryFeatureAttributes({
        url: ARCGIS_URLS.daycareCenters,
        outFields: "Name",
      }),
      queryFeatureAttributes({
        url: ARCGIS_URLS.healthCare,
        outFields: "COMPANY_NA",
      }),
    ]);

  return [
    { facility: "Schools", count: schools.length },
    { facility: "Health Care", count: health.length },
    { facility: "Daycare Centers", count: daycare.length },
    { facility: "Community Centers", count: community.length },
    { facility: "Fire Stations", count: fire.length },
    { facility: "Police Facilities", count: police.length },
    { facility: "Libraries", count: libraries.length },
  ].sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// NEW fetchers: Business
// ---------------------------------------------------------------------------

async function fetchLicensesByCategory(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.businessLicense,
    outFields: "scNAME,pvYEAR",
    where: yearWhere(yr, "pvYEAR"),
  });

  const catMap = new Map<string, number>();
  for (const row of attrs) {
    const cat = String(row.scNAME ?? "Other");
    catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
  }

  return Array.from(catMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }));
}

async function fetchPermitStatusBreakdown(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.constructionPermits,
    outFields: "PermitStatus,Year",
    where: yearWhere(yr, "Year", true),
  });

  const statusMap = new Map<string, number>();
  for (const row of attrs) {
    const status = String(row.PermitStatus ?? "Unknown");
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return Array.from(statusMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({ status, count }));
}

async function fetchLicensesByYear(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.businessLicense,
    outFields: "pvYEAR",
    where: yearWhere(yr, "pvYEAR"),
  });

  const yearMap = new Map<number, number>();
  for (const row of attrs) {
    const year = Number(row.pvYEAR);
    if (year > 0) {
      yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
    }
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year: year.toString(), count }));
}

// ---------------------------------------------------------------------------
// NEW fetchers: City Staff
// ---------------------------------------------------------------------------

async function fetchViolationsByStatus(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.codeViolations,
    outFields: "CaseStatus,Year",
    where: yearWhere(yr, "Year", true),
  });

  const statusMap = new Map<string, number>();
  for (const row of attrs) {
    const status = String(row.CaseStatus ?? "Unknown");
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return Array.from(statusMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({ status, count }));
}

async function fetchViolationsByDistrict(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.codeViolations,
    outFields: "District,Year",
    where: yearWhere(yr, "Year", true),
  });

  const districtMap = new Map<string, number>();
  for (const row of attrs) {
    const d = String(row.District ?? "Unknown");
    const key = d === "0" || d === "Unknown" ? "Unassigned" : `District ${d}`;
    districtMap.set(key, (districtMap.get(key) ?? 0) + 1);
  }

  return Array.from(districtMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([district, count]) => ({ district, count }));
}

async function fetchPavingByStatus(): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.pavingProject,
    outFields: "Status,Year",
  });

  const statusMap = new Map<string, number>();
  for (const row of attrs) {
    const status = String(row.Status ?? "Unknown");
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return Array.from(statusMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({ status, count }));
}

async function fetchNuisanceByType(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.nuisance,
    outFields: "Type,Date",
  });

  // Nuisance doesn't have a Year field — filter by Date if available
  const filtered = attrs.filter((row) => {
    if (!row.Date) return true;
    const d = new Date(Number(row.Date));
    const y = d.getFullYear();
    return y >= yr.from && y <= yr.to;
  });

  const typeMap = new Map<string, number>();
  for (const row of filtered) {
    const type = String(row.Type ?? "Unknown");
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  }

  return Array.from(typeMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

// ---------------------------------------------------------------------------
// NEW fetchers: Researcher
// ---------------------------------------------------------------------------

async function fetchViolationsByYear(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.codeViolations,
    outFields: "Year,OffenceNum",
    where: yearWhere(yr, "Year", true),
  });

  const yearMap = new Map<string, number>();
  for (const row of attrs) {
    const year = String(row.Year ?? "Unknown");
    if (year === "Unknown" || year === "0") continue;
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));
}

async function fetchPermitsByYear(yr: YearRange): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.constructionPermits,
    outFields: "Year,PermitNo",
    where: yearWhere(yr, "Year", true),
  });

  const yearMap = new Map<string, number>();
  for (const row of attrs) {
    const year = String(row.Year ?? "Unknown");
    if (year === "Unknown" || year === "0") continue;
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));
}

async function fetchDistrictComparison(yr: YearRange): Promise<any[]> {
  const [requests, violations] = await Promise.all([
    queryFeatureAttributes({
      url: ARCGIS_URLS.serviceRequests311,
      outFields: "District,Year",
      where: yearWhere(yr),
    }),
    queryFeatureAttributes({
      url: ARCGIS_URLS.codeViolations,
      outFields: "District,Year",
      where: yearWhere(yr, "Year", true),
    }),
  ]);

  const districtData = new Map<
    string,
    { requests: number; violations: number }
  >();

  for (const row of requests) {
    const d = String(row.District ?? "0");
    const key = d === "0" ? "Unassigned" : `D${d}`;
    const entry = districtData.get(key) ?? { requests: 0, violations: 0 };
    entry.requests += 1;
    districtData.set(key, entry);
  }

  for (const row of violations) {
    const d = String(row.District ?? "0");
    const key = d === "0" ? "Unassigned" : `D${d}`;
    const entry = districtData.get(key) ?? { requests: 0, violations: 0 };
    entry.violations += 1;
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
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.censusBlock,
    outFields: "P1_003N,P1_004N,P1_005N,P1_006N,P1_007N,P1_008N",
  });

  let white = 0;
  let black = 0;
  let native = 0;
  let asian = 0;
  let pacific = 0;
  let other = 0;

  for (const row of attrs) {
    white += Number(row.P1_003N) || 0;
    black += Number(row.P1_004N) || 0;
    native += Number(row.P1_005N) || 0;
    asian += Number(row.P1_006N) || 0;
    pacific += Number(row.P1_007N) || 0;
    other += Number(row.P1_008N) || 0;
  }

  return [
    { category: "Black / African Am.", value: black },
    { category: "White", value: white },
    { category: "Asian", value: asian },
    { category: "Native American", value: native },
    { category: "Pacific Islander", value: pacific },
    { category: "Other", value: other },
  ].sort((a, b) => b.value - a.value);
}

async function fetchHouseholdData(): Promise<any[]> {
  const attrs = await queryFeatureAttributes({
    url: ARCGIS_URLS.censusBlock,
    outFields: "TOT_HH,OCC_HH,VAC_HH",
  });

  let totalHH = 0;
  let occupied = 0;
  let vacant = 0;

  for (const row of attrs) {
    totalHH += Number(row.TOT_HH) || 0;
    occupied += Number(row.OCC_HH) || 0;
    vacant += Number(row.VAC_HH) || 0;
  }

  return [
    { category: "Occupied", value: occupied },
    { category: "Vacant", value: vacant },
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
      const message =
        err instanceof Error ? err.message : "Failed to load chart data";
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

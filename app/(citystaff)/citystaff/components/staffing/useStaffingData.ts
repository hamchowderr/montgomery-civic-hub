"use client";

import { useEffect, useState } from "react";
import { ARCGIS_URLS, queryFeatureStats, queryTotalStats } from "@/lib/arcgis-client";
import type { DemandData, PavingTotals, ViolationTypeData } from "./types";
import { normalizeDistrict } from "./utils";

export interface UseStaffingDataReturn {
  demandSummary: DemandData[];
  violationSummary: ViolationTypeData[];
  pavingSummary: PavingTotals | null;
}

export function useStaffingData(): UseStaffingDataReturn {
  const [demandSummary, setDemandSummary] = useState<DemandData[]>([]);
  const [violationSummary, setViolationSummary] = useState<ViolationTypeData[]>([]);
  const [pavingSummary, setPavingSummary] = useState<PavingTotals | null>(null);

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
              { field: "OBJECTID", type: "count", alias: "totalProjects" },
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

  return { demandSummary, violationSummary, pavingSummary };
}

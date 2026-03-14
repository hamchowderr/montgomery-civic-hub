"use client";

import { useEffect, useState } from "react";
import {
  ARCGIS_URLS,
  queryFeatureAttributes,
  queryFeatureCount,
  queryFeatureStats,
} from "@/lib/arcgis-client";
import type {
  DistrictStat,
  FireStation,
  HealthCareFacility,
  PoliceFacility,
  ResourceCounts,
} from "./types";
import { groupHealthCareByType } from "./utils";

export interface UseEmergencyDataReturn {
  sirenCount: number | null;
  policeFacilities: PoliceFacility[];
  fireStations: FireStation[];
  healthCare: HealthCareFacility[];
  facilitiesLoading: boolean;
  districtDemand: DistrictStat[];
  statusBreakdown: DistrictStat[];
  statsLoading: boolean;
  resources: ResourceCounts;
  resourcesLoading: boolean;
  healthCareByType: Record<string, HealthCareFacility[]>;
}

export function useEmergencyData(): UseEmergencyDataReturn {
  // Tornado siren count
  const [sirenCount, setSirenCount] = useState<number | null>(null);

  // Facility data
  const [policeFacilities, setPoliceFacilities] = useState<PoliceFacility[]>([]);
  const [fireStations, setFireStations] = useState<FireStation[]>([]);
  const [healthCare, setHealthCare] = useState<HealthCareFacility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  // 311 stats
  const [districtDemand, setDistrictDemand] = useState<DistrictStat[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<DistrictStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Resource counts
  const [resources, setResources] = useState<ResourceCounts>({
    communityCenters: null,
    libraries: null,
    daycareCenters: null,
    educationFacilities: null,
    recyclingLocations: null,
  });
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Fetch tornado siren count
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    queryFeatureCount(ARCGIS_URLS.tornadoSirens).then((count) => {
      if (!cancelled) setSirenCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch facility data (police, fire, medical)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchFacilities() {
      setFacilitiesLoading(true);

      const [policeData, fireData, healthData] = await Promise.all([
        queryFeatureAttributes({
          url: ARCGIS_URLS.policeFacilities,
          outFields: "Facility_Name,Facility_Address",
        }),
        queryFeatureAttributes({
          url: ARCGIS_URLS.fireStations,
          outFields: "Id,Name,Address",
        }),
        queryFeatureAttributes({
          url: ARCGIS_URLS.healthCare,
          outFields: "COMPANY_NA,ADDRESS,PHONE,TYPE_FACIL,EMPLOY,BEDS_UNITS",
        }),
      ]);

      if (cancelled) return;

      setPoliceFacilities(
        policeData.map((d) => ({
          Facility_Name: String(d.Facility_Name ?? "Unknown"),
          Facility_Address: String(d.Facility_Address ?? ""),
        })),
      );
      setFireStations(
        fireData.map((d) => ({
          Id: Number(d.Id) || 0,
          Name: String(d.Name ?? "Unknown"),
          Address: String(d.Address ?? ""),
        })),
      );
      setHealthCare(
        healthData.map((d) => ({
          COMPANY_NA: String(d.COMPANY_NA ?? "Unknown"),
          ADDRESS: String(d.ADDRESS ?? ""),
          PHONE: String(d.PHONE ?? ""),
          TYPE_FACIL: String(d.TYPE_FACIL ?? "Other"),
          EMPLOY: Number(d.EMPLOY) || 0,
          BEDS_UNITS: Number(d.BEDS_UNITS) || 0,
        })),
      );
      setFacilitiesLoading(false);
    }

    fetchFacilities();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch 311 stats
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setStatsLoading(true);

      const [districtData, statusData] = await Promise.all([
        queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "District",
          statisticField: "OBJECTID",
        }),
        queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "Status",
          statisticField: "OBJECTID",
        }),
      ]);

      if (cancelled) return;

      // Sort district demand descending
      setDistrictDemand(
        districtData
          .filter((d) => d.group && d.group !== "null" && d.group !== "Unknown")
          .sort((a, b) => b.value - a.value),
      );
      setStatusBreakdown(statusData.filter((d) => d.group && d.group !== "null"));
      setStatsLoading(false);
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch resource counts
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchResources() {
      setResourcesLoading(true);

      const [cc, lib, daycare, edu, recycle] = await Promise.all([
        queryFeatureCount(ARCGIS_URLS.communityCenters),
        queryFeatureCount(ARCGIS_URLS.libraries),
        queryFeatureCount(ARCGIS_URLS.daycareCenters),
        queryFeatureCount(ARCGIS_URLS.educationFacilities),
        queryFeatureCount(ARCGIS_URLS.recyclingLocations),
      ]);

      if (cancelled) return;

      setResources({
        communityCenters: cc,
        libraries: lib,
        daycareCenters: daycare,
        educationFacilities: edu,
        recyclingLocations: recycle,
      });
      setResourcesLoading(false);
    }

    fetchResources();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Derived: group healthcare by type
  // -------------------------------------------------------------------------
  const healthCareByType = groupHealthCareByType(healthCare);

  return {
    sirenCount,
    policeFacilities,
    fireStations,
    healthCare,
    facilitiesLoading,
    districtDemand,
    statusBreakdown,
    statsLoading,
    resources,
    resourcesLoading,
    healthCareByType,
  };
}

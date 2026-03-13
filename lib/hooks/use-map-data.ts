"use client";

import { useCallback, useEffect, useState } from "react";
import { ARCGIS_URLS, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";
import { yearWhere } from "@/lib/arcgis-helpers";
import { useYearFilter, type YearRange } from "@/lib/contexts/year-filter";

export interface MapLayer {
  id: string;
  label: string;
  color: string;
  type: string;
}

interface UseMapDataReturn {
  geojson: GeoJSON.FeatureCollection | null;
  layers: MapLayer[];
  isLoading: boolean;
  refresh: () => void;
}

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

interface PortalMapFetcher {
  url: string;
  outFields?: string;
  where?: string;
  /** If true, year filter is applied to this layer's where clause */
  yearFilterField?: string;
  /** If true, the year field should be quoted in queries */
  yearQuoted?: boolean;
  layer: MapLayer;
}

interface PortalMapConfig {
  fetchers: PortalMapFetcher[];
}

function getPortalMapConfig(portal: string): PortalMapConfig | null {
  switch (portal) {
    case "resident":
      return {
        fetchers: [
          {
            url: ARCGIS_URLS.serviceRequests311,
            outFields: "Request_ID,Request_Type,Department,Address,Status,District",
            yearFilterField: "Year",
            layer: {
              id: "311-requests",
              label: "311 Requests",
              color: "#3b82f6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.codeViolations,
            outFields: "OffenceNum,CaseType,CaseStatus,Address1,CouncilDistrict,Year",
            yearFilterField: "Year",
            yearQuoted: true,
            layer: {
              id: "code-violations",
              label: "Code Violations",
              color: "#ef4444",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.nuisance,
            outFields: "OffenseNo,Location,Remark,Type,Date,District",
            layer: {
              id: "nuisance",
              label: "Nuisance Properties",
              color: "#d946ef",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.cityOwnedProperties,
            outFields: "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE",
            layer: {
              id: "city-properties",
              label: "City-Owned Properties",
              color: "#14b8a6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.healthCare,
            outFields: "COMPANY_NA,ADDRESS,TYPE_FACIL",
            layer: {
              id: "health-care",
              label: "Health Care",
              color: "#22c55e",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.policeFacilities,
            outFields: "Facility_Name,Facility_Address",
            layer: {
              id: "police",
              label: "Police Facilities",
              color: "#ef4444",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.fireStations,
            outFields: "Name,Address",
            layer: {
              id: "fire-stations",
              label: "Fire Stations",
              color: "#f97316",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.communityCenters,
            outFields: "FACILITY_N,ADDRESS,TYPE",
            layer: {
              id: "community-centers",
              label: "Community Centers",
              color: "#8b5cf6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.libraries,
            outFields: "BRANCH_NAME,ADDRESS",
            layer: {
              id: "libraries",
              label: "Libraries",
              color: "#6366f1",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.educationFacilities,
            outFields: "NAME,Address,Level_,TELEPHONE,TYPE",
            layer: {
              id: "education",
              label: "Schools",
              color: "#0ea5e9",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.daycareCenters,
            outFields: "Name,Address,Phone,Day_Hours,Day_Ages",
            layer: {
              id: "daycare",
              label: "Daycare Centers",
              color: "#ec4899",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.recyclingLocations,
            outFields: "LOCATION,ADDRESS,HOURS,PRODUCTS",
            layer: {
              id: "recycling",
              label: "Recycling Locations",
              color: "#10b981",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.tornadoSirens,
            outFields: "Location_A,Brand,Number_",
            layer: {
              id: "tornado-sirens",
              label: "Tornado Sirens",
              color: "#f43f5e",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.cityParks,
            outFields: "*",
            layer: {
              id: "parks",
              label: "City Parks",
              color: "#22c55e",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.garbageSchedule,
            outFields: "Day_1,Day_2",
            layer: {
              id: "garbage-schedule",
              label: "Garbage Schedule",
              color: "#78716c",
              type: "polygon",
            },
          },
          {
            url: ARCGIS_URLS.curbsideTrash,
            outFields: "TDAY",
            layer: {
              id: "curbside-trash",
              label: "Curbside Pickup",
              color: "#a8a29e",
              type: "polygon",
            },
          },
          {
            url: ARCGIS_URLS.floodHazardAreas,
            outFields: "FLD_ZONE,FLOODWAY,SFHA_TF",
            layer: {
              id: "flood-zones",
              label: "Flood Hazard Areas",
              color: "#0284c7",
              type: "polygon",
            },
          },
        ],
      };
    case "business":
      return {
        fetchers: [
          {
            url: ARCGIS_URLS.constructionPermits,
            outFields: "PermitNo,PermitDescription,PhysicalAddress,EstimatedCost,PermitStatus,Year",
            yearFilterField: "Year",
            yearQuoted: true,
            layer: {
              id: "permits",
              label: "Construction Permits",
              color: "#f59e0b",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.businessLicense,
            outFields: "custCOMPANY_NAME,custDBA,Full_Address,scNAME,pvYEAR,pvEFFDATE,pvEXPIRE",
            yearFilterField: "pvYEAR",
            layer: {
              id: "business-licenses",
              label: "Business Licenses",
              color: "#3b82f6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.entertainmentDistricts,
            layer: {
              id: "entertainment-districts",
              label: "Entertainment Districts",
              color: "#a855f7",
              type: "polygon",
            },
          },
          {
            url: ARCGIS_URLS.cityOwnedProperties,
            outFields: "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE",
            layer: {
              id: "city-properties",
              label: "City-Owned Properties",
              color: "#14b8a6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.zoning,
            outFields: "ZoningCode,ZoningDesc,Ordinance,Ord_Date",
            layer: {
              id: "zoning",
              label: "Zoning Districts",
              color: "#8b5cf6",
              type: "polygon",
            },
          },
          {
            url: ARCGIS_URLS.floodHazardAreas,
            outFields: "FLD_ZONE,FLOODWAY,SFHA_TF",
            layer: {
              id: "flood-zones",
              label: "Flood Hazard Areas",
              color: "#0284c7",
              type: "polygon",
            },
          },
        ],
      };
    case "citystaff":
      return {
        fetchers: [
          {
            url: ARCGIS_URLS.serviceRequests311,
            outFields: "Request_ID,Request_Type,Department,Address,Status,District",
            yearFilterField: "Year",
            layer: {
              id: "311-requests",
              label: "311 Requests",
              color: "#3b82f6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.pavingProject,
            outFields: "FULLNAME,DistrictDesc,Status,Year,From_,To_",
            layer: {
              id: "paving",
              label: "Paving Projects",
              color: "#f59e0b",
              type: "line",
            },
          },
          {
            url: ARCGIS_URLS.codeViolations,
            outFields: "OffenceNum,CaseType,CaseStatus,Address1,CouncilDistrict,Year",
            yearFilterField: "Year",
            yearQuoted: true,
            layer: {
              id: "code-violations",
              label: "Code Violations",
              color: "#ef4444",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.nuisance,
            outFields: "OffenseNo,Location,Remark,Type,Date,District",
            layer: {
              id: "nuisance",
              label: "Nuisance Complaints",
              color: "#d946ef",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.pavementAssessment,
            outFields: "Street_Nam,District,PCI,Priority,Surf_Type,Owner",
            layer: {
              id: "pavement",
              label: "Pavement Assessment",
              color: "#64748b",
              type: "line",
            },
          },
          {
            url: ARCGIS_URLS.policeFacilities,
            outFields: "Facility_Name,Facility_Address",
            layer: {
              id: "police",
              label: "Police Facilities",
              color: "#dc2626",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.fireStations,
            outFields: "Name,Address",
            layer: {
              id: "fire-stations",
              label: "Fire Stations",
              color: "#f97316",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.cityOwnedProperties,
            outFields: "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE",
            layer: {
              id: "city-properties",
              label: "City-Owned Properties",
              color: "#14b8a6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.tornadoSirens,
            outFields: "Location_A,Brand,Number_",
            layer: {
              id: "tornado-sirens",
              label: "Tornado Sirens",
              color: "#f43f5e",
              type: "point",
            },
          },
        ],
      };
    case "researcher":
      return {
        fetchers: [
          {
            url: ARCGIS_URLS.serviceRequests311,
            outFields: "Request_ID,Request_Type,Department,Status,District,Year",
            yearFilterField: "Year",
            layer: {
              id: "311-requests",
              label: "311 Requests",
              color: "#3b82f6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.codeViolations,
            outFields: "OffenceNum,CaseType,CaseStatus,District,Year",
            yearFilterField: "Year",
            yearQuoted: true,
            layer: {
              id: "code-violations",
              label: "Code Violations",
              color: "#ef4444",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.nuisance,
            outFields: "OffenseNo,Location,Type,Date,District",
            layer: {
              id: "nuisance",
              label: "Nuisance Complaints",
              color: "#d946ef",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.businessLicense,
            outFields: "custCOMPANY_NAME,Full_Address,scNAME,pvYEAR",
            yearFilterField: "pvYEAR",
            layer: {
              id: "business-licenses",
              label: "Business Licenses",
              color: "#3b82f6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.constructionPermits,
            outFields: "PermitDescription,PhysicalAddress,PermitStatus,EstimatedCost,Year",
            yearFilterField: "Year",
            yearQuoted: true,
            layer: {
              id: "permits",
              label: "Construction Permits",
              color: "#f59e0b",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.cityOwnedProperties,
            outFields: "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE",
            layer: {
              id: "city-properties",
              label: "City-Owned Properties",
              color: "#14b8a6",
              type: "point",
            },
          },
          {
            url: ARCGIS_URLS.neighborhoods,
            outFields: "*",
            layer: {
              id: "neighborhoods",
              label: "Neighborhoods",
              color: "#06b6d4",
              type: "polygon",
            },
          },
          {
            url: ARCGIS_URLS.censusTract,
            outFields: "GEOID20,NAME20",
            layer: {
              id: "census-tracts",
              label: "Census Tracts",
              color: "#a855f7",
              type: "polygon",
            },
          },
        ],
      };
    default:
      return null;
  }
}

export function useMapData(portal: string): UseMapDataReturn {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { yearRange } = useYearFilter();

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      const config = getPortalMapConfig(portal);
      if (!config) {
        setGeojson(EMPTY_FC);
        setLayers([]);
        setIsLoading(false);
        return;
      }

      // Set layers immediately from config (populates filter UI)
      setLayers(config.fetchers.map((f) => f.layer));
      // Start with empty features
      setGeojson(EMPTY_FC);
      setIsLoading(true);

      const promises = config.fetchers.map(async (fetcher) => {
        let where = fetcher.where ?? "1=1";
        if (fetcher.yearFilterField) {
          const yw = yearWhere(yearRange, fetcher.yearFilterField, fetcher.yearQuoted ?? false);
          where = where === "1=1" ? yw : `(${where}) AND ${yw}`;
        }

        const fc = await queryFeaturesAsGeoJSON({
          url: fetcher.url,
          outFields: fetcher.outFields,
          where,
          signal,
        });

        // Tag features with layer ID
        for (const feature of fc.features) {
          if (feature.properties) {
            feature.properties._layerId = fetcher.layer.id;
          }
        }

        // Append features incrementally
        if (!signal?.aborted) {
          setGeojson((prev) => ({
            type: "FeatureCollection",
            features: [...(prev?.features ?? []), ...fc.features],
          }));
        }
      });

      const results = await Promise.allSettled(promises);

      if (!signal?.aborted) {
        // Log any failures
        for (const r of results) {
          if (r.status === "rejected" && !(r.reason?.name === "AbortError")) {
            console.error("[use-map-data] Layer fetch failed:", r.reason);
          }
        }
        setIsLoading(false);
      }
    },
    [portal, yearRange],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort("cleanup");
  }, [fetchData]);

  return { geojson, layers, isLoading, refresh: fetchData };
}

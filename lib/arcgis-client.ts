/**
 * Client-side ArcGIS utility using @esri/arcgis-rest-feature-service.
 * Designed for browser ("use client") usage — no API keys or server-only deps.
 */

import { queryFeatures } from "@esri/arcgis-rest-feature-service";

// ---------------------------------------------------------------------------
// Public ArcGIS endpoint URLs used across the app
// ---------------------------------------------------------------------------

export const ARCGIS_URLS = {
  // HostedDatasets — rich queryable data
  serviceRequests311:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Received_311_Service_Request/FeatureServer/0",
  businessLicense:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Business_License/FeatureServer/0",
  constructionPermits:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Construction_Permits/FeatureServer/0",
  codeViolations:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Code_Violations/FeatureServer/0",
  pavingProject:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Paving_Project/FeatureServer/0",
  policeFacilities:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Police_Facilities/FeatureServer/0",
  fireStations:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Fire_Stations/FeatureServer/0",
  communityCenters:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Community_Centers/FeatureServer/0",
  libraries:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Libraries/FeatureServer/0",
  educationFacilities:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Education_Facilities/FeatureServer/0",
  daycareCenters:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Daycare_Centers/FeatureServer/0",
  nuisance:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Nuisance/FeatureServer/0",
  tornadoSirens:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/Tornado_Sirens/FeatureServer/0",
  cityOwnedProperties:
    "https://gis.montgomeryal.gov/server/rest/services/HostedDatasets/City_Owned_Properities/FeatureServer/0",
  pavementAssessment:
    "https://gis.montgomeryal.gov/server/rest/services/PublicWorks/Pavement_Assessment_2025/MapServer/0",
  // Public services
  healthCare: "https://gis.montgomeryal.gov/server/rest/services/Health_Care_Facility/MapServer/0",
  entertainmentDistricts:
    "https://gis.montgomeryal.gov/server/rest/services/OneView/Entertainment_Districts/FeatureServer/0",
  recyclingLocations:
    "https://gis.montgomeryal.gov/server/rest/services/QAlert/QAlert_311/MapServer/4",
  garbageSchedule:
    "https://gis.montgomeryal.gov/server/rest/services/QAlert/QAlert_311/MapServer/5",
  curbsideTrash: "https://gis.montgomeryal.gov/server/rest/services/QAlert/QAlert_311/MapServer/7",
  // Boundary / polygon layers
  councilDistricts:
    "https://gis.montgomeryal.gov/server/rest/services/SDE_City_Council/MapServer/0",
  neighborhoods:
    "https://gis.montgomeryal.gov/server/rest/services/NSD_Neighborhoods/FeatureServer/0",
  // Census demographics (2020 Census)
  censusTract: "https://gis.montgomeryal.gov/server/rest/services/Census_Boundaries/MapServer/0",
  censusBlockGroup:
    "https://gis.montgomeryal.gov/server/rest/services/Census_Boundaries/MapServer/1",
  censusBlock: "https://gis.montgomeryal.gov/server/rest/services/Census_Boundaries/MapServer/2",
  // Additional layers
  cityParks: "https://gis.montgomeryal.gov/server/rest/services/OneView/City_Parks/MapServer/7",
  zoning: "https://gis.montgomeryal.gov/server/rest/services/Zoning/FeatureServer/0",
  floodHazardAreas:
    "https://gis.montgomeryal.gov/server/rest/services/OneView/Flood_Hazard_Areas/FeatureServer/0",
} as const;

// ---------------------------------------------------------------------------
// Dataset name → URL mapping for AI tool use (server-side arcgis_query)
// The AI sends exact dataset names from the catalog; this resolves them to URLs.
// ---------------------------------------------------------------------------

export const DATASET_NAME_TO_URL: Record<string, string> = {
  // HostedDatasets (primary queryable data)
  Received_311_Service_Request: ARCGIS_URLS.serviceRequests311,
  Business_License: ARCGIS_URLS.businessLicense,
  Construction_Permits: ARCGIS_URLS.constructionPermits,
  Code_Violations: ARCGIS_URLS.codeViolations,
  Paving_Project: ARCGIS_URLS.pavingProject,
  Police_Facilities: ARCGIS_URLS.policeFacilities,
  Fire_Stations: ARCGIS_URLS.fireStations,
  Community_Centers: ARCGIS_URLS.communityCenters,
  Libraries: ARCGIS_URLS.libraries,
  Education_Facilities: ARCGIS_URLS.educationFacilities,
  Daycare_Centers: ARCGIS_URLS.daycareCenters,
  Nuisance: ARCGIS_URLS.nuisance,
  Tornado_Sirens: ARCGIS_URLS.tornadoSirens,
  City_Owned_Properities: ARCGIS_URLS.cityOwnedProperties,
  Pavement_Assessment: ARCGIS_URLS.pavementAssessment,
  // Public services
  Health_Care_Facility: ARCGIS_URLS.healthCare,
  Entertainment_Districts: ARCGIS_URLS.entertainmentDistricts,
  Recycling_Locations: ARCGIS_URLS.recyclingLocations,
  Garbage_Schedule: ARCGIS_URLS.garbageSchedule,
  Curbside_Trash: ARCGIS_URLS.curbsideTrash,
  // Boundary / polygon layers
  Council_Districts: ARCGIS_URLS.councilDistricts,
  Neighborhoods: ARCGIS_URLS.neighborhoods,
  Census_Tract: ARCGIS_URLS.censusTract,
  Census_Block_Group: ARCGIS_URLS.censusBlockGroup,
  Census_Block: ARCGIS_URLS.censusBlock,
  City_Parks: ARCGIS_URLS.cityParks,
  Zoning: ARCGIS_URLS.zoning,
  Flood_Hazard_Areas: ARCGIS_URLS.floodHazardAreas,
};

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttl: number = DEFAULT_TTL_MS): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function buildCacheKey(prefix: string, url: string, params: Record<string, unknown>): string {
  return `${prefix}:${url}:${JSON.stringify(params)}`;
}

// ---------------------------------------------------------------------------
// Concurrency limiter — prevents overwhelming the browser with parallel fetches
// ---------------------------------------------------------------------------

const MAX_CONCURRENT = 4;
let activeRequests = 0;
const waitQueue: (() => void)[] = [];

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeRequests--;
  const next = waitQueue.shift();
  if (next) next();
}

/** Convert an outFields string (e.g. "NAME,POP") to the SDK's expected format. */
function parseOutFields(outFields: string): "*" | string[] {
  if (outFields === "*") return "*";
  return outFields.split(",").map((f) => f.trim());
}

// ---------------------------------------------------------------------------
// queryFeaturesAsGeoJSON
// ---------------------------------------------------------------------------

/** Strip features with null/invalid geometry or NaN coordinates */
function filterValidGeometry(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
  return features.filter((f) => {
    if (!f.geometry || !f.geometry.type) return false;
    if (f.geometry.type === "Point") {
      const coords = (f.geometry as GeoJSON.Point).coordinates;
      if (!coords || coords.length < 2) return false;
      const [lng, lat] = coords;
      return isFinite(lng) && isFinite(lat) && (lng !== 0 || lat !== 0);
    }
    return true;
  });
}

/**
 * Fetch a single page from ArcGIS.
 * Montgomery's server has maxRecordCount=2000, so we page in chunks of 2000.
 */
async function fetchPage(
  url: string,
  where: string,
  outFields: string,
  returnGeometry: boolean,
  offset: number,
  count: number,
  signal?: AbortSignal,
): Promise<GeoJSON.Feature[]> {
  await acquireSlot();
  try {
    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry: String(returnGeometry),
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(count),
      f: "geojson",
    });
    const res = await fetch(`${url}/query?${params}`, { signal });
    if (!res.ok) return [];
    const raw = await res.json();
    if (raw.error || !Array.isArray(raw.features)) return [];
    return raw.features;
  } finally {
    releaseSlot();
  }
}

/**
 * Montgomery's ArcGIS maxRecordCount is 2000. By default we fetch up to
 * MAX_PAGES pages (2000 each = 10,000 features). For small datasets this
 * completes in one fetch. Pass `maxRecords` to cap for performance.
 */
const PAGE_SIZE = 2000;
const MAX_PAGES = 25; // 50,000 features max by default

export async function queryFeaturesAsGeoJSON(options: {
  url: string;
  where?: string;
  outFields?: string;
  returnGeometry?: boolean;
  /** Max features to fetch. Defaults to PAGE_SIZE * MAX_PAGES (10,000). */
  maxRecords?: number;
  signal?: AbortSignal;
}): Promise<GeoJSON.FeatureCollection> {
  const {
    url,
    where = "1=1",
    outFields = "*",
    returnGeometry = true,
    maxRecords,
    signal,
  } = options;

  const cacheKey = buildCacheKey("geojson", url, {
    where,
    outFields,
    returnGeometry,
    maxRecords,
  });
  const cached = getCached<GeoJSON.FeatureCollection>(cacheKey);
  if (cached) return cached;

  const limit = maxRecords ?? PAGE_SIZE * MAX_PAGES;

  try {
    const allFeatures: GeoJSON.Feature[] = [];
    const maxPages = Math.ceil(limit / PAGE_SIZE);

    for (let page = 0; page < maxPages; page++) {
      const offset = page * PAGE_SIZE;
      const count = Math.min(PAGE_SIZE, limit - allFeatures.length);

      const features = await fetchPage(
        url,
        where,
        outFields,
        returnGeometry,
        offset,
        count,
        signal,
      );

      allFeatures.push(...features);

      // If we got fewer than PAGE_SIZE, we've reached the end of the dataset
      if (features.length < PAGE_SIZE) break;

      // If we've hit our limit, stop
      if (allFeatures.length >= limit) break;
    }

    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: returnGeometry ? filterValidGeometry(allFeatures) : allFeatures,
    };

    setCache(cacheKey, fc);
    return fc;
  } catch (error) {
    console.error("[arcgis-client] queryFeaturesAsGeoJSON failed:", error);
    return { type: "FeatureCollection", features: [] };
  }
}

// ---------------------------------------------------------------------------
// queryFeatureCount
// ---------------------------------------------------------------------------

export async function queryFeatureCount(
  url: string,
  where: string = "1=1",
): Promise<number | null> {
  const cacheKey = buildCacheKey("count", url, { where });
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await queryFeatures({
      url,
      where,
      returnCountOnly: true,
    });

    const count = (response as unknown as { count: number }).count;
    setCache(cacheKey, count);
    return count;
  } catch (error) {
    console.error("[arcgis-client] queryFeatureCount failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// queryCountByPolygons — spatial count of features within each polygon
// ---------------------------------------------------------------------------

/**
 * Count features from `pointLayerUrl` that fall within each polygon from
 * `polygonLayerUrl`. Returns a map of groupLabel → count.
 *
 * 1. Fetches polygons from `polygonLayerUrl` (with geometry).
 * 2. For each polygon, sends a returnCountOnly query against `pointLayerUrl`
 *    using the polygon as a spatial filter.
 * 3. Returns { [labelFieldValue]: count }.
 */
export async function queryCountByPolygons(options: {
  pointLayerUrl: string;
  polygonLayerUrl: string;
  polygonLabelField: string;
  where?: string;
  signal?: AbortSignal;
}): Promise<{ group: string; value: number }[]> {
  const { pointLayerUrl, polygonLayerUrl, polygonLabelField, where = "1=1", signal } = options;

  const cacheKey = buildCacheKey("spatialcount", pointLayerUrl, {
    polygonLayerUrl,
    polygonLabelField,
    where,
  });
  const cached = getCached<{ group: string; value: number }[]>(cacheKey);
  if (cached) return cached;

  try {
    // Step 1: Fetch polygon geometries with their labels
    await acquireSlot();
    let polygons: { label: string; geometry: unknown; sr: unknown }[];
    try {
      const polyParams = new URLSearchParams({
        where: "1=1",
        outFields: polygonLabelField,
        returnGeometry: "true",
        f: "json",
      });
      const polyRes = await fetch(`${polygonLayerUrl}/query?${polyParams}`, { signal });
      if (!polyRes.ok) return [];
      const polyData = await polyRes.json();
      if (!Array.isArray(polyData.features)) return [];

      polygons = polyData.features.map(
        (f: { attributes: Record<string, unknown>; geometry: unknown }) => ({
          label: String(f.attributes[polygonLabelField] ?? "Unknown"),
          geometry: f.geometry,
          sr: polyData.spatialReference,
        }),
      );
    } finally {
      releaseSlot();
    }

    // Step 2: For each polygon, count points that intersect it (POST to handle large geometries)
    const results = await Promise.all(
      polygons.map(async (poly) => {
        await acquireSlot();
        try {
          const body = new URLSearchParams({
            where,
            geometry: JSON.stringify(poly.geometry),
            geometryType: "esriGeometryPolygon",
            spatialRel: "esriSpatialRelIntersects",
            inSR: JSON.stringify(poly.sr),
            returnCountOnly: "true",
            f: "json",
          });
          const res = await fetch(`${pointLayerUrl}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
            signal,
          });
          if (!res.ok) return { group: poly.label, value: 0 };
          const data = await res.json();
          return { group: poly.label, value: data.count ?? 0 };
        } finally {
          releaseSlot();
        }
      }),
    );

    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error("[arcgis-client] queryCountByPolygons failed:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// queryFeatureAttributes
// ---------------------------------------------------------------------------

export async function queryFeatureAttributes(options: {
  url: string;
  where?: string;
  outFields?: string;
  signal?: AbortSignal;
}): Promise<Record<string, unknown>[]> {
  const { url, where = "1=1", outFields = "*" } = options;

  const cacheKey = buildCacheKey("attrs", url, { where, outFields });
  const cached = getCached<Record<string, unknown>[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await queryFeatures({
      url,
      where,
      outFields: parseOutFields(outFields),
      returnGeometry: false,
    });

    const result = response as unknown as {
      features: { attributes: Record<string, unknown> }[];
    };
    const attributes = (result.features ?? []).map((f) => f.attributes);
    setCache(cacheKey, attributes);
    return attributes;
  } catch (error) {
    console.error("[arcgis-client] queryFeatureAttributes failed:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// queryFeatureStats — server-side GROUP BY aggregation
// ---------------------------------------------------------------------------

/**
 * Use ArcGIS outStatistics to get aggregated counts grouped by a field.
 * Far more efficient than fetching all records and counting client-side,
 * and not limited by maxRecordCount pagination.
 */
export async function queryFeatureStats(options: {
  url: string;
  where?: string;
  groupByField: string;
  statisticField: string;
  statisticType?: "count" | "sum" | "avg" | "min" | "max";
  signal?: AbortSignal;
}): Promise<{ group: string; value: number }[]> {
  const {
    url,
    where = "1=1",
    groupByField,
    statisticField,
    statisticType = "count",
    signal,
  } = options;

  const cacheKey = buildCacheKey("stats", url, {
    where,
    groupByField,
    statisticField,
    statisticType,
  });
  const cached = getCached<{ group: string; value: number }[]>(cacheKey);
  if (cached) return cached;

  try {
    const outStatistics = JSON.stringify([
      {
        statisticType,
        onStatisticField: statisticField,
        outStatisticFieldName: "stat_value",
      },
    ]);

    const params = new URLSearchParams({
      where,
      outStatistics,
      groupByFieldsForStatistics: groupByField,
      returnGeometry: "false",
      f: "json",
    });

    const res = await fetch(`${url}/query?${params}`, { signal });
    if (!res.ok) return [];

    const raw = await res.json();
    if (raw.error || !Array.isArray(raw.features)) return [];

    const results = raw.features.map((f: { attributes: Record<string, unknown> }) => ({
      group: String(f.attributes[groupByField] ?? "Unknown"),
      value: Number(f.attributes.stat_value) || 0,
    }));

    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error("[arcgis-client] queryFeatureStats failed:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// queryMultiStats — multiple aggregations grouped by the same field
// ---------------------------------------------------------------------------

/**
 * Fetch multiple aggregations in one request (e.g. count + sum grouped by Year).
 * Returns rows with the groupBy value and each stat as a named field.
 */
export async function queryMultiStats(options: {
  url: string;
  where?: string;
  groupByField: string;
  statistics: { field: string; type: "count" | "sum" | "avg" | "min" | "max"; alias: string }[];
  signal?: AbortSignal;
}): Promise<Record<string, unknown>[]> {
  const { url, where = "1=1", groupByField, statistics, signal } = options;

  const cacheKey = buildCacheKey("multistats", url, { where, groupByField, statistics });
  const cached = getCached<Record<string, unknown>[]>(cacheKey);
  if (cached) return cached;

  try {
    const outStatistics = JSON.stringify(
      statistics.map((s) => ({
        statisticType: s.type,
        onStatisticField: s.field,
        outStatisticFieldName: s.alias,
      })),
    );

    const params = new URLSearchParams({
      where,
      outStatistics,
      groupByFieldsForStatistics: groupByField,
      returnGeometry: "false",
      f: "json",
    });

    const res = await fetch(`${url}/query?${params}`, { signal });
    if (!res.ok) return [];

    const raw = await res.json();
    if (raw.error || !Array.isArray(raw.features)) return [];

    const results = raw.features.map((f: { attributes: Record<string, unknown> }) => f.attributes);
    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error("[arcgis-client] queryMultiStats failed:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// queryTotalStats — ungrouped aggregation (totals across all records)
// ---------------------------------------------------------------------------

/**
 * Sum/count/avg fields across ALL matching records without grouping.
 * Returns a single object with each alias as a key.
 */
export async function queryTotalStats(options: {
  url: string;
  where?: string;
  statistics: { field: string; type: "count" | "sum" | "avg" | "min" | "max"; alias: string }[];
  signal?: AbortSignal;
}): Promise<Record<string, number>> {
  const { url, where = "1=1", statistics, signal } = options;

  const cacheKey = buildCacheKey("totalstats", url, { where, statistics });
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;

  try {
    const outStatistics = JSON.stringify(
      statistics.map((s) => ({
        statisticType: s.type,
        onStatisticField: s.field,
        outStatisticFieldName: s.alias,
      })),
    );

    const params = new URLSearchParams({
      where,
      outStatistics,
      returnGeometry: "false",
      f: "json",
    });

    const res = await fetch(`${url}/query?${params}`, { signal });
    if (!res.ok) return {};

    const raw = await res.json();
    if (raw.error || !Array.isArray(raw.features) || raw.features.length === 0) return {};

    const attrs = raw.features[0].attributes as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const s of statistics) {
      result[s.alias] = Number(attrs[s.alias]) || 0;
    }

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("[arcgis-client] queryTotalStats failed:", error);
    return {};
  }
}

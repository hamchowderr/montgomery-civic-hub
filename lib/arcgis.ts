const ARCGIS_HUB_BASE = "https://opendata-citymgm.hub.arcgis.com/api/v3";

export interface ArcGISDataset {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export async function fetchDatasets(): Promise<ArcGISDataset[]> {
  const res = await fetch(`${ARCGIS_HUB_BASE}/datasets?page[size]=50`);
  if (!res.ok) throw new Error(`ArcGIS Hub API error: ${res.status}`);
  const data = await res.json();
  return (data.data ?? []).map((d: any) => ({
    id: d.id,
    name: d.attributes?.name ?? "Unknown",
    url: d.attributes?.url ?? "",
    description: d.attributes?.description ?? "",
  }));
}

export async function queryFeatureServer(
  featureServerUrl: string,
  options: {
    where?: string;
    outFields?: string;
    limit?: number;
  } = {},
) {
  const { where = "1=1", outFields = "*", limit = 100 } = options;
  const params = new URLSearchParams({
    where,
    outFields,
    resultRecordCount: String(limit),
    f: "json",
  });
  const res = await fetch(`${featureServerUrl}/query?${params}`);
  if (!res.ok) throw new Error(`FeatureServer query failed: ${res.status}`);
  return res.json();
}

export async function getFeatureServerSchema(featureServerUrl: string) {
  const res = await fetch(`${featureServerUrl}?f=json`);
  if (!res.ok)
    throw new Error(`FeatureServer schema fetch failed: ${res.status}`);
  return res.json();
}

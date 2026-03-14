import type { TimelineLandmark } from "./types";

/**
 * Parse a single GeoJSON feature into a TimelineLandmark.
 */
export function parseLandmarkFromGeoJSON(f: GeoJSON.Feature): TimelineLandmark {
  return {
    name: (f.properties?.name as string) ?? "",
    year: (f.properties?.year as number) ?? 0,
    event: (f.properties?.event as string) ?? "",
    era: (f.properties?.era as string) ?? "Legacy & Remembrance",
    significance: (f.properties?.significance as string) ?? "heritage",
    description: (f.properties?.description as string) ?? "",
    details: (f.properties?.details as string) ?? "",
    keyFigures: (f.properties?.keyFigures as string[]) ?? [],
    coordinates: (f.geometry as GeoJSON.Point).coordinates as [number, number],
    imageUrl: (f.properties?.imageUrl as string) ?? "",
    imageCaption: (f.properties?.imageCaption as string) ?? "",
    dateSpecific: (f.properties?.dateSpecific as string) ?? "",
    outcome: (f.properties?.outcome as string) ?? "",
    historicalContext: (f.properties?.historicalContext as string) ?? "",
    legacyToday: (f.properties?.legacyToday as string) ?? "",
    relatedEvents: (f.properties?.relatedEvents as string[]) ?? [],
  };
}

/**
 * Color-code a ratio value relative to the median of all ratios.
 * Green for high service, red for low.
 */
export function ratioColor(ratio: number, allRatios: number[]): string {
  if (ratio === 0) return "text-muted-foreground";
  const values = allRatios.filter((r) => r > 0);
  if (values.length === 0) return "text-foreground";
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (ratio >= median * 1.2) return "text-emerald-600 dark:text-emerald-400";
  if (ratio <= median * 0.8) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

/**
 * Format coordinates as a human-readable string.
 */
export function formatCoordinate(lng: number, lat: number): string {
  return `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`;
}

import type { HealthCareFacility } from "./types";

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Montgomery, AL")}`;
}

export function groupHealthCareByType(
  facilities: HealthCareFacility[],
): Record<string, HealthCareFacility[]> {
  return facilities.reduce<Record<string, HealthCareFacility[]>>((acc, fac) => {
    const type = fac.TYPE_FACIL || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(fac);
    return acc;
  }, {});
}

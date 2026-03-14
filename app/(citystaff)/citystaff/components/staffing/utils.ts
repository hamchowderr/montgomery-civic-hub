/** Extract district number from various formats: "1", "District 1", "D1", etc. */
export function normalizeDistrict(raw: string): string | null {
  const match = raw.match(/(\d+)/);
  return match ? match[1] : null;
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatMiles(n: number): string {
  return `${n.toFixed(1)} mi`;
}

export function formatTons(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K tons`;
  return `${n.toFixed(0)} tons`;
}

export function getSeverityColor(fillPercent: number) {
  if (fillPercent >= 80)
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "On Track",
    };
  if (fillPercent >= 60)
    return {
      bg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      label: "Warning",
    };
  return {
    bg: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    label: "Critical",
  };
}

export function getBarColor(value: number): string {
  if (value < 33) return "hsl(0 72% 51%)"; // red
  if (value <= 40) return "hsl(38 92% 50%)"; // amber
  return "hsl(142 71% 45%)"; // green
}

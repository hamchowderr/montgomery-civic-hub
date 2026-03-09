import type { YearRange } from "@/lib/contexts/year-filter";

// ── Shared Montgomery map constants ─────────────────────────────────────────

export const MONTGOMERY_CENTER: [number, number] = [-86.3077, 32.3792];

export const MONTGOMERY_BOUNDS: [[number, number], [number, number]] = [
  [-86.55, 32.2],
  [-85.95, 32.55],
];

// ── Shared ArcGIS helpers ───────────────────────────────────────────────────

/** Build a year WHERE clause — some ArcGIS fields use quoted strings, others integers */
export function yearWhere(
  range: YearRange,
  field: string = "Year",
  quoted: boolean = false,
): string {
  const from = quoted ? `'${range.from}'` : String(range.from);
  const to = quoted ? `'${range.to}'` : String(range.to);
  return `${field} >= ${from} AND ${field} <= ${to}`;
}

/** Format an unknown value as USD currency (no cents) */
export function formatCurrency(value: unknown): string {
  if (value == null || value === "") return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

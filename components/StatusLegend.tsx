"use client";

/**
 * Shared status color definitions and legend component for all portal maps.
 *
 * Semantic color scheme:
 *   Green  — resolved/completed
 *   Blue   — active/in-progress
 *   Amber  — needs attention
 *   Red    — denied/revoked/problem
 *   Gray   — unknown/other
 */

// ── Color constants ──────────────────────────────────────────────────────────

export const STATUS_COLORS = {
  green: "#22c55e",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  gray: "#9ca3af",
} as const;

// ── Per-portal MapLibre "match" expressions ──────────────────────────────────

/** 311 service requests — field: Status */
export const RESIDENT_STATUS_COLOR_EXPR = [
  "match",
  ["get", "Status"],
  "Closed",
  STATUS_COLORS.green,
  "In Progress",
  STATUS_COLORS.blue,
  "On Hold",
  STATUS_COLORS.amber,
  "Open",
  STATUS_COLORS.red,
  STATUS_COLORS.gray,
] as unknown as maplibregl.ExpressionSpecification;

/** Construction permits — field: PermitStatus */
export const BUSINESS_STATUS_COLOR_EXPR = [
  "match",
  ["get", "PermitStatus"],
  "COMPLETED",
  STATUS_COLORS.green,
  "ISSUED",
  STATUS_COLORS.blue,
  "APPROVED",
  STATUS_COLORS.blue,
  "REQUESTED",
  STATUS_COLORS.amber,
  "NON-COMPLIANT",
  STATUS_COLORS.amber,
  "EXPIRED",
  STATUS_COLORS.amber,
  "DENIED",
  STATUS_COLORS.red,
  "REVOKED",
  STATUS_COLORS.red,
  "VOID",
  STATUS_COLORS.red,
  STATUS_COLORS.gray,
] as unknown as maplibregl.ExpressionSpecification;

/** Code violations — field: CaseStatus */
export const CITYSTAFF_STATUS_COLOR_EXPR = [
  "match",
  ["get", "CaseStatus"],
  "CLOSED",
  STATUS_COLORS.green,
  "OPEN",
  STATUS_COLORS.red,
  STATUS_COLORS.gray,
] as unknown as maplibregl.ExpressionSpecification;

// ── Legend items per portal ──────────────────────────────────────────────────

export interface LegendItem {
  color: string;
  label: string;
}

export const RESIDENT_LEGEND: LegendItem[] = [
  { color: STATUS_COLORS.red, label: "Open" },
  { color: STATUS_COLORS.blue, label: "In Progress" },
  { color: STATUS_COLORS.amber, label: "On Hold" },
  { color: STATUS_COLORS.green, label: "Closed" },
];

export const BUSINESS_LEGEND: LegendItem[] = [
  { color: STATUS_COLORS.green, label: "Completed" },
  { color: STATUS_COLORS.blue, label: "Issued / Approved" },
  { color: STATUS_COLORS.amber, label: "Requested / Expired" },
  { color: STATUS_COLORS.red, label: "Denied / Revoked / Void" },
];

export const CITYSTAFF_LEGEND: LegendItem[] = [
  { color: STATUS_COLORS.red, label: "Open" },
  { color: STATUS_COLORS.green, label: "Closed" },
];

// ── Legend component ─────────────────────────────────────────────────────────

export function StatusLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-md border bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
        Status
      </span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

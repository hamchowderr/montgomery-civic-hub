// ── Types ────────────────────────────────────────────────────────────────────

export interface VacantProperty {
  address: string;
  owner: string;
  zoning: string;
  use: string;
  acreage: number;
  neighborhood: string;
  maintainedBy: string;
  appraised: number;
  location: string;
  notes: string;
}

// ── Zoning classification ───────────────────────────────────────────────────

export const ZONING_CATEGORIES = [
  "Residential",
  "Business",
  "Office",
  "Industrial",
  "Agricultural",
  "Transect",
  "Institutional",
  "Other",
] as const;
export type ZoningCategory = (typeof ZONING_CATEGORIES)[number];

// ── Disposition status (Use_ field) ─────────────────────────────────────────

export const DISPOSITION_STATUSES = [
  "AVAILABLE",
  "HOLDING",
  "USE",
  "LEASED",
  "DUE DILIGENCE",
] as const;
export type DispositionStatus = (typeof DISPOSITION_STATUSES)[number];

export const DISPOSITION_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  HOLDING: "Holding",
  USE: "In Use",
  LEASED: "Leased",
  "DUE DILIGENCE": "Due Diligence",
};

// ── Managed By classification (Maint_By field) ─────────────────────────────

export const MANAGED_BY_CATEGORIES = [
  "Vacant Lots",
  "Parks & Recreation",
  "Maintenance",
  "Public Safety",
  "Utilities & Infrastructure",
  "Cultural & Education",
  "Other",
] as const;
export type ManagedByCategory = (typeof MANAGED_BY_CATEGORIES)[number];

// ── Sort options ─────────────────────────────────────────────────────────────

export type SortField =
  | "acreage-desc"
  | "acreage-asc"
  | "appraised-desc"
  | "neighborhood"
  | "address";

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "acreage-desc", label: "Largest First" },
  { value: "acreage-asc", label: "Smallest First" },
  { value: "appraised-desc", label: "Highest Value" },
  { value: "neighborhood", label: "Neighborhood" },
  { value: "address", label: "Address A-Z" },
];

// ── NearbyItem ──────────────────────────────────────────────────────────────

export interface NearbyItem {
  type: "permit" | "violation";
  description: string;
  date: string;
  status: string;
}

// ── Pie chart hex colors (match zoningCategoryColor tailwind classes) ────────

export const ZONING_HEX_COLORS: Record<ZoningCategory, string> = {
  Residential: "#10b981",
  Business: "#3b82f6",
  Office: "#6366f1",
  Industrial: "#f59e0b",
  Agricultural: "#84cc16",
  Transect: "#8b5cf6",
  Institutional: "#f43f5e",
  Other: "#9ca3af",
};

// ---------------------------------------------------------------------------
// Incident Newsfeed — shared types and constants
// ---------------------------------------------------------------------------

export interface IncidentItem {
  id: string;
  type: string;
  address: string;
  status: "Open" | "In Progress" | "Closed";
  date: Date;
  closeDate: Date | null;
  department: string;
  district: string;
  origin: string;
  year: number;
}

export interface FilterState {
  departments: string[];
  status: "All" | "Open" | "In Progress" | "Closed";
  district: string;
  origin: string;
  requestType: string;
}

export interface StatsSummary {
  total: number;
  open: number;
  closed: number;
  inProgress: number;
}

export interface TypeBreakdown {
  name: string;
  value: number;
}

export interface YearTrend {
  year: number;
  count: number;
}

export const STATUS_OPTIONS = ["All", "Open", "In Progress", "Closed"] as const;
export const DISTRICTS = ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export const CHART_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
];

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export const PAGE_SIZE = 25;

import { Baby, BookOpen, Building2, GraduationCap, Recycle } from "lucide-react";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PoliceFacility {
  Facility_Name: string;
  Facility_Address: string;
}

export interface FireStation {
  Id: number;
  Name: string;
  Address: string;
}

export interface HealthCareFacility {
  COMPANY_NA: string;
  ADDRESS: string;
  PHONE: string;
  TYPE_FACIL: string;
  EMPLOY: number;
  BEDS_UNITS: number;
}

export interface DistrictStat {
  group: string;
  value: number;
}

export interface ResourceCounts {
  communityCenters: number | null;
  libraries: number | null;
  daycareCenters: number | null;
  educationFacilities: number | null;
  recyclingLocations: number | null;
}

export interface EmergencyNumber {
  label: string;
  number: string;
  highlight?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { label: "Emergency", number: "911", highlight: true },
  { label: "MPD Non-Emergency", number: "334-625-2651" },
  { label: "Fire Non-Emergency", number: "334-241-2600" },
  { label: "City Main Line", number: "334-625-2000" },
];

export const RESOURCE_CARDS = [
  {
    key: "communityCenters" as const,
    label: "Community Centers",
    icon: Building2,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "libraries" as const,
    label: "Libraries",
    icon: BookOpen,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "daycareCenters" as const,
    label: "Daycare Centers",
    icon: Baby,
    bg: "bg-pink-50 dark:bg-pink-950/40",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    key: "educationFacilities" as const,
    label: "Schools",
    icon: GraduationCap,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "recyclingLocations" as const,
    label: "Recycling Sites",
    icon: Recycle,
    bg: "bg-teal-50 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

export const STATUS_COLORS: Record<string, string> = {
  Open: "hsl(0 84% 60%)",
  "In Progress": "hsl(38 92% 50%)",
  Closed: "hsl(142 71% 45%)",
};

export const DEFAULT_STATUS_COLOR = "hsl(215 20% 65%)";

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
];

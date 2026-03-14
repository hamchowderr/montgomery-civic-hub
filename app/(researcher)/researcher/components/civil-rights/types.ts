// ---------------------------------------------------------------------------
// Types & Constants for Civil Rights Timeline
// ---------------------------------------------------------------------------

export interface TimelineLandmark {
  name: string;
  year: number;
  event: string;
  era: string;
  significance: string;
  description: string;
  details: string;
  keyFigures: string[];
  coordinates: [number, number];
  imageUrl: string;
  imageCaption: string;
  dateSpecific: string;
  outcome: string;
  historicalContext: string;
  legacyToday: string;
  relatedEvents: string[];
}

export interface CivilRightsTimelineProps {
  onSelectLandmark?: (landmark: TimelineLandmark) => void;
}

export interface EraStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  /** Hex color for inline gradient accents */
  hex: string;
}

export const ERA_COLORS: Record<string, EraStyle> = {
  "Before the Movement": {
    bg: "bg-stone-500/10",
    text: "text-stone-700 dark:text-stone-300",
    border: "border-stone-400/30",
    dot: "bg-stone-500",
    hex: "#78716c",
  },
  "Bus Boycott Era": {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-400/30",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  "Freedom Rides": {
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-400/30",
    dot: "bg-red-500",
    hex: "#ef4444",
  },
  "Voting Rights": {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-400/30",
    dot: "bg-blue-500",
    hex: "#3b82f6",
  },
  "Legacy & Remembrance": {
    bg: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-400/30",
    dot: "bg-violet-500",
    hex: "#8b5cf6",
  },
};

export const GOLD = "#D4AF37";

export interface DemoSlice {
  name: string;
  value: number;
}

export const DEMO_COLORS = [
  "#6366f1", // White — indigo
  "#3b82f6", // Black — blue
  "#8b5cf6", // American Indian — violet
  "#06b6d4", // Asian — cyan
  "#14b8a6", // Pacific Islander — teal
  "#22c55e", // Other — green
  "#a855f7", // Two or More — purple
];

export interface DistrictRow {
  district: number;
  requests311: number;
  violations: number;
  ratio: number;
}

export interface CityMetric {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}

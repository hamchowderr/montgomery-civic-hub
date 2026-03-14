// ── Interfaces ───────────────────────────────────────────────────────────────

export interface DemandData {
  district: string;
  requests311: number;
  codeViolations: number;
}

export interface RequestTypeData {
  type: string;
  count: number;
}

export interface ViolationTypeData {
  type: string;
  count: number;
}

export interface PavingDistrictData {
  district: string;
  count: number;
}

export interface PavingStatusData {
  status: string;
  count: number;
}

export interface PavingTotals {
  totalMiles: number;
  totalCost: number;
  totalTons: number;
  totalProjects: number;
}

export interface ActionItem {
  id: number;
  title: string;
  priority: "High" | "Medium";
}

export interface DistrictCoverageEntry {
  district: string;
  current: number;
  target: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const COLORS = {
  blue: "hsl(221 83% 53%)",
  orange: "hsl(24 95% 53%)",
  green: "hsl(142 71% 45%)",
} as const;

export const PIE_COLORS = [
  "hsl(221 83% 53%)",
  "hsl(24 95% 53%)",
  "hsl(142 71% 45%)",
  "hsl(262 83% 58%)",
  "hsl(346 77% 50%)",
  "hsl(47 96% 53%)",
  "hsl(190 90% 50%)",
  "hsl(330 65% 60%)",
];

// Bright Data confirmed: budgeted strength 490 (FOP report May 2024), dropped
// to 290. 15% pay raise approved. 324 is a reasonable post-raise estimate.
export const STAFFING = {
  mpd: {
    authorized: 490,
    current: 324,
    vacancy: 166,
    vacancyRate: 34,
  },
  dispatch: {
    authorized: 150,
    filled: 86,
    vacancy: 64,
    vacancyRate: 43,
  },
};

export const TARGET_PER_DISTRICT = 44;

export const DISTRICT_COVERAGE: DistrictCoverageEntry[] = [
  { district: "D1", current: 38 },
  { district: "D2", current: 34 },
  { district: "D3", current: 41 },
  { district: "D4", current: 36 },
  { district: "D5", current: 33 },
  { district: "D6", current: 29 },
  { district: "D7", current: 35 },
  { district: "D8", current: 31 },
  { district: "D9", current: 27 },
].map((d) => ({ ...d, target: TARGET_PER_DISTRICT }));

export const ACTION_ITEMS: ActionItem[] = [
  {
    id: 1,
    title: "Post openings on Indeed and LinkedIn with signing bonus details",
    priority: "High",
  },
  {
    id: 2,
    title: "Partner with Troy University criminal justice program",
    priority: "High",
  },
  {
    id: 3,
    title: "Schedule next Citizen Police Academy cohort for Q2",
    priority: "Medium",
  },
  {
    id: 4,
    title: "Review lateral transfer incentive packages against Birmingham and Huntsville rates",
    priority: "Medium",
  },
  {
    id: 5,
    title: "Automate background check status notifications to reduce dropout rate",
    priority: "Medium",
  },
];

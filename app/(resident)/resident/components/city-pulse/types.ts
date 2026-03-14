import type {
  Building2,
  CalendarDays,
  Construction,
  Newspaper,
  ShieldAlert,
  Vote,
} from "lucide-react";
import type { NewsResult } from "@/app/actions/resident-news";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

export interface CategoryConfig {
  id: string;
  label: string;
  icon:
    | typeof Newspaper
    | typeof Vote
    | typeof ShieldAlert
    | typeof CalendarDays
    | typeof Construction
    | typeof Building2;
  color: string;
  fetcher: () => Promise<NewsResult[]>;
}

// ---------------------------------------------------------------------------
// Stats & summaries
// ---------------------------------------------------------------------------

export interface PulseStats {
  totalArticles: number;
  totalServiceRequests: number;
  safetyAlerts: number;
  communityEvents: number;
}

export interface ServiceRequestSummaryData {
  district: string;
  count: number;
}

export interface CommunityHighlight {
  category: string;
  title: string;
  snippet: string;
  url: string;
}

export interface SourceDistribution {
  source: string;
  count: number;
}

export interface CategoryDistributionData {
  category: string;
  count: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CHART_COLORS = {
  blue: "hsl(221 83% 53%)",
  purple: "hsl(262 83% 58%)",
  red: "hsl(346 77% 50%)",
  emerald: "hsl(142 71% 45%)",
  amber: "hsl(47 96% 53%)",
  cyan: "hsl(190 90% 50%)",
  pink: "hsl(330 65% 60%)",
  orange: "hsl(24 95% 53%)",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  news: CHART_COLORS.blue,
  government: CHART_COLORS.purple,
  safety: CHART_COLORS.red,
  events: CHART_COLORS.emerald,
  infrastructure: CHART_COLORS.amber,
};

export const CATEGORY_TEXT_COLORS: Record<string, string> = {
  news: "text-blue-600 dark:text-blue-400",
  government: "text-purple-600 dark:text-purple-400",
  safety: "text-red-600 dark:text-red-400",
  events: "text-emerald-600 dark:text-emerald-400",
  infrastructure: "text-amber-600 dark:text-amber-400",
};

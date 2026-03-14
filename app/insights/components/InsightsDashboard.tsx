"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Info,
  RefreshCw,
  Scale,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChartData } from "@/lib/hooks/use-chart-data";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface DistrictData {
  district: string;
  requests: number;
  violations: number;
  permits: number;
  licenses: number;
  nuisance: number;
  paving: number;
}

interface TrendData {
  year: string;
  requests: number;
  violations: number;
  permits: number;
  licenses: number;
}

type InsightTab = "overview" | "equity" | "trends" | "districts" | "stories";

const METRICS = ["requests", "violations", "permits", "licenses", "nuisance", "paving"] as const;
const TREND_METRICS = ["requests", "violations", "permits", "licenses"] as const;

const METRIC_LABELS: Record<string, string> = {
  requests: "311 Requests",
  violations: "Violations",
  permits: "Permits",
  licenses: "Licenses",
  nuisance: "Nuisance",
  paving: "Paving",
};

const METRIC_COLORS: Record<string, string> = {
  requests: "#3b82f6",
  violations: "#ef4444",
  permits: "#10b981",
  licenses: "#f59e0b",
  nuisance: "#8b5cf6",
  paving: "#06b6d4",
};

const DISTRICT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

const DISTRICTS = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];

const STORY_FOCUSES = [
  { value: "overview", label: "Full city overview" },
  { value: "equity", label: "Equity analysis" },
  { value: "district", label: "District spotlight" },
  { value: "trends", label: "Trend analysis" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeToScale(data: DistrictData[]): Record<string, Record<string, number>> {
  const maxes: Record<string, number> = {};
  for (const m of METRICS) {
    maxes[m] = Math.max(...data.map((d) => d[m]), 1);
  }
  const result: Record<string, Record<string, number>> = {};
  for (const d of data) {
    result[d.district] = {};
    for (const m of METRICS) {
      result[d.district][m] = Math.round((d[m] / maxes[m]) * 100);
    }
  }
  return result;
}

function getHeatColor(value: number, max: number): string {
  if (max === 0) return "bg-muted";
  const ratio = value / max;
  if (ratio < 0.25) return "bg-green-500/20 text-green-700 dark:text-green-400";
  if (ratio < 0.5) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  if (ratio < 0.75) return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
  return "bg-red-500/20 text-red-700 dark:text-red-400";
}

function generateInsights(data: DistrictData[]) {
  if (!data.length) return [];

  const insights: {
    icon: typeof AlertTriangle;
    title: string;
    description: string;
    variant: "warning" | "info" | "success";
  }[] = [];

  const byRequests = [...data].sort((a, b) => b.requests - a.requests);
  const highest = byRequests[0];
  const lowest = byRequests[byRequests.length - 1];

  if (highest && lowest) {
    const ratio = highest.paving > 0 ? (highest.requests / highest.paving).toFixed(0) : "N/A";
    insights.push({
      icon: AlertTriangle,
      title: `${highest.district} has highest service demand`,
      description: `${highest.requests.toLocaleString()} requests with ${highest.paving} paving projects (${ratio}:1 demand-to-investment ratio)`,
      variant: "warning",
    });
  }

  const byBusiness = [...data].sort((a, b) => b.permits + b.licenses - (a.permits + a.licenses));
  const bizLeader = byBusiness[0];
  if (bizLeader) {
    insights.push({
      icon: TrendingUp,
      title: `${bizLeader.district} leads in business activity`,
      description: `${bizLeader.permits.toLocaleString()} permits and ${bizLeader.licenses.toLocaleString()} new licenses`,
      variant: "success",
    });
  }

  for (const d of data) {
    if (!d.district.startsWith("D")) continue;
    const totalDemand = d.requests + d.violations + d.nuisance;
    const totalInvestment = d.permits + d.paving;
    const avgDemand =
      data.reduce((s, x) => s + x.requests + x.violations + x.nuisance, 0) / data.length;
    const avgInvestment = data.reduce((s, x) => s + x.permits + x.paving, 0) / data.length;

    if (totalDemand > avgDemand * 1.3 && totalInvestment < avgInvestment * 0.7) {
      insights.push({
        icon: Info,
        title: `Equity flag: ${d.district}`,
        description: `High service demand (${totalDemand.toLocaleString()}) but below-average investment (${totalInvestment.toLocaleString()}) — potential underserved area`,
        variant: "warning",
      });
      break;
    }
  }

  return insights.slice(0, 4);
}

/** Check if a cell value is >2 standard deviations from the column mean */
function isAnomaly(value: number, allValues: number[]): boolean {
  if (allValues.length < 2) return false;
  const mean = allValues.reduce((s, v) => s + v, 0) / allValues.length;
  const variance = allValues.reduce((s, v) => s + (v - mean) ** 2, 0) / allValues.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return false;
  return Math.abs(value - mean) > 2 * stdDev;
}

function computeEquityScores(data: DistrictData[]) {
  // Compute z-scores for demand and investment
  const demandValues = data.map((d) => d.requests + d.violations + d.nuisance);
  const investValues = data.map((d) => d.permits + d.paving);

  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const std = (arr: number[]) => {
    const m = mean(arr);
    const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  };

  const demandMean = mean(demandValues);
  const demandStd = std(demandValues) || 1;
  const investMean = mean(investValues);
  const investStd = std(investValues) || 1;

  return data
    .map((d, i) => {
      const demandZ = (demandValues[i] - demandMean) / demandStd;
      const investZ = (investValues[i] - investMean) / investStd;
      const equityScore = investZ - demandZ;
      return {
        district: d.district,
        demand: demandValues[i],
        investment: investValues[i],
        demandZ: Math.round(demandZ * 100) / 100,
        investZ: Math.round(investZ * 100) / 100,
        equityScore: Math.round(equityScore * 100) / 100,
      };
    })
    .sort((a, b) => b.equityScore - a.equityScore);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InsightsDashboardProps {
  activeTab: InsightTab;
  onTabChange: (tab: InsightTab) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  selectedMetrics: Set<string>;
  onToggleMetric: (metric: string, visible: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsightsDashboard({
  activeTab,
  onTabChange,
  selectedDistrict,
  onSelectDistrict,
  selectedMetrics,
  onToggleMetric,
}: InsightsDashboardProps) {
  const {
    data: crossData,
    isLoading: crossLoading,
    error: crossError,
  } = useChartData("crossDistrictInsights");
  const { data: trendData, isLoading: trendLoading } = useChartData("multiMetricTrends");

  // Stories tab state
  const [story, setStory] = useState<string | null>(null);
  const [storyFocus, setStoryFocus] = useState<string>("overview");
  const [storyGeneratedAt, setStoryGeneratedAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const districtData = (crossData ?? []) as DistrictData[];
  const validDistricts = useMemo(
    () =>
      districtData
        .filter((d) => d.district.startsWith("D"))
        .sort((a, b) => a.district.localeCompare(b.district)),
    [districtData],
  );

  const normalized = useMemo(() => normalizeToScale(validDistricts), [validDistricts]);
  const insights = useMemo(() => generateInsights(validDistricts), [validDistricts]);

  const radarData = useMemo(() => {
    return METRICS.map((m) => {
      const point: Record<string, string | number> = { metric: METRIC_LABELS[m] };
      for (const d of validDistricts) {
        point[d.district] = normalized[d.district]?.[m] ?? 0;
      }
      return point;
    });
  }, [validDistricts, normalized]);

  const maxes = useMemo(() => {
    const m: Record<string, number> = {};
    for (const metric of METRICS) {
      m[metric] = Math.max(...validDistricts.map((d) => d[metric]), 1);
    }
    return m;
  }, [validDistricts]);

  // Column values for anomaly detection
  const columnValues = useMemo(() => {
    const cols: Record<string, number[]> = {};
    for (const metric of METRICS) {
      cols[metric] = validDistricts.map((d) => d[metric]);
    }
    return cols;
  }, [validDistricts]);

  // Equity scores
  const equityScores = useMemo(() => computeEquityScores(validDistricts), [validDistricts]);

  // Equity bar chart data (demand vs investment, normalized)
  const equityBarData = useMemo(() => {
    if (!validDistricts.length) return [];
    const demandValues = validDistricts.map((d) => d.requests + d.violations + d.nuisance);
    const investValues = validDistricts.map((d) => d.permits + d.paving);
    const maxDemand = Math.max(...demandValues, 1);
    const maxInvest = Math.max(...investValues, 1);

    return validDistricts.map((d, i) => ({
      district: d.district,
      demand: Math.round((demandValues[i] / maxDemand) * 100),
      investment: Math.round((investValues[i] / maxInvest) * 100),
    }));
  }, [validDistricts]);

  // Trends data
  const trendRows = (trendData ?? []) as TrendData[];

  // District detail
  const currentDistrict = useMemo(
    () => validDistricts.find((d) => d.district === selectedDistrict),
    [validDistricts, selectedDistrict],
  );

  // District rankings per metric
  const districtRankings = useMemo(() => {
    const rankings: Record<string, { rank: number; value: number; avg: number }> = {};
    for (const metric of METRICS) {
      const sorted = [...validDistricts].sort((a, b) => b[metric] - a[metric]);
      const rank = sorted.findIndex((d) => d.district === selectedDistrict) + 1;
      const avg = validDistricts.reduce((s, d) => s + d[metric], 0) / (validDistricts.length || 1);
      const value = currentDistrict?.[metric] ?? 0;
      rankings[metric] = { rank, value, avg };
    }
    return rankings;
  }, [validDistricts, selectedDistrict, currentDistrict]);

  const handleGenerateStory = useCallback(() => {
    setIsGenerating(true);
    // Build a summary from the data
    const focusLabel = STORY_FOCUSES.find((f) => f.value === storyFocus)?.label ?? storyFocus;
    let narrative = `# Data Story: ${focusLabel}\n\n`;
    narrative += `*Generated at ${new Date().toLocaleTimeString()}*\n\n`;

    if (storyFocus === "overview" || storyFocus === "equity") {
      narrative += `## City-Wide Overview\n\n`;
      const totalRequests = validDistricts.reduce((s, d) => s + d.requests, 0);
      const totalViolations = validDistricts.reduce((s, d) => s + d.violations, 0);
      const totalPermits = validDistricts.reduce((s, d) => s + d.permits, 0);
      narrative += `Montgomery's 9 council districts logged **${totalRequests.toLocaleString()}** service requests, **${totalViolations.toLocaleString()}** code violations, and **${totalPermits.toLocaleString()}** construction permits in the selected period.\n\n`;
    }

    if (storyFocus === "equity") {
      narrative += `## Equity Analysis\n\n`;
      const topEquity = equityScores[0];
      const bottomEquity = equityScores[equityScores.length - 1];
      if (topEquity && bottomEquity) {
        narrative += `**Most equitably served:** ${topEquity.district} (score: ${topEquity.equityScore})\n`;
        narrative += `**Least equitably served:** ${bottomEquity.district} (score: ${bottomEquity.equityScore})\n\n`;
        narrative += `The equity score measures the gap between investment (permits + paving) and demand (requests + violations + nuisance). Positive scores indicate investment exceeds demand relative to other districts.\n\n`;
      }
    }

    if (storyFocus === "district") {
      narrative += `## District Spotlight: ${selectedDistrict}\n\n`;
      if (currentDistrict) {
        for (const metric of METRICS) {
          const r = districtRankings[metric];
          const pctDiff = r.avg > 0 ? Math.round(((r.value - r.avg) / r.avg) * 100) : 0;
          const direction = pctDiff >= 0 ? "above" : "below";
          narrative += `- **${METRIC_LABELS[metric]}:** ${r.value.toLocaleString()} (rank ${r.rank}/9, ${Math.abs(pctDiff)}% ${direction} average)\n`;
        }
        narrative += "\n";
      }
    }

    if (storyFocus === "trends") {
      narrative += `## Trend Analysis\n\n`;
      if (trendRows.length >= 2) {
        const first = trendRows[0];
        const last = trendRows[trendRows.length - 1];
        narrative += `From ${first.year} to ${last.year}:\n`;
        for (const metric of TREND_METRICS) {
          const change = last[metric] - first[metric];
          const pctChange = first[metric] > 0 ? Math.round((change / first[metric]) * 100) : 0;
          narrative += `- **${METRIC_LABELS[metric]}:** ${change >= 0 ? "+" : ""}${change.toLocaleString()} (${pctChange >= 0 ? "+" : ""}${pctChange}%)\n`;
        }
        narrative += "\n";
      }
    }

    narrative += `---\n*Use the AI chat to ask follow-up questions or request deeper analysis on any of these findings.*`;

    setStory(narrative);
    setStoryGeneratedAt(new Date().toLocaleTimeString());
    setIsGenerating(false);
  }, [
    storyFocus,
    validDistricts,
    equityScores,
    selectedDistrict,
    currentDistrict,
    districtRankings,
    trendRows,
  ]);

  // Loading state
  if (crossLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Scale className="size-8 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading cross-district data from 6 datasets...
          </p>
        </div>
      </div>
    );
  }

  if (crossError || !validDistricts.length) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          {crossError ?? "No district data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as InsightTab)}
        className="flex h-full flex-col"
      >
        <div className="shrink-0 border-b px-4 pt-3">
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="equity" className="text-xs">
              Equity
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              Trends
            </TabsTrigger>
            <TabsTrigger value="districts" className="text-xs">
              Districts
            </TabsTrigger>
            <TabsTrigger value="stories" className="text-xs">
              Stories
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =============== TAB 1: OVERVIEW =============== */}
        <TabsContent value="overview" className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">District Activity Radar</CardTitle>
                <p className="text-xs text-muted-foreground">
                  6 metrics normalized to 0-100 scale across 9 council districts
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    {validDistricts.map((d, i) => (
                      <Radar
                        key={d.district}
                        name={d.district}
                        dataKey={d.district}
                        stroke={DISTRICT_COLORS[i % DISTRICT_COLORS.length]}
                        fill={DISTRICT_COLORS[i % DISTRICT_COLORS.length]}
                        fillOpacity={0.08}
                        strokeWidth={1.5}
                      />
                    ))}
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {validDistricts.map((d, i) => (
                    <div key={d.district} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: DISTRICT_COLORS[i % DISTRICT_COLORS.length] }}
                      />
                      {d.district}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Heat Matrix */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">District Comparison Matrix</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Raw values · Color intensity shows relative magnitude · Dots mark statistical
                  outliers (&gt;2 SD)
                </p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-3 text-left font-medium">District</th>
                      {METRICS.map((m) => (
                        <th key={m} className="px-2 py-2 text-right font-medium">
                          {METRIC_LABELS[m]}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validDistricts.map((d) => {
                      const total = METRICS.reduce((s, m) => s + d[m], 0);
                      return (
                        <tr key={d.district} className="border-b border-border/50">
                          <td className="py-1.5 pr-3 font-medium">{d.district}</td>
                          {METRICS.map((m) => {
                            const anomaly = isAnomaly(d[m], columnValues[m]);
                            return (
                              <td key={m} className="px-1 py-1.5 text-right">
                                <span
                                  className={`relative inline-block min-w-[3rem] rounded px-1.5 py-0.5 text-center tabular-nums ${getHeatColor(d[m], maxes[m])}`}
                                >
                                  {d[m].toLocaleString()}
                                  {anomaly && (
                                    <span
                                      className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-red-500"
                                      title="Statistical outlier (>2 SD from mean)"
                                    />
                                  )}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5 text-right font-medium tabular-nums">
                            {total.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Auto-Generated Insight Cards */}
            {insights.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {insights.map((insight, i) => (
                  <Card
                    key={i}
                    className={
                      insight.variant === "warning"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : insight.variant === "success"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-blue-500/30 bg-blue-500/5"
                    }
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <insight.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                      <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Source: Montgomery ArcGIS · 6 datasets cross-referenced (311 requests, code
              violations, construction permits, business licenses, nuisance complaints, paving
              projects)
            </p>
          </div>
        </TabsContent>

        {/* =============== TAB 2: EQUITY =============== */}
        <TabsContent value="equity" className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Equity Scorecard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Equity Scorecard</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Investment z-score minus demand z-score · Higher = more equitably served
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {equityScores.map((item, i) => {
                    const color =
                      item.equityScore > 0.5
                        ? "text-green-600 dark:text-green-400"
                        : item.equityScore < -0.5
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400";
                    const bgColor =
                      item.equityScore > 0.5
                        ? "bg-green-500"
                        : item.equityScore < -0.5
                          ? "bg-red-500"
                          : "bg-yellow-500";
                    // Normalize to a bar width (score range roughly -3 to 3, map to 0-100)
                    const barWidth = Math.max(5, Math.min(100, (item.equityScore + 3) * (100 / 6)));

                    return (
                      <div key={item.district} className="flex items-center gap-3">
                        <span className="w-8 shrink-0 text-xs font-medium">{item.district}</span>
                        <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                          {i + 1}.
                        </span>
                        <div className="relative h-5 flex-1 rounded bg-muted/50">
                          <div
                            className={`h-full rounded ${bgColor}/30`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span
                          className={`w-14 shrink-0 text-right text-xs font-semibold tabular-nums ${color}`}
                        >
                          {item.equityScore > 0 ? "+" : ""}
                          {item.equityScore.toFixed(2)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`w-20 justify-center text-[10px] ${color}`}
                        >
                          {item.equityScore > 0.5
                            ? "Well-served"
                            : item.equityScore < -0.5
                              ? "Underserved"
                              : "Moderate"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Demand vs Investment Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Demand vs Investment</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Normalized comparison: demand (requests + violations + nuisance) vs investment
                  (permits + paving)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={equityBarData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="demand" fill="#ef4444" fillOpacity={0.7} name="Demand" />
                    <Bar dataKey="investment" fill="#10b981" fillOpacity={0.7} name="Investment" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <p className="text-[10px] text-muted-foreground">
              Equity score = (investment z-score) - (demand z-score). Demand includes 311 requests,
              code violations, and nuisance complaints. Investment includes construction permits and
              paving projects.
            </p>
          </div>
        </TabsContent>

        {/* =============== TAB 3: TRENDS =============== */}
        <TabsContent value="trends" className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Metric Selector */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Metric Selector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {TREND_METRICS.map((metric) => (
                    <label key={metric} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedMetrics.has(metric)}
                        onCheckedChange={(checked) => onToggleMetric(metric, !!checked)}
                      />
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: METRIC_COLORS[metric] }}
                      />
                      {METRIC_LABELS[metric]}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Multi-Metric Line Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Multi-Metric Trends</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Year-over-year trends across selected metrics
                </p>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading trend data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={trendRows}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {TREND_METRICS.filter((m) => selectedMetrics.has(m)).map((metric) => (
                        <Line
                          key={metric}
                          type="monotone"
                          dataKey={metric}
                          stroke={METRIC_COLORS[metric]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name={METRIC_LABELS[metric]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <p className="text-[10px] text-muted-foreground">
              Source: Montgomery ArcGIS · Yearly aggregations from 311 requests, code violations,
              construction permits, and business licenses
            </p>
          </div>
        </TabsContent>

        {/* =============== TAB 4: DISTRICTS =============== */}
        <TabsContent value="districts" className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* District Selector */}
            <div className="flex flex-wrap gap-1.5">
              {DISTRICTS.map((d) => (
                <Button
                  key={d}
                  variant={selectedDistrict === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectDistrict(d)}
                  className="text-xs"
                >
                  {d}
                </Button>
              ))}
            </div>

            {currentDistrict ? (
              <>
                {/* District Profile Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {selectedDistrict} Profile
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      All 6 metrics for council district {selectedDistrict}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {METRICS.map((metric) => {
                        const value = currentDistrict[metric];
                        return (
                          <div key={metric} className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {METRIC_LABELS[metric]}
                            </p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">
                              {value.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Rankings & Comparison */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {selectedDistrict} Rankings & City Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {METRICS.map((metric) => {
                        const r = districtRankings[metric];
                        const pctDiff =
                          r.avg > 0 ? Math.round(((r.value - r.avg) / r.avg) * 100) : 0;
                        const isAbove = pctDiff >= 0;

                        // Ordinal suffix
                        const ordinal = (n: number) => {
                          const s = ["th", "st", "nd", "rd"];
                          const v = n % 100;
                          return n + (s[(v - 20) % 10] || s[v] || s[0]);
                        };

                        return (
                          <div key={metric} className="flex items-center gap-3">
                            <span className="w-24 shrink-0 text-xs font-medium">
                              {METRIC_LABELS[metric]}
                            </span>

                            {/* Rank indicator */}
                            <div className="flex w-20 shrink-0 items-center gap-1.5">
                              <div className="relative h-2 w-full rounded-full bg-muted">
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full bg-primary/60"
                                  style={{
                                    width: `${((10 - r.rank) / 9) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {ordinal(r.rank)}
                              </span>
                            </div>

                            {/* vs average */}
                            <span
                              className={`ml-auto text-xs font-medium tabular-nums ${
                                isAbove
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {isAbove ? "+" : ""}
                              {pctDiff}% vs avg
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">
                    Select a district above to view its profile
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* =============== TAB 5: STORIES =============== */}
        <TabsContent value="stories" className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Generate Data Story</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Create a narrative summary from the current data
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={storyFocus} onValueChange={setStoryFocus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Choose a focus..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STORY_FOCUSES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {storyFocus === "district" && (
                    <Select value={selectedDistrict} onValueChange={onSelectDistrict}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button onClick={handleGenerateStory} disabled={isGenerating} size="sm">
                    <BarChart3 size={14} className="mr-1.5" />
                    {isGenerating ? "Generating..." : "Generate Story"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {story && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Data Narrative</CardTitle>
                    <div className="flex items-center gap-2">
                      {storyGeneratedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          Generated at {storyGeneratedAt}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={handleGenerateStory}
                      >
                        <RefreshCw size={12} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                    {story.split("\n").map((line, i) => {
                      if (line.startsWith("# ")) {
                        return (
                          <h2 key={i} className="mb-2 mt-4 text-base font-semibold first:mt-0">
                            {line.slice(2)}
                          </h2>
                        );
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h3 key={i} className="mb-1.5 mt-3 text-sm font-semibold">
                            {line.slice(3)}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ")) {
                        const content = line.slice(2);
                        return (
                          <p
                            key={i}
                            className="my-0.5 pl-4 text-xs before:absolute before:-ml-3 before:content-['•']"
                          >
                            {content
                              .split("**")
                              .map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j}>{part}</strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                ),
                              )}
                          </p>
                        );
                      }
                      if (line.startsWith("*") && line.endsWith("*")) {
                        return (
                          <p key={i} className="text-xs italic text-muted-foreground">
                            {line.slice(1, -1)}
                          </p>
                        );
                      }
                      if (line.startsWith("---")) {
                        return <hr key={i} className="my-3" />;
                      }
                      if (!line.trim()) return <br key={i} />;
                      return (
                        <p key={i} className="my-1 text-xs">
                          {line
                            .split("**")
                            .map((part, j) =>
                              j % 2 === 1 ? (
                                <strong key={j}>{part}</strong>
                              ) : (
                                <span key={j}>{part}</span>
                              ),
                            )}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {!story && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-8">
                  <BookOpen size={24} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Choose a focus area and click &quot;Generate Story&quot; to create a data
                    narrative
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can also ask the AI chat to generate deeper analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

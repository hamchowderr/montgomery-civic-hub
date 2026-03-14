"use client";

import { AlertTriangle, ArrowUpRight, Info, Scale, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartData } from "@/lib/hooks/use-chart-data";

interface DistrictData {
  district: string;
  requests: number;
  violations: number;
  permits: number;
  licenses: number;
  nuisance: number;
  paving: number;
}

const METRICS = ["requests", "violations", "permits", "licenses", "nuisance", "paving"] as const;
const METRIC_LABELS: Record<string, string> = {
  requests: "311 Requests",
  violations: "Violations",
  permits: "Permits",
  licenses: "Licenses",
  nuisance: "Nuisance",
  paving: "Paving",
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

  // Highest service demand
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

  // Business activity leader
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

  // Equity flag — high demand + low investment
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

export function CrossDistrictInsights() {
  const { data, isLoading, error } = useChartData("crossDistrictInsights");

  const districtData = (data ?? []) as DistrictData[];
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

  if (isLoading) {
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

  if (error || !validDistricts.length) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{error ?? "No district data available"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-auto p-4">
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
          <div className="mt-2 flex flex-wrap gap-3 justify-center">
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
            Raw values · Color intensity shows relative magnitude
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
                    {METRICS.map((m) => (
                      <td key={m} className="px-1 py-1.5 text-right">
                        <span
                          className={`inline-block min-w-[3rem] rounded px-1.5 py-0.5 text-center tabular-nums ${getHeatColor(d[m], maxes[m])}`}
                        >
                          {d[m].toLocaleString()}
                        </span>
                      </td>
                    ))}
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
                  <p className="mt-0.5 text-xs text-muted-foreground">{insight.description}</p>
                </div>
                <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Source: Montgomery ArcGIS · 6 datasets cross-referenced (311 requests, code violations,
        construction permits, business licenses, nuisance complaints, paving projects)
      </p>
    </div>
  );
}

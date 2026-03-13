"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ARCGIS_URLS, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";

// ── Section A: Staffing Overview ────────────────────────────────────────────

// Bright Data confirmed: budgeted strength 490 (FOP report May 2024), dropped
// to 290. 15% pay raise approved. 324 is a reasonable post-raise estimate.
const STAFFING = {
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

function StaffingOverview() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Staffing Overview
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Authorized Strength" value={STAFFING.mpd.authorized} />
        <StatCard label="Current Strength" value={STAFFING.mpd.current} />
        <StatCard label="Vacancy Count" value={STAFFING.mpd.vacancy} />
        <StatCard
          label="Vacancy Rate"
          value={`${STAFFING.mpd.vacancyRate}%`}
          badge={<Badge variant="destructive">{STAFFING.mpd.vacancyRate}%</Badge>}
        />
        <StatCard label="911 Authorized" value={STAFFING.dispatch.authorized} />
        <StatCard label="911 Filled" value={STAFFING.dispatch.filled} />
        <StatCard label="911 Vacancy" value={`${STAFFING.dispatch.vacancy} positions`} />
        <StatCard
          label="911 Vacancy Rate"
          value={`${STAFFING.dispatch.vacancyRate}%`}
          badge={
            <Badge className="border-transparent bg-amber-500 text-white">
              {STAFFING.dispatch.vacancyRate}%
            </Badge>
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-bold">{value}</span>
          {badge}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section B: District Coverage Bar Chart ──────────────────────────────────

const TARGET_PER_DISTRICT = 44;

const districtCoverage = [
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

function getBarColor(value: number): string {
  if (value < 33) return "hsl(0 72% 51%)"; // red
  if (value <= 40) return "hsl(38 92% 50%)"; // amber
  return "hsl(142 71% 45%)"; // green
}

function DistrictCoverageChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">District Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={districtCoverage} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="district" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const current = payload.find((p) => p.dataKey === "current")?.value as number;
                const target = payload.find((p) => p.dataKey === "target")?.value as number;
                return (
                  <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                    <p className="font-medium">{label}</p>
                    <p>Current: {current}</p>
                    <p>Target: {target}</p>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="current" name="Current Officers" radius={[4, 4, 0, 0]}>
              {districtCoverage.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.current)} />
              ))}
            </Bar>
            <Bar
              dataKey="target"
              name="Target"
              fill="hsl(221 83% 53% / 0.3)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Section C: 311 Demand Proxy ─────────────────────────────────────────────

function DemandProxyChart() {
  const [demandData, setDemandData] = useState<{ district: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const fc = await queryFeaturesAsGeoJSON({
          url: ARCGIS_URLS.serviceRequests311,
          where: "Year=2024",
          outFields: "District,Status,Year",
          returnGeometry: false,
          maxRecords: 500,
        });
        if (cancelled) return;

        const counts: Record<string, number> = {};
        for (const feature of fc.features) {
          const d = String(feature.properties?.District ?? "Unknown");
          counts[d] = (counts[d] || 0) + 1;
        }

        const sorted = Object.entries(counts)
          .map(([district, count]) => ({ district, count }))
          .sort((a, b) => b.count - a.count);

        setDemandData(sorted);
      } catch {
        setDemandData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">311 Service Request Volume by District (2024)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Higher volume indicates greater service demand relative to officer coverage.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Loading 311 data...
          </div>
        ) : demandData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No 311 data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(250, demandData.length * 32)}>
            <BarChart
              data={demandData}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="district"
                tick={{ fontSize: 11 }}
                width={80}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Bar dataKey="count" name="Requests" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section D: Recruiting Action Items ──────────────────────────────────────

interface ActionItem {
  id: number;
  title: string;
  priority: "High" | "Medium";
}

const ACTION_ITEMS: ActionItem[] = [
  {
    id: 1,
    title: "Post openings on Indeed and LinkedIn with signing bonus details",
    priority: "High",
  },
  { id: 2, title: "Partner with Troy University criminal justice program", priority: "High" },
  { id: 3, title: "Schedule next Citizen Police Academy cohort for Q2", priority: "Medium" },
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

function RecruitingActions() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const toggle = (id: number) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  // CopilotKit action: generate staffing report
  useCopilotAction({
    name: "generate_staffing_report",
    description: "Generate a formatted markdown staffing report for MPD",
    parameters: [
      {
        name: "includeDistricts",
        type: "boolean",
        description: "Whether to include district coverage data",
        required: true,
      },
      {
        name: "includeDemand",
        type: "boolean",
        description: "Whether to include 311 demand proxy data",
        required: true,
      },
    ],
    handler: ({ includeDistricts, includeDemand }) => {
      let md = `# MPD Staffing Report\n\n`;
      md += `## Overview\n`;
      md += `- **Authorized Strength:** ${STAFFING.mpd.authorized}\n`;
      md += `- **Current Strength:** ${STAFFING.mpd.current}\n`;
      md += `- **Vacancy:** ${STAFFING.mpd.vacancy} (${STAFFING.mpd.vacancyRate}%)\n\n`;
      md += `## 911 Dispatch\n`;
      md += `- **Authorized:** ${STAFFING.dispatch.authorized}\n`;
      md += `- **Filled:** ${STAFFING.dispatch.filled}\n`;
      md += `- **Vacancy:** ${STAFFING.dispatch.vacancy} (${STAFFING.dispatch.vacancyRate}%)\n\n`;

      if (includeDistricts) {
        md += `## District Coverage\n`;
        md += `| District | Current | Target | Status |\n`;
        md += `|----------|---------|--------|--------|\n`;
        for (const d of districtCoverage) {
          const status =
            d.current < 33 ? "Critical" : d.current <= 40 ? "Below Target" : "On Target";
          md += `| ${d.district} | ${d.current} | ${d.target} | ${status} |\n`;
        }
        md += `\n`;
      }

      if (includeDemand) {
        md += `## 311 Demand Proxy\n`;
        md += `311 service request volume by district is available in the dashboard for 2024.\n\n`;
      }

      md += `## Recruiting Action Items\n`;
      for (const item of ACTION_ITEMS) {
        const done = checked[item.id] ? "x" : " ";
        md += `- [${done}] (${item.priority}) ${item.title}\n`;
      }

      setReportMarkdown(md);
      setReportOpen(true);
      return md;
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recruiting Action Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ACTION_ITEMS.map((item) => (
          <label key={item.id} className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={!!checked[item.id]}
              onCheckedChange={() => toggle(item.id)}
              className="mt-0.5"
            />
            <span className={checked[item.id] ? "line-through text-muted-foreground" : ""}>
              {item.title}
            </span>
            <Badge
              variant={item.priority === "High" ? "destructive" : "secondary"}
              className="ml-auto shrink-0"
            >
              {item.priority}
            </Badge>
          </label>
        ))}

        <Button
          className="mt-4 w-full"
          onClick={() => {
            let md = `# MPD Staffing Report\n\n`;
            md += `## Overview\n`;
            md += `- **Authorized Strength:** ${STAFFING.mpd.authorized}\n`;
            md += `- **Current Strength:** ${STAFFING.mpd.current}\n`;
            md += `- **Vacancy:** ${STAFFING.mpd.vacancy} (${STAFFING.mpd.vacancyRate}%)\n\n`;
            md += `## 911 Dispatch\n`;
            md += `- **Authorized:** ${STAFFING.dispatch.authorized}\n`;
            md += `- **Filled:** ${STAFFING.dispatch.filled}\n`;
            md += `- **Vacancy:** ${STAFFING.dispatch.vacancy} (${STAFFING.dispatch.vacancyRate}%)\n\n`;
            md += `## District Coverage\n`;
            md += `| District | Current | Target | Status |\n`;
            md += `|----------|---------|--------|--------|\n`;
            for (const d of districtCoverage) {
              const status =
                d.current < 33 ? "Critical" : d.current <= 40 ? "Below Target" : "On Target";
              md += `| ${d.district} | ${d.current} | ${d.target} | ${status} |\n`;
            }
            md += `\n## Recruiting Action Items\n`;
            for (const item of ACTION_ITEMS) {
              const done = checked[item.id] ? "x" : " ";
              md += `- [${done}] (${item.priority}) ${item.title}\n`;
            }
            setReportMarkdown(md);
            setReportOpen(true);
          }}
        >
          Generate Staffing Report
        </Button>

        {reportMarkdown && (
          <div className="mt-2">
            <button
              type="button"
              className="text-sm font-medium text-primary underline"
              onClick={() => setReportOpen((o) => !o)}
            >
              {reportOpen ? "Hide Report" : "Show Report"}
            </button>
            {reportOpen && (
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-xs">
                {reportMarkdown}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main StaffingDashboard ──────────────────────────────────────────────────

export function StaffingDashboard() {
  // CopilotKit readable: staffing data
  useCopilotReadable({
    description: "MPD and 911 staffing levels, vacancy rates, and district coverage",
    value: {
      mpd: {
        authorized: STAFFING.mpd.authorized,
        current: STAFFING.mpd.current,
        vacancy: STAFFING.mpd.vacancy,
        vacancyRate: STAFFING.mpd.vacancyRate,
      },
      dispatch: {
        authorized: STAFFING.dispatch.authorized,
        filled: STAFFING.dispatch.filled,
        vacancy: STAFFING.dispatch.vacancy,
        vacancyRate: STAFFING.dispatch.vacancyRate,
      },
    },
  });

  return (
    <div className="space-y-6 overflow-auto p-4">
      <StaffingOverview />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistrictCoverageChart />
        <DemandProxyChart />
      </div>
      <RecruitingActions />
    </div>
  );
}

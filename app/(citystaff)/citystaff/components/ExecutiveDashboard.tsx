"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  ClipboardList,
  HardHat,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ARCGIS_URLS,
  queryFeatureCount,
  queryFeatureStats,
  queryMultiStats,
} from "@/lib/arcgis-client";

// MPD staffing data (sourced from Bright Data web searches)
const MPD_STAFFING = {
  authorized: 489,
  current: 396,
  vacancies: 93,
  vacancyRate: 19,
  candidatesInPipeline: 47,
  source: "Bright Data web search · Montgomery MPD staffing reports",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface KpiData {
  open311: number | null;
  activeViolations: number | null;
  activePermits: number | null;
  isLoading: boolean;
}

interface ServiceData {
  resolutionByDistrict: { district: string; open: number; closed: number; rate: number }[];
  pavingByStatus: { status: string; count: number }[];
  permitValueByDistrict: { district: string; value: number }[];
  isLoading: boolean;
}

function normalizeDistrict(raw: unknown): string {
  const s = String(raw ?? "0").trim();
  if (s === "0" || s === "" || s.toLowerCase() === "unknown") return "Unassigned";
  const num = s.replace(/\D+/g, "");
  return num ? `D${num}` : "Unassigned";
}

export function ExecutiveDashboard() {
  const [kpi, setKpi] = useState<KpiData>({
    open311: null,
    activeViolations: null,
    activePermits: null,
    isLoading: true,
  });
  const [service, setService] = useState<ServiceData>({
    resolutionByDistrict: [],
    pavingByStatus: [],
    permitValueByDistrict: [],
    isLoading: true,
  });

  // Fetch KPI counts
  useEffect(() => {
    async function fetchKpis() {
      const [open311, violations, permits] = await Promise.all([
        queryFeatureCount(ARCGIS_URLS.serviceRequests311, "Status <> 'Closed'"),
        queryFeatureCount(ARCGIS_URLS.codeViolations, "CaseStatus = 'OPEN'"),
        queryFeatureCount(ARCGIS_URLS.constructionPermits, "PermitStatus = 'ISSUED'"),
      ]);
      setKpi({ open311, activeViolations: violations, activePermits: permits, isLoading: false });
    }
    fetchKpis();
  }, []);

  // Fetch service performance data
  useEffect(() => {
    async function fetchServiceData() {
      const [resolutionStats, pavingStats, permitStats] = await Promise.all([
        // 311 by district and status
        queryMultiStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "District",
          statistics: [{ field: "Request_ID", type: "count", alias: "total" }],
        }),
        // Paving by status
        queryFeatureStats({
          url: ARCGIS_URLS.pavingProject,
          groupByField: "Status",
          statisticField: "Status",
          statisticType: "count",
        }),
        // Permit cost by district
        queryFeatureStats({
          url: ARCGIS_URLS.constructionPermits,
          groupByField: "DistrictCouncil",
          statisticField: "EstimatedCost",
          statisticType: "sum",
        }),
      ]);

      // Process 311 resolution by district — we need open vs closed
      const [openStats, closedStats] = await Promise.all([
        queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          where: "Status <> 'Closed'",
          groupByField: "District",
          statisticField: "Request_ID",
          statisticType: "count",
        }),
        queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          where: "Status = 'Closed'",
          groupByField: "District",
          statisticField: "Request_ID",
          statisticType: "count",
        }),
      ]);

      const districtMap = new Map<string, { open: number; closed: number }>();
      for (const s of openStats) {
        const key = normalizeDistrict(s.group);
        if (!key.startsWith("D")) continue;
        const entry = districtMap.get(key) ?? { open: 0, closed: 0 };
        entry.open += s.value;
        districtMap.set(key, entry);
      }
      for (const s of closedStats) {
        const key = normalizeDistrict(s.group);
        if (!key.startsWith("D")) continue;
        const entry = districtMap.get(key) ?? { open: 0, closed: 0 };
        entry.closed += s.value;
        districtMap.set(key, entry);
      }

      const resolutionByDistrict = Array.from(districtMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([district, data]) => ({
          district,
          open: data.open,
          closed: data.closed,
          rate:
            data.open + data.closed > 0
              ? Math.round((data.closed / (data.open + data.closed)) * 100)
              : 0,
        }));

      const pavingByStatus = pavingStats
        .filter((s) => s.group && s.group !== "null")
        .map((s) => ({ status: s.group, count: s.value }))
        .sort((a, b) => b.count - a.count);

      const permitValueByDistrict = permitStats
        .map((s) => ({
          district: normalizeDistrict(s.group),
          value: Math.round((s.value / 1_000_000) * 10) / 10,
        }))
        .filter((d) => d.district.startsWith("D"))
        .sort((a, b) => a.district.localeCompare(b.district));

      setService({
        resolutionByDistrict,
        pavingByStatus,
        permitValueByDistrict,
        isLoading: false,
      });
    }
    fetchServiceData();
  }, []);

  // Generate action items
  const actionItems = [];
  if (!service.isLoading) {
    const lowResolution = service.resolutionByDistrict.filter((d) => d.rate < 40);
    if (lowResolution.length > 0) {
      actionItems.push(
        `${lowResolution.length} district${lowResolution.length > 1 ? "s" : ""} ha${lowResolution.length > 1 ? "ve" : "s"} <40% request closure rate — prioritize for service review`,
      );
    }

    actionItems.push(
      `${MPD_STAFFING.vacancyRate}% MPD vacancy — recruitment pipeline at ${MPD_STAFFING.candidatesInPipeline} candidates`,
    );

    const zeroDist = service.permitValueByDistrict.filter((d) => d.value === 0);
    if (zeroDist.length > 0) {
      actionItems.push(
        `${zeroDist.map((d) => d.district).join(", ")} ha${zeroDist.length > 1 ? "ve" : "s"} $0 in active permits — investigate economic stagnation`,
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 overflow-auto p-4">
      {/* Row 1: Hero KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Open 311 Requests"
          value={kpi.open311}
          icon={ClipboardList}
          isLoading={kpi.isLoading}
          color="text-blue-500"
        />
        <KpiCard
          title="Active Code Violations"
          value={kpi.activeViolations}
          icon={ShieldAlert}
          isLoading={kpi.isLoading}
          color="text-red-500"
        />
        <KpiCard
          title="MPD Vacancy Rate"
          value={`${MPD_STAFFING.vacancyRate}%`}
          subtitle={`${MPD_STAFFING.current}/${MPD_STAFFING.authorized} officers`}
          icon={AlertTriangle}
          isLoading={false}
          color="text-amber-500"
          trend="down"
        />
        <KpiCard
          title="Active Permits"
          value={kpi.activePermits}
          icon={Building2}
          isLoading={kpi.isLoading}
          color="text-green-500"
        />
      </div>

      {/* Row 2: Service Performance */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">311 Resolution Rate by District</CardTitle>
            <p className="text-xs text-muted-foreground">% of requests closed</p>
          </CardHeader>
          <CardContent>
            {service.isLoading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={service.resolutionByDistrict} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="district" tick={{ fontSize: 11 }} width={30} />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Resolution Rate"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {service.resolutionByDistrict.map((d, i) => (
                      <Cell
                        key={d.district}
                        fill={d.rate >= 60 ? "#10b981" : d.rate >= 40 ? "#f59e0b" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permit Investment by District</CardTitle>
            <p className="text-xs text-muted-foreground">
              Estimated construction cost ($ millions)
            </p>
          </CardHeader>
          <CardContent>
            {service.isLoading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={service.permitValueByDistrict}>
                  <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="M" />
                  <Tooltip
                    formatter={(v: number) => [`$${v}M`, "Investment"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Infrastructure */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paving Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            {service.isLoading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : (
              <div className="flex items-center justify-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={service.pavingByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {service.pavingByStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5">
                  {service.pavingByStatus.map((s, i) => (
                    <div key={s.status} className="flex items-center gap-2 text-xs">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{s.status}</span>
                      <span className="ml-auto font-medium tabular-nums">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MPD Staffing Overview</CardTitle>
            <p className="text-xs text-muted-foreground">{MPD_STAFFING.source}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Authorized</p>
                <p className="text-xl font-bold tabular-nums">{MPD_STAFFING.authorized}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-xl font-bold tabular-nums">{MPD_STAFFING.current}</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-xs text-muted-foreground">Vacancies</p>
                <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {MPD_STAFFING.vacancies}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">In Pipeline</p>
                <p className="text-xl font-bold tabular-nums">
                  {MPD_STAFFING.candidatesInPipeline}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Action Items */}
      {actionItems.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <HardHat className="size-4" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground">
        Source: Montgomery ArcGIS (311 requests, code violations, construction permits, paving
        projects) · MPD staffing data via Bright Data web search
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading,
  color,
  trend,
}: {
  title: string;
  value: number | string | null;
  subtitle?: string;
  icon: typeof ClipboardList;
  isLoading: boolean;
  color: string;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg bg-muted p-2 ${color}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-7 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-bold tabular-nums">
                {typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
              </p>
              {trend === "up" && <ArrowUp className="size-3.5 text-green-500" />}
              {trend === "down" && <ArrowDown className="size-3.5 text-red-500" />}
            </div>
          )}
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

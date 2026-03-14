"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  HardHat,
  Loader2,
  MessageSquare,
  RefreshCw,
  Shield,
  ShieldAlert,
  Siren,
  Sparkles,
} from "lucide-react";
import { type MutableRefObject, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type SearchResult, searchCrimeData, searchMPDStaffing } from "@/app/actions/civic-search";
import { SearchResultCard } from "@/components/SearchResultCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ARCGIS_URLS, queryFeatureCount, queryFeatureStats } from "@/lib/arcgis-client";
import { useChartData } from "@/lib/hooks/use-chart-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutiveDashboardProps {
  highlightedAlert: number | null;
  sectionRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
}

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

interface AlertItem {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  action: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fallback values used when Bright Data search hasn't completed yet */
const MPD_STAFFING_FALLBACK = {
  authorized: 489,
  current: 396,
  vacancies: 93,
  vacancyRate: 19,
  candidatesInPipeline: 47,
};

interface MPDStaffingData {
  authorized: number;
  current: number;
  vacancies: number;
  vacancyRate: number;
  candidatesInPipeline: number;
  source: string;
  isLive: boolean;
  results: SearchResult[];
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const SEVERITY_STYLES = {
  critical: "border-l-red-500 bg-red-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  info: "border-l-blue-500 bg-blue-500/5",
};

const SEVERITY_LABELS = {
  critical: { text: "Critical", className: "text-red-500" },
  warning: { text: "Warning", className: "text-amber-500" },
  info: { text: "Info", className: "text-blue-500" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeDistrict(raw: unknown): string {
  const s = String(raw ?? "0").trim();
  if (s === "0" || s === "" || s.toLowerCase() === "unknown") return "Unassigned";
  const num = s.replace(/\D+/g, "");
  return num ? `D${num}` : "Unassigned";
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ExecutiveDashboard({ highlightedAlert, sectionRefs }: ExecutiveDashboardProps) {
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
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // MPD staffing — dynamically fetched from Bright Data
  const [mpdStaffing, setMpdStaffing] = useState<MPDStaffingData>({
    ...MPD_STAFFING_FALLBACK,
    source: "Cached fallback — loading live data...",
    isLive: false,
    results: [],
  });
  const [mpdLoading, setMpdLoading] = useState(true);

  // Crime data — fetched from Bright Data
  const [crimeResults, setCrimeResults] = useState<SearchResult[]>([]);
  const [crimeLoading, setCrimeLoading] = useState(true);

  // Chart data hooks
  const { data: kpiTrends } = useChartData("kpiTrends");
  const { data: crossPortalSummary } = useChartData("crossPortalSummary");

  // ---------- Fetch KPIs ----------
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

  // ---------- Fetch MPD staffing from Bright Data ----------
  const fetchMPDStaffing = useCallback(async () => {
    setMpdLoading(true);
    try {
      const results = await searchMPDStaffing();
      setMpdStaffing({
        ...MPD_STAFFING_FALLBACK,
        source:
          results.length > 0
            ? "Bright Data web search — live results"
            : "Bright Data unavailable — using cached data",
        isLive: results.length > 0,
        results,
      });
    } catch {
      setMpdStaffing((prev) => ({
        ...prev,
        source: "Bright Data unavailable — using cached data",
        isLive: false,
      }));
    } finally {
      setMpdLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMPDStaffing();
  }, [fetchMPDStaffing]);

  // ---------- Fetch crime data from Bright Data ----------
  const fetchCrime = useCallback(async () => {
    setCrimeLoading(true);
    try {
      const results = await searchCrimeData();
      setCrimeResults(results);
    } catch {
      setCrimeResults([]);
    } finally {
      setCrimeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrime();
  }, [fetchCrime]);

  // ---------- Fetch service data ----------
  useEffect(() => {
    async function fetchServiceData() {
      const [openStats, closedStats, pavingStats, permitStats] = await Promise.all([
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
        queryFeatureStats({
          url: ARCGIS_URLS.pavingProject,
          groupByField: "Status",
          statisticField: "Status",
          statisticType: "count",
        }),
        queryFeatureStats({
          url: ARCGIS_URLS.constructionPermits,
          groupByField: "DistrictCouncil",
          statisticField: "EstimatedCost",
          statisticType: "sum",
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

      setService({ resolutionByDistrict, pavingByStatus, permitValueByDistrict, isLoading: false });
    }
    fetchServiceData();
  }, []);

  // ---------- Compute alerts ----------
  const alerts = useMemo<AlertItem[]>(() => {
    if (service.isLoading) return [];
    const items: AlertItem[] = [];

    // Critical: districts with <40% resolution
    const lowResolution = service.resolutionByDistrict.filter((d) => d.rate < 40);
    if (lowResolution.length > 0) {
      items.push({
        severity: "critical",
        title: `Low 311 Resolution: ${lowResolution.map((d) => d.district).join(", ")}`,
        description: `${lowResolution.length} district${lowResolution.length > 1 ? "s" : ""} ha${lowResolution.length > 1 ? "ve" : "s"} less than 40% service request closure rate.`,
        action: "Prioritize for service review and resource reallocation.",
      });
    }

    // Critical: MPD vacancy
    if (mpdStaffing.vacancyRate > 15) {
      items.push({
        severity: "critical",
        title: `MPD Vacancy Rate at ${mpdStaffing.vacancyRate}%`,
        description: `${mpdStaffing.vacancies} unfilled positions out of ${mpdStaffing.authorized} authorized. ${mpdStaffing.candidatesInPipeline} candidates in pipeline.`,
        action: "Accelerate recruiting pipeline and review retention incentives.",
      });
    }

    // Warning: $0 permit investment districts
    const zeroDist = service.permitValueByDistrict.filter((d) => d.value === 0);
    if (zeroDist.length > 0) {
      items.push({
        severity: "warning",
        title: `Zero Permit Investment: ${zeroDist.map((d) => d.district).join(", ")}`,
        description: `${zeroDist.length} district${zeroDist.length > 1 ? "s" : ""} showing $0 in active construction permits.`,
        action: "Investigate economic stagnation and consider incentive programs.",
      });
    }

    // Info: demand vs investment imbalance
    if (service.resolutionByDistrict.length > 0 && service.permitValueByDistrict.length > 0) {
      const avgRequests =
        service.resolutionByDistrict.reduce((s, d) => s + d.open + d.closed, 0) /
        service.resolutionByDistrict.length;
      const avgInvestment =
        service.permitValueByDistrict.reduce((s, d) => s + d.value, 0) /
        service.permitValueByDistrict.length;

      const imbalanced = service.resolutionByDistrict.filter((d) => {
        const investment = service.permitValueByDistrict.find((p) => p.district === d.district);
        const demand = d.open + d.closed;
        return demand > avgRequests * 1.3 && (investment?.value ?? 0) < avgInvestment * 0.7;
      });

      if (imbalanced.length > 0) {
        items.push({
          severity: "info",
          title: `Demand-Investment Imbalance: ${imbalanced.map((d) => d.district).join(", ")}`,
          description: `High service demand (>1.3x avg) but low permit investment (<0.7x avg).`,
          action: "Review resource allocation and economic development targeting.",
        });
      }
    }

    return items;
  }, [service, mpdStaffing]);

  // ---------- Briefing generation ----------
  function handleGenerateBriefing() {
    setIsGenerating(true);
    // Build a deterministic briefing from current data
    const lines: string[] = [];
    lines.push("MONTGOMERY EXECUTIVE BRIEFING");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    lines.push("KEY METRICS:");
    if (kpi.open311 !== null) lines.push(`  - Open 311 Requests: ${kpi.open311.toLocaleString()}`);
    if (kpi.activeViolations !== null)
      lines.push(`  - Active Code Violations: ${kpi.activeViolations.toLocaleString()}`);
    lines.push(
      `  - MPD Vacancy Rate: ${mpdStaffing.vacancyRate}% (${mpdStaffing.vacancies} positions)`,
    );
    if (kpi.activePermits !== null)
      lines.push(`  - Active Permits: ${kpi.activePermits.toLocaleString()}`);

    if (crossPortalSummary?.[0]) {
      const s = crossPortalSummary[0];
      lines.push("");
      lines.push("CROSS-PORTAL SUMMARY:");
      lines.push(
        `  - Total 311 Requests: ${s.totalRequests?.toLocaleString()} (${s.closedPct}% closed)`,
      );
      lines.push(`  - Paving Projects: ${s.pavingCount}`);
      lines.push(`  - Active Violations: ${s.activeViolations?.toLocaleString()}`);
      lines.push(`  - Total Permit Cost: $${(s.totalPermitCost / 1_000_000).toFixed(1)}M`);
    }

    if (alerts.length > 0) {
      lines.push("");
      lines.push("PRIORITY ALERTS:");
      for (const alert of alerts) {
        lines.push(`  [${alert.severity.toUpperCase()}] ${alert.title}`);
        lines.push(`    Action: ${alert.action}`);
      }
    }

    setBriefing(lines.join("\n"));
    setLastGenerated(new Date());
    setIsGenerating(false);
  }

  // Sparkline data from kpiTrends
  const sparklineData = useMemo(() => {
    if (!kpiTrends || kpiTrends.length === 0) return { requests: [], violations: [], permits: [] };
    return {
      requests: kpiTrends.map((d: any) => ({ v: d.requests })),
      violations: kpiTrends.map((d: any) => ({ v: d.violations })),
      permits: kpiTrends.map((d: any) => ({ v: d.permits })),
    };
  }, [kpiTrends]);

  // Cross-portal summary
  const summary = crossPortalSummary?.[0] ?? null;

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 6);

  // Time since last generated
  const lastGenStr = lastGenerated
    ? `${Math.round((Date.now() - lastGenerated.getTime()) / 60000)} min ago`
    : null;

  return (
    <div className="flex flex-col gap-4 overflow-auto p-4">
      {/* ================================================================= */}
      {/* MORNING BRIEFING                                                  */}
      {/* ================================================================= */}
      <div
        ref={(el) => {
          sectionRefs.current.briefing = el;
        }}
      >
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-amber-500" />
                Daily Briefing
              </CardTitle>
              <div className="flex items-center gap-2">
                {lastGenStr && (
                  <span className="text-[10px] text-muted-foreground">
                    Last generated: {lastGenStr}
                  </span>
                )}
                <Button
                  size="sm"
                  variant={briefing ? "outline" : "default"}
                  onClick={handleGenerateBriefing}
                  disabled={isGenerating || kpi.isLoading}
                  className="h-7 gap-1.5 text-xs"
                >
                  {briefing ? <RefreshCw className="size-3" /> : <Sparkles className="size-3" />}
                  {briefing ? "Refresh" : "Generate"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {briefing ? (
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-xs font-mono leading-relaxed text-foreground">
                {briefing}
              </pre>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-dashed bg-muted/30 py-8">
                <p className="text-xs text-muted-foreground">
                  Click &quot;Generate&quot; to create your daily executive briefing
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* KPI GRID                                                          */}
      {/* ================================================================= */}
      <div
        ref={(el) => {
          sectionRefs.current.kpis = el;
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Open 311 Requests"
            value={kpi.open311}
            icon={ClipboardList}
            isLoading={kpi.isLoading}
            color="text-blue-500"
            sparklineData={sparklineData.requests}
            sparklineColor="#3b82f6"
          />
          <KpiCard
            title="Active Code Violations"
            value={kpi.activeViolations}
            icon={ShieldAlert}
            isLoading={kpi.isLoading}
            color="text-red-500"
            sparklineData={sparklineData.violations}
            sparklineColor="#ef4444"
          />
          <KpiCard
            title="MPD Vacancy Rate"
            value={`${mpdStaffing.vacancyRate}%`}
            subtitle={`${mpdStaffing.current}/${mpdStaffing.authorized} officers`}
            icon={AlertTriangle}
            isLoading={mpdLoading}
            color="text-amber-500"
          />
          <KpiCard
            title="Active Permits"
            value={kpi.activePermits}
            icon={Building2}
            isLoading={kpi.isLoading}
            color="text-green-500"
            sparklineData={sparklineData.permits}
            sparklineColor="#10b981"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* ALERT PRIORITY QUEUE                                              */}
      {/* ================================================================= */}
      <div
        ref={(el) => {
          sectionRefs.current.alerts = el;
        }}
      >
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-amber-500" />
              Priority Alerts
              {alerts.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal tabular-nums text-muted-foreground">
                  {alerts.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {service.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active alerts.</p>
            ) : (
              <div className="space-y-2">
                {visibleAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`rounded-md border-l-4 p-3 transition-colors ${SEVERITY_STYLES[alert.severity]} ${highlightedAlert === i ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold uppercase ${SEVERITY_LABELS[alert.severity].className}`}
                          >
                            {SEVERITY_LABELS[alert.severity].text}
                          </span>
                          <h4 className="truncate text-xs font-medium">{alert.title}</h4>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {alert.description}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-foreground/80">
                          <ArrowRight className="mr-1 inline size-3" />
                          {alert.action}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 shrink-0 gap-1 text-[10px]">
                        <MessageSquare className="size-3" />
                        Discuss
                      </Button>
                    </div>
                  </div>
                ))}
                {alerts.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1 text-xs"
                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                  >
                    {showAllAlerts ? (
                      <>
                        <ChevronUp className="size-3" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3" /> Show all ({alerts.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* CROSS-PORTAL PULSE                                                */}
      {/* ================================================================= */}
      <div
        ref={(el) => {
          sectionRefs.current.crossPortalPulse = el;
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PulseCard
            title="Safety"
            subtitle="Resident Portal"
            icon={Shield}
            iconColor="text-blue-500"
            isLoading={!summary}
            stats={
              summary
                ? [
                    {
                      label: "Total 311 Requests",
                      value: summary.totalRequests?.toLocaleString() ?? "—",
                    },
                    { label: "Requests Closed", value: `${summary.closedPct}%` },
                  ]
                : []
            }
            link="/resident"
          />
          <PulseCard
            title="Business"
            subtitle="Business Portal"
            icon={Building2}
            iconColor="text-green-500"
            isLoading={!summary}
            stats={
              summary
                ? [
                    { label: "Active Permits", value: String(summary.totalPermits ?? "—") },
                    {
                      label: "Total Est. Cost",
                      value: summary.totalPermitCost
                        ? `$${(summary.totalPermitCost / 1_000_000).toFixed(1)}M`
                        : "—",
                    },
                  ]
                : []
            }
            link="/business"
          />
          <PulseCard
            title="Infrastructure"
            subtitle="City Staff Portal"
            icon={HardHat}
            iconColor="text-amber-500"
            isLoading={!summary}
            stats={
              summary
                ? [
                    { label: "Paving Projects", value: String(summary.pavingCount ?? "—") },
                    {
                      label: "Active Violations",
                      value: summary.activeViolations?.toLocaleString() ?? "—",
                    },
                  ]
                : []
            }
            link="/citystaff"
          />
          <PulseCard
            title="Public Safety"
            subtitle="MPD Staffing"
            icon={ShieldAlert}
            iconColor="text-red-500"
            isLoading={mpdLoading}
            stats={[
              {
                label: "Current Officers",
                value: `${mpdStaffing.current}/${mpdStaffing.authorized}`,
              },
              { label: "In Pipeline", value: String(mpdStaffing.candidatesInPipeline) },
            ]}
            link="/citystaff"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* SERVICE PERFORMANCE                                               */}
      {/* ================================================================= */}
      <div
        ref={(el) => {
          sectionRefs.current.servicePerformance = el;
        }}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="border-border/60 bg-card">
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
                      {service.resolutionByDistrict.map((d) => (
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

          <Card className="border-border/60 bg-card">
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
      </div>

      {/* ================================================================= */}
      {/* INFRASTRUCTURE STATUS                                             */}
      {/* ================================================================= */}
      <div
        ref={(el) => {
          sectionRefs.current.infrastructure = el;
        }}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="border-border/60 bg-card">
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

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">MPD Staffing Overview</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {mpdStaffing.source}
                    {!mpdStaffing.isLive && <span className="ml-1 text-amber-500">(stale)</span>}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={fetchMPDStaffing}
                  disabled={mpdLoading}
                >
                  {mpdLoading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Authorized</p>
                  <p className="text-xl font-bold tabular-nums">{mpdStaffing.authorized}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-xl font-bold tabular-nums">{mpdStaffing.current}</p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs text-muted-foreground">Vacancies</p>
                  <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {mpdStaffing.vacancies}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">In Pipeline</p>
                  <p className="text-xl font-bold tabular-nums">
                    {mpdStaffing.candidatesInPipeline}
                  </p>
                </div>
              </div>
              {/* Live search results from Bright Data */}
              {mpdStaffing.results.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Latest Sources
                  </p>
                  {mpdStaffing.results.slice(0, 3).map((result) => (
                    <SearchResultCard
                      key={result.url}
                      result={result}
                      icon={<Shield className="h-4 w-4 text-blue-500" />}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CRIME & PUBLIC SAFETY INTELLIGENCE                                */}
      {/* ================================================================= */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Siren className="size-4 text-red-500" />
              Crime & Public Safety Intelligence
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={fetchCrime}
              disabled={crimeLoading}
            >
              {crimeLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Live web search results for Montgomery crime statistics via Bright Data
          </p>
        </CardHeader>
        <CardContent>
          {crimeLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : crimeResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No crime data available — Bright Data search returned no results
            </p>
          ) : (
            <div className="space-y-2">
              {crimeResults.slice(0, 5).map((result) => (
                <SearchResultCard
                  key={result.url}
                  result={result}
                  icon={<Siren className="h-4 w-4 text-red-500" />}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground">
        Source: Montgomery ArcGIS (311 requests, code violations, construction permits, paving
        projects) · MPD staffing &amp; crime data via Bright Data web search
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading,
  color,
  sparklineData,
  sparklineColor,
}: {
  title: string;
  value: number | string | null;
  subtitle?: string;
  icon: typeof ClipboardList;
  isLoading: boolean;
  color: string;
  sparklineData?: { v: number }[];
  sparklineColor?: string;
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={`rounded-lg bg-muted p-2 ${color}`}>
                <Icon className="size-4" />
              </div>
              <p className="truncate text-xs text-muted-foreground">{title}</p>
            </div>
            {isLoading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {typeof value === "number" ? value.toLocaleString() : (value ?? "\u2014")}
              </p>
            )}
            {subtitle && <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <div className="ml-2 shrink-0">
              <ResponsiveContainer width={80} height={30}>
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={sparklineColor ?? "#8884d8"}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PulseCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  isLoading,
  stats,
  link,
}: {
  title: string;
  subtitle: string;
  icon: typeof Shield;
  iconColor: string;
  isLoading: boolean;
  stats: { label: string; value: string }[];
  link: string;
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg bg-muted p-1.5 ${iconColor}`}>
              <Icon className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-medium">{title}</p>
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <a
            href={link}
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            View <ArrowRight className="size-3" />
          </a>
        </div>
        {isLoading ? (
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

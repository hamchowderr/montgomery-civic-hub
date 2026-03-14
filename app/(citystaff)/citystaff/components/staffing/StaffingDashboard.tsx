"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Construction,
  FileBarChart,
  Map,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemandChart } from "./DemandChart";
import { DistrictCoverage } from "./DistrictCoverage";
import { PavingSection } from "./PavingSection";
import { RecruitingActions } from "./RecruitingActions";
import { RequestTypeChart } from "./RequestTypeChart";
import { SectionWrapper } from "./SectionWrapper";
import { StaffingOverview } from "./StaffingOverview";
import { DISTRICT_COVERAGE, STAFFING } from "./types";
import { useStaffingData } from "./useStaffingData";
import { formatCurrency, formatTons } from "./utils";
import { ViolationsChart } from "./ViolationsChart";

export function StaffingDashboard() {
  const { demandSummary, violationSummary, pavingSummary } = useStaffingData();

  // ── CopilotKit readables ────────────────────────────────────────────────

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

  useCopilotReadable({
    description:
      "Live service demand by district — 311 requests and code violations per council district",
    value: demandSummary.length > 0 ? demandSummary : "Loading...",
  });

  useCopilotReadable({
    description: "Code violation counts broken down by case type",
    value: violationSummary.length > 0 ? violationSummary : "Loading...",
  });

  useCopilotReadable({
    description:
      "Paving infrastructure totals — total projects, miles paved, asphalt cost, and estimated tons",
    value: pavingSummary
      ? {
          totalProjects: pavingSummary.totalProjects,
          totalMiles: `${pavingSummary.totalMiles.toFixed(1)} miles`,
          totalCost: formatCurrency(pavingSummary.totalCost),
          totalTons: formatTons(pavingSummary.totalTons),
        }
      : "Loading...",
  });

  // ── Derived stats ─────────────────────────────────────────────────────

  const maxVacancy = Math.max(STAFFING.mpd.vacancyRate, STAFFING.dispatch.vacancyRate);
  const healthStatus = maxVacancy >= 30 ? "Critical" : maxVacancy >= 20 ? "Warning" : "Healthy";
  const totalDeficit = DISTRICT_COVERAGE.reduce(
    (sum, d) => sum + Math.max(0, d.target - d.current),
    0,
  );

  // ── Layout ──────────────────────────────────────────────────────────────

  return (
    <div className="h-full space-y-4 overflow-auto px-4 py-4 sm:px-6 md:px-8">
      {/* ── KPI Summary Toolbar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {/* MPD vacancy badge */}
          <KpiBadge
            label="MPD Vacancy"
            value={`${STAFFING.mpd.vacancyRate}%`}
            severity={
              STAFFING.mpd.vacancyRate >= 30
                ? "critical"
                : STAFFING.mpd.vacancyRate >= 20
                  ? "warning"
                  : "healthy"
            }
          />

          {/* Dispatch vacancy badge */}
          <KpiBadge
            label="Dispatch Vacancy"
            value={`${STAFFING.dispatch.vacancyRate}%`}
            severity={
              STAFFING.dispatch.vacancyRate >= 30
                ? "critical"
                : STAFFING.dispatch.vacancyRate >= 20
                  ? "warning"
                  : "healthy"
            }
          />

          <div className="h-4 w-px bg-border" />

          {/* Total deficit */}
          <KpiBadge
            label="Total Deficit"
            value={`-${totalDeficit}`}
            severity={totalDeficit > 50 ? "critical" : totalDeficit > 25 ? "warning" : "healthy"}
          />

          <div className="h-4 w-px bg-border" />

          {/* Health indicator */}
          <Badge
            variant={healthStatus === "Critical" ? "destructive" : "secondary"}
            className={`gap-1 px-2.5 py-1 text-xs font-medium ${
              healthStatus === "Critical"
                ? "animate-pulse"
                : healthStatus === "Warning"
                  ? "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {healthStatus === "Critical" && <AlertTriangle className="size-3" />}
            {healthStatus === "Healthy" && <CheckCircle2 className="size-3" />}
            {healthStatus === "Warning" && <AlertTriangle className="size-3" />}
            {healthStatus}
          </Badge>

          <div className="flex-1" />

          {/* Source note */}
          <span className="text-[10px] text-muted-foreground">Source: FOP & MPD, May 2024</span>
        </div>
      </div>

      {/* ── Collapsible Sections ────────────────────────────────────────── */}

      {/* Section A: Staffing Overview — default open */}
      <SectionWrapper
        icon={<Users className="size-4 text-muted-foreground" />}
        title="Staffing Overview"
        badge={`${STAFFING.mpd.current + STAFFING.dispatch.filled} Active`}
        defaultOpen
      >
        <StaffingOverview />
      </SectionWrapper>

      {/* Section B: Demand vs Capacity — default open */}
      <SectionWrapper
        icon={<TrendingUp className="size-4 text-muted-foreground" />}
        title="Demand vs Capacity"
        defaultOpen
      >
        <DemandChart />
      </SectionWrapper>

      {/* Section C: Request Types + Code Violations */}
      <SectionWrapper
        icon={<FileBarChart className="size-4 text-muted-foreground" />}
        title="Request Types & Violations"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RequestTypeChart />
          <ViolationsChart />
        </div>
      </SectionWrapper>

      {/* Section D: Paving & Infrastructure */}
      <SectionWrapper
        icon={<Construction className="size-4 text-muted-foreground" />}
        title="Paving & Infrastructure"
      >
        <PavingSection />
      </SectionWrapper>

      {/* Section E: District Coverage */}
      <SectionWrapper
        icon={<Map className="size-4 text-muted-foreground" />}
        title="District Coverage"
        badge={`${DISTRICT_COVERAGE.length} Districts`}
      >
        <DistrictCoverage />
      </SectionWrapper>

      {/* Section F: Recruiting Actions */}
      <SectionWrapper
        icon={<ClipboardList className="size-4 text-muted-foreground" />}
        title="Recruiting Actions"
      >
        <RecruitingActions />
      </SectionWrapper>
    </div>
  );
}

// ── KPI Badge ────────────────────────────────────────────────────────────────

function KpiBadge({
  label,
  value,
  severity,
}: {
  label: string;
  value: string;
  severity: "critical" | "warning" | "healthy";
}) {
  const colors = {
    critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    healthy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colors[severity]}`}
    >
      <span className="text-muted-foreground font-normal">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

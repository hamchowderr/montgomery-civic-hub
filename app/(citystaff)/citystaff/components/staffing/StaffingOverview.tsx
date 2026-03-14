"use client";

import { AlertTriangle, Headphones, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STAFFING } from "./types";
import { getSeverityColor } from "./utils";

function StaffingGroup({
  icon,
  title,
  authorized,
  current,
  vacancy,
  vacancyRate,
}: {
  icon: React.ReactNode;
  title: string;
  authorized: number;
  current: number;
  vacancy: number;
  vacancyRate: number;
}) {
  const fillPercent = Math.round((current / authorized) * 100);
  const severity = getSeverityColor(fillPercent);

  return (
    <Card className="relative overflow-hidden">
      {/* Severity accent stripe */}
      <div className={`absolute left-0 top-0 h-full w-1.5 ${severity.bg}`} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h4>
        </div>

        {/* Hero vacancy rate */}
        <div className="flex items-baseline gap-3 mb-3">
          <span className={`text-4xl font-extrabold tabular-nums ${severity.text}`}>
            {vacancyRate}%
          </span>
          <span className="text-sm text-muted-foreground">vacancy rate</span>
          {vacancyRate >= 30 && <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />}
        </div>

        {/* Progress bar: current / authorized */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{current} filled</span>
            <span>{authorized} authorized</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${severity.bg}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{authorized}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Authorized</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{current}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Current</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className={`text-lg font-bold tabular-nums ${severity.text}`}>{vacancy}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Vacant</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffingOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StaffingGroup
        icon={<Shield className="h-4 w-4 text-muted-foreground" />}
        title="MPD Officers"
        authorized={STAFFING.mpd.authorized}
        current={STAFFING.mpd.current}
        vacancy={STAFFING.mpd.vacancy}
        vacancyRate={STAFFING.mpd.vacancyRate}
      />
      <StaffingGroup
        icon={<Headphones className="h-4 w-4 text-muted-foreground" />}
        title="911 Dispatch"
        authorized={STAFFING.dispatch.authorized}
        current={STAFFING.dispatch.filled}
        vacancy={STAFFING.dispatch.vacancy}
        vacancyRate={STAFFING.dispatch.vacancyRate}
      />
      <p className="col-span-full text-[10px] text-muted-foreground text-right">
        Source: Bright Data · FOP Report, May 2024
      </p>
    </div>
  );
}

"use client";

import { Building2, DollarSign, LandPlot, Trees } from "lucide-react";
import { useMemo } from "react";
import type { VacantProperty } from "./types";
import { formatCurrency } from "./utils";

export function SummaryStats({ properties }: { properties: VacantProperty[] }) {
  const stats = useMemo(() => {
    const available = properties.filter((p) => p.use === "AVAILABLE").length;
    const totalAcres = properties.reduce((sum, p) => sum + p.acreage, 0);
    const totalValue = properties.reduce((sum, p) => sum + p.appraised, 0);
    const neighborhoods = new Set(properties.map((p) => p.neighborhood)).size;
    return { available, totalAcres, totalValue, neighborhoods };
  }, [properties]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {
          label: "Available",
          value: stats.available.toString(),
          sub: `of ${properties.length} total`,
          icon: LandPlot,
          color: "text-green-600 dark:text-green-400",
        },
        {
          label: "Total Acreage",
          value: stats.totalAcres.toFixed(0),
          sub: "acres",
          icon: Trees,
          color: "text-emerald-600 dark:text-emerald-400",
        },
        {
          label: "Appraised Value",
          value: formatCurrency(stats.totalValue),
          sub: "combined",
          icon: DollarSign,
          color: "text-amber-600 dark:text-amber-400",
        },
        {
          label: "Neighborhoods",
          value: stats.neighborhoods.toString(),
          sub: "areas",
          icon: Building2,
          color: "text-blue-600 dark:text-blue-400",
        },
      ].map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <stat.icon className={`size-3.5 ${stat.color}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

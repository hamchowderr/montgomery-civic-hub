"use client";

import { Building2, GraduationCap, Library, TreePine, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureCount, queryTotalStats } from "@/lib/arcgis-client";

import { type CityMetric, GOLD } from "./types";

export function MontgomeryToday() {
  const [metrics, setMetrics] = useState<CityMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [popStats, neighborhoods, centers, libraries, schools] = await Promise.all([
          queryTotalStats({
            url: ARCGIS_URLS.censusBlock,
            statistics: [{ field: "P1_001N", type: "sum", alias: "totalPop" }],
          }),
          queryFeatureCount(ARCGIS_URLS.neighborhoods),
          queryFeatureCount(ARCGIS_URLS.communityCenters),
          queryFeatureCount(ARCGIS_URLS.libraries),
          queryFeatureCount(ARCGIS_URLS.educationFacilities),
        ]);

        if (cancelled) return;

        setMetrics([
          {
            label: "Total Population",
            value: popStats.totalPop ?? null,
            icon: <Users className="size-5" />,
          },
          {
            label: "Neighborhoods",
            value: neighborhoods,
            icon: <TreePine className="size-5" />,
          },
          {
            label: "Community Centers",
            value: centers,
            icon: <Building2 className="size-5" />,
          },
          {
            label: "Libraries",
            value: libraries,
            icon: <Library className="size-5" />,
          },
          {
            label: "Schools",
            value: schools,
            icon: <GraduationCap className="size-5" />,
          },
        ]);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h3 className="text-base font-semibold mb-3" style={{ color: GOLD }}>
        Montgomery Today
      </h3>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <Card key={m.label} className="text-center">
              <CardContent className="flex flex-col items-center gap-2 py-4 px-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                >
                  {m.icon}
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {m.value !== null ? m.value.toLocaleString() : "\u2014"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

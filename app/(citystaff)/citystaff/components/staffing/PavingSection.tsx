"use client";

import { Construction, MapPin, TrendingUp, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureStats, queryTotalStats } from "@/lib/arcgis-client";
import {
  COLORS,
  type PavingDistrictData,
  type PavingStatusData,
  type PavingTotals,
  PIE_COLORS,
} from "./types";
import { formatCurrency, formatMiles, formatTons } from "./utils";

export function PavingSection() {
  const [districtData, setDistrictData] = useState<PavingDistrictData[]>([]);
  const [statusData, setStatusData] = useState<PavingStatusData[]>([]);
  const [totals, setTotals] = useState<PavingTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [byDistrict, byStatus, totalStats] = await Promise.all([
          queryFeatureStats({
            url: ARCGIS_URLS.pavingProject,
            groupByField: "DistrictDesc",
            statisticField: "OBJECTID",
          }),
          queryFeatureStats({
            url: ARCGIS_URLS.pavingProject,
            groupByField: "Status",
            statisticField: "OBJECTID",
          }),
          queryTotalStats({
            url: ARCGIS_URLS.pavingProject,
            statistics: [
              { field: "Length_Miles", type: "sum", alias: "totalMiles" },
              { field: "AsphaltEst", type: "sum", alias: "totalCost" },
              { field: "EstTons", type: "sum", alias: "totalTons" },
              { field: "OBJECTID", type: "count", alias: "totalProjects" },
            ],
          }),
        ]);
        if (cancelled) return;

        setDistrictData(
          byDistrict
            .filter((d) => d.group && d.group !== "Unknown" && d.group !== "null")
            .sort((a, b) => b.value - a.value)
            .map((d) => ({ district: d.group, count: d.value })),
        );

        setStatusData(
          byStatus
            .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
            .sort((a, b) => b.value - a.value)
            .map((s) => ({ status: s.group, count: s.value })),
        );

        setTotals({
          totalMiles: totalStats.totalMiles || 0,
          totalCost: totalStats.totalCost || 0,
          totalTons: totalStats.totalTons || 0,
          totalProjects: totalStats.totalProjects || 0,
        });
      } catch {
        setDistrictData([]);
        setStatusData([]);
        setTotals(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Construction className="h-4 w-4 text-muted-foreground" />
            Paving & Infrastructure
          </CardTitle>
          <CardDescription>Loading paving project data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Construction className="h-4 w-4 text-muted-foreground" />
          Paving & Infrastructure
        </CardTitle>
        <CardDescription>Paving project summary across all districts and statuses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary stat cards */}
        {totals && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <MapPin className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">
                {totals.totalProjects.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Truck className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">{formatMiles(totals.totalMiles)}</p>
              <p className="text-xs text-muted-foreground">Total Miles</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.totalCost)}</p>
              <p className="text-xs text-muted-foreground">Asphalt Cost</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Construction className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold tabular-nums">{formatTons(totals.totalTons)}</p>
              <p className="text-xs text-muted-foreground">Est. Tons</p>
            </div>
          </div>
        )}

        {/* Charts side by side */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Paving by District */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Projects by District</h4>
            {districtData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No district data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={districtData} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="district"
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                          <p className="font-medium">{label}</p>
                          <p>Projects: {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="Projects" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Paving by Status */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Projects by Status</h4>
            {statusData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No status data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                          <p className="font-medium">{label}</p>
                          <p>Projects: {Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="Projects" fill={COLORS.green} radius={[4, 4, 0, 0]}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

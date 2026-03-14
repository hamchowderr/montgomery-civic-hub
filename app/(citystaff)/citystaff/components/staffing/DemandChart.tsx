"use client";

import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureStats } from "@/lib/arcgis-client";
import { COLORS, type DemandData } from "./types";
import { normalizeDistrict } from "./utils";

export function DemandChart() {
  const [data, setData] = useState<DemandData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [requestStats, violationStats] = await Promise.all([
          queryFeatureStats({
            url: ARCGIS_URLS.serviceRequests311,
            groupByField: "District",
            statisticField: "OBJECTID",
          }),
          queryFeatureStats({
            url: ARCGIS_URLS.codeViolations,
            groupByField: "CouncilDistrict",
            statisticField: "OffenceNum",
          }),
        ]);
        if (cancelled) return;

        const requestMap = new Map<string, number>();
        for (const r of requestStats) {
          const d = normalizeDistrict(r.group);
          if (d) requestMap.set(d, (requestMap.get(d) || 0) + r.value);
        }

        const violationMap = new Map<string, number>();
        for (const v of violationStats) {
          const d = normalizeDistrict(v.group);
          if (d) violationMap.set(d, (violationMap.get(d) || 0) + v.value);
        }

        const allDistricts = new Set([...requestMap.keys(), ...violationMap.keys()]);
        const merged: DemandData[] = Array.from(allDistricts)
          .sort((a, b) => Number(a) - Number(b))
          .map((d) => ({
            district: `D${d}`,
            requests311: requestMap.get(d) || 0,
            codeViolations: violationMap.get(d) || 0,
          }));

        setData(merged);
      } catch {
        setData([]);
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
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Demand vs Capacity by District
        </CardTitle>
        <CardDescription>
          311 service requests and code violations per council district. Higher volumes indicate
          greater service demand relative to officer coverage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            No demand data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="district" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                      <p className="font-medium mb-1">{label}</p>
                      {payload.map((entry) => (
                        <p key={entry.dataKey as string} style={{ color: entry.color }}>
                          {entry.name}: {Number(entry.value).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar
                dataKey="requests311"
                name="311 Requests"
                fill={COLORS.blue}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="codeViolations"
                name="Code Violations"
                fill={COLORS.orange}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

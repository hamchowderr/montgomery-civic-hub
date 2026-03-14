"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureStats } from "@/lib/arcgis-client";
import { PIE_COLORS, type ViolationTypeData } from "./types";

export function ViolationsChart() {
  const [data, setData] = useState<ViolationTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const stats = await queryFeatureStats({
          url: ARCGIS_URLS.codeViolations,
          groupByField: "CaseType",
          statisticField: "OffenceNum",
        });
        if (cancelled) return;

        const sorted = stats
          .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
          .sort((a, b) => b.value - a.value)
          .map((s) => ({ type: s.group, count: s.value }));

        setData(sorted);
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

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Code Violations by Type</CardTitle>
        <CardDescription>
          Distribution of violation categories ({total.toLocaleString()} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
            No violation data available.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ type, percent }) =>
                    `${type.length > 15 ? `${type.slice(0, 15)}...` : type} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0];
                    const pct = total > 0 ? ((Number(entry.value) / total) * 100).toFixed(1) : "0";
                    return (
                      <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                        <p className="font-medium">{entry.name}</p>
                        <p>
                          Count: {Number(entry.value).toLocaleString()} ({pct}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend below chart */}
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {data.map((d, i) => (
                <div key={d.type} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground truncate max-w-[120px]">{d.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

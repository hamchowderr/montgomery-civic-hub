"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ARCGIS_URLS, queryFeatureStats } from "@/lib/arcgis-client";
import { COLORS, type RequestTypeData } from "./types";

export function RequestTypeChart() {
  const [data, setData] = useState<RequestTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const stats = await queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "Request_Type",
          statisticField: "OBJECTID",
        });
        if (cancelled) return;

        const sorted = stats
          .filter((s) => s.group && s.group !== "Unknown" && s.group !== "null")
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top 10 Request Types</CardTitle>
        <CardDescription>Most common 311 service request categories</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
            No request type data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 10 }}
                width={140}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                      <p className="font-medium">{label}</p>
                      <p>Count: {Number(payload[0].value).toLocaleString()}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name="Requests" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

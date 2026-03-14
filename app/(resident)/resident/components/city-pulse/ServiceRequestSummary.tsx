"use client";

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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceRequestSummaryData } from "./types";

interface ServiceRequestSummaryProps {
  data: ServiceRequestSummaryData[];
  isLoading: boolean;
}

/** Color bars by volume: top third red, middle amber, bottom green */
function getBarColor(count: number, data: ServiceRequestSummaryData[]): string {
  if (data.length === 0) return "hsl(24 95% 53%)";
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const highThreshold = sorted[Math.floor(sorted.length / 3)]?.count ?? count;
  const lowThreshold = sorted[Math.floor((sorted.length * 2) / 3)]?.count ?? 0;

  if (count >= highThreshold) return "hsl(0 72% 51%)"; // red
  if (count >= lowThreshold) return "hsl(38 92% 50%)"; // amber
  return "hsl(142 71% 45%)"; // green
}

export function ServiceRequestSummary({ data, isLoading }: ServiceRequestSummaryProps) {
  const totalRequests = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">311 Service Requests by District</CardTitle>
            <CardDescription>
              Service requests across Montgomery council districts — a snapshot of community needs
            </CardDescription>
          </div>
          {!isLoading && totalRequests > 0 && (
            <Badge variant="secondary" className="h-6 text-xs tabular-nums">
              {totalRequests.toLocaleString()} total
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No 311 request data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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
                      <p className="font-medium">{label}</p>
                      <p>{Number(payload[0].value).toLocaleString()} requests</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name="311 Requests" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.district} fill={getBarColor(entry.count, data)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

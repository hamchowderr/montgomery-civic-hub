"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SourceBreakdownProps {
  data: { source: string; count: number }[];
  isLoading: boolean;
}

/** Gradient stops for source bars — from primary blue to lighter teal */
const GRADIENT_ID = "sourceBarGradient";

export function SourceBreakdown({ data, isLoading }: SourceBreakdownProps) {
  const displayData = data.slice(0, 10);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Source Breakdown</CardTitle>
        <CardDescription>Articles by source domain</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : displayData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No source data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, displayData.length * 36)}>
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="hsl(190 90% 50%)" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="source"
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
                      <p>
                        {Number(payload[0].value).toLocaleString()} article
                        {Number(payload[0].value) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                name="Articles"
                fill={`url(#${GRADIENT_ID})`}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

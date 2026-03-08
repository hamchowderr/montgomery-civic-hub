"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartData } from "@/lib/hooks/use-chart-data";

const DEFAULT_BUDGET_DATA = [
  { department: "Public Safety", budget: 48.2 },
  { department: "Public Works", budget: 32.5 },
  { department: "Parks & Rec", budget: 14.8 },
  { department: "Administration", budget: 21.3 },
  { department: "Utilities", budget: 27.6 },
];

function SkeletonBars() {
  return (
    <div className="flex h-[440px] w-full items-end justify-around gap-4 px-10 pb-16 pt-4">
      {[0.65, 0.45, 0.3, 0.4, 0.55].map((h, i) => (
        <div
          key={i}
          className="w-12 animate-pulse rounded-t bg-muted"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

export function CityStaffChart() {
  const { data, isLoading } = useChartData("budget");

  const chartData = data ?? DEFAULT_BUDGET_DATA;
  const isSampleData = !data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Budget by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonBars />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-tour-step-id="citystaff-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Budget by Department
          {isSampleData && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (sample data)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[440px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                label={{
                  value: "$ Millions",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
                formatter={(value: number) => [`$${value}M`, "Budget"]}
              />
              <Bar
                dataKey="budget"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

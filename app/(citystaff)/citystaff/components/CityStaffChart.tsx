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

const budgetData = [
  { department: "Public Safety", budget: 48.2 },
  { department: "Public Works", budget: 32.5 },
  { department: "Parks & Rec", budget: 14.8 },
  { department: "Administration", budget: 21.3 },
  { department: "Utilities", budget: 27.6 },
];

export function CityStaffChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Budget by Department</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[440px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={budgetData}
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

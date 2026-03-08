"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const crimeTrendData = [
  { year: "2018", propertyCrime: 4820, violentCrime: 1950 },
  { year: "2019", propertyCrime: 4650, violentCrime: 2010 },
  { year: "2020", propertyCrime: 4210, violentCrime: 2280 },
  { year: "2021", propertyCrime: 4580, violentCrime: 2150 },
  { year: "2022", propertyCrime: 4390, violentCrime: 2320 },
  { year: "2023", propertyCrime: 4150, violentCrime: 2080 },
  { year: "2024", propertyCrime: 3920, violentCrime: 1890 },
];

export function ResearcherChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Crime Trends (2018-2024)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[440px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={crimeTrendData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="propertyCrime"
                name="Property Crime"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="violentCrime"
                name="Violent Crime"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

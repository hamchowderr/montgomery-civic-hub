"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DISTRICT_COVERAGE, TARGET_PER_DISTRICT } from "./types";
import { getBarColor } from "./utils";

export function DistrictCoverage() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">District Coverage</CardTitle>
        <CardDescription>
          Officer count per district vs. target of {TARGET_PER_DISTRICT}. Districts below target are
          color-coded by severity. <span className="text-[10px]">Source: Bright Data</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={DISTRICT_COVERAGE} margin={{ top: 8, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="district" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const current = payload.find((p) => p.dataKey === "current")?.value as number;
                const target = payload.find((p) => p.dataKey === "target")?.value as number;
                const deficit = target - current;
                return (
                  <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                    <p className="font-medium">{label}</p>
                    <p>Current: {current}</p>
                    <p>Target: {target}</p>
                    {deficit > 0 && <p className="text-red-500 font-medium">Deficit: -{deficit}</p>}
                  </div>
                );
              }}
            />
            <Legend />
            <ReferenceLine
              y={TARGET_PER_DISTRICT}
              stroke="hsl(221 83% 53%)"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{
                value: `Target (${TARGET_PER_DISTRICT})`,
                position: "right",
                fontSize: 11,
                fill: "hsl(221 83% 53%)",
              }}
            />
            <Bar dataKey="current" name="Current Officers" radius={[4, 4, 0, 0]}>
              {DISTRICT_COVERAGE.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.current)} />
              ))}
            </Bar>
            <Bar
              dataKey="target"
              name="Target"
              fill="hsl(221 83% 53% / 0.15)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

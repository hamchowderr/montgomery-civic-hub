"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { VacantProperty, ZoningCategory } from "./types";
import { ZONING_HEX_COLORS } from "./types";
import { classifyZoning } from "./utils";

export function ZoningChart({ properties }: { properties: VacantProperty[] }) {
  const data = useMemo(() => {
    const counts = new Map<ZoningCategory, number>();
    for (const p of properties) {
      const cat = classifyZoning(p.zoning);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value, fill: ZONING_HEX_COLORS[name] }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Zoning Distribution</h3>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} properties`, name]}
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="shrink-0 space-y-1.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium tabular-nums ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

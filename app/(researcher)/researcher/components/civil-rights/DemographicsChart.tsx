"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartErrorState,
  PieLegendContent,
  renderPieLabel,
  SkeletonBars,
} from "@/components/chart-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartData } from "@/lib/hooks/use-chart-data";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
];

const censusChartConfig = {
  value: { label: "Population", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const householdChartConfig = {
  value: { label: "Households", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export function DemographicsChart() {
  const census = useChartData("censusData");
  const household = useChartData("householdData");

  useCopilotReadable({
    description: "Montgomery demographics racial breakdown from 2020 Census",
    value: census.data && census.data.length > 0 ? census.data : "Loading demographics...",
  });

  const totalPop = census.data?.reduce((sum, s) => sum + (s.value ?? 0), 0) ?? 0;

  if (census.isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Montgomery Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonBars />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 @[700px]:grid-cols-2">
      {/* Donut: Racial Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Population by Race</CardTitle>
          <CardDescription>
            2020 Census racial breakdown &middot; {totalPop.toLocaleString()} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!census.data ? (
            <ChartErrorState message="Could not load census data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={censusChartConfig} className="mx-auto h-[350px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                <Pie
                  data={census.data}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {census.data.map((_: unknown, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<PieLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Donut: Household Occupancy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Household Occupancy</CardTitle>
          <CardDescription>Occupied vs. vacant households from 2020 Census</CardDescription>
        </CardHeader>
        <CardContent>
          {household.isLoading ? (
            <SkeletonBars />
          ) : !household.data ? (
            <ChartErrorState message="Could not load household data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={householdChartConfig} className="mx-auto h-[350px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                <Pie
                  data={household.data}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {household.data.map((_: unknown, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<PieLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

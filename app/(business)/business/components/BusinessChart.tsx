"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
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
  ChartLegendContent,
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
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
];

const permitChartConfig = {
  permits: { label: "Permits Issued", color: "hsl(var(--chart-2))" },
  cost: { label: "Est. Cost ($M)", color: "hsl(var(--chart-6))" },
} satisfies ChartConfig;

const propertyChartConfig = {
  count: { label: "Properties", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const licensesByCategoryConfig = {
  count: { label: "Licenses", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const permitStatusConfig = {
  count: { label: "Permits", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const licensesByYearConfig = {
  count: { label: "Licenses", color: "hsl(var(--chart-8))" },
} satisfies ChartConfig;

export function BusinessChart() {
  const permits = useChartData("permitActivity");
  const properties = useChartData("cityOwnedProperties");
  const licensesByCategory = useChartData("licensesByCategory");
  const permitStatus = useChartData("permitStatusBreakdown");
  const licensesByYear = useChartData("licensesByYear");

  const chartData =
    permits.data?.map((d: any) => ({
      year: d.year,
      permits: d.permits,
      cost: Math.round((d.cost / 1_000_000) * 10) / 10,
    })) ?? null;

  if (permits.isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Permit Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonBars />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 @[700px]:grid-cols-2">
      {/* Line: Permit Activity Over Time (dual axis) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permit Activity Over Time</CardTitle>
          <CardDescription>
            Construction permits issued and estimated project costs by year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!chartData ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={permitChartConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ top: 8, right: 50, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Permits",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Cost ($M)",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="permits"
                  stroke="var(--color-permits)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-permits)" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-cost)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-cost)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Donut: City-Owned Properties by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">City-Owned Properties by Type</CardTitle>
          <CardDescription>
            Vacant and city-owned property inventory by classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {properties.isLoading ? (
            <SkeletonBars />
          ) : !properties.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={propertyChartConfig} className="mx-auto h-[350px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
                <Pie
                  data={properties.data}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {properties.data.map((_: unknown, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<PieLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Horizontal Bar: Top Business License Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Business License Categories</CardTitle>
          <CardDescription>
            Top 10 business license categories by number of active licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {licensesByCategory.isLoading ? (
            <SkeletonBars />
          ) : !licensesByCategory.data ? (
            <ChartErrorState message="Could not load license category data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={licensesByCategoryConfig} className="h-[350px] w-full">
              <BarChart
                data={licensesByCategory.data}
                layout="vertical"
                margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="licenseCatGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10 }}
                  width={160}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 20)}…` : v)}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="url(#licenseCatGrad)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Donut: Permits by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permits by Status</CardTitle>
          <CardDescription>
            Breakdown of construction permits by current processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permitStatus.isLoading ? (
            <SkeletonBars />
          ) : !permitStatus.data ? (
            <ChartErrorState message="Could not load permit status data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={permitStatusConfig} className="mx-auto h-[350px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                <Pie
                  data={permitStatus.data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {permitStatus.data.map((_: unknown, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<PieLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Area: Business Licenses by Year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Licenses by Year</CardTitle>
          <CardDescription>Number of business licenses issued per year</CardDescription>
        </CardHeader>
        <CardContent>
          {licensesByYear.isLoading ? (
            <SkeletonBars />
          ) : !licensesByYear.data ? (
            <ChartErrorState message="Could not load license year data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={licensesByYearConfig} className="h-[300px] w-full">
              <AreaChart
                data={licensesByYear.data}
                margin={{ top: 8, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="licenseYearFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={2.5}
                  fill="url(#licenseYearFill)"
                  dot={{ r: 4, fill: "var(--color-count)" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

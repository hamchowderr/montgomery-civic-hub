"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
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
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
];

const chartConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const transportationChartConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const statusChartConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const districtChartConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-8))" },
} satisfies ChartConfig;

const facilityChartConfig = {
  count: { label: "Facilities", color: "hsl(var(--chart-7))" },
} satisfies ChartConfig;

const violationsStatusConfig = {
  count: { label: "Violations", color: "hsl(var(--chart-10))" },
} satisfies ChartConfig;

export function ResidentChart() {
  const serviceRequests = useChartData("serviceRequests");
  const transportation = useChartData("transportationRequests");
  const requestsByStatus = useChartData("requestsByStatus");
  const requestsByDistrict = useChartData("requestsByDistrict");
  const facilityCounts = useChartData("facilityCounts");
  const violationsByStatus = useChartData("violationsByStatus");

  if (serviceRequests.isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service Requests by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonBars />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 @[700px]:grid-cols-2">
      {/* Bar: Service Requests by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Requests by Type</CardTitle>
          <CardDescription>Top 311 service request categories</CardDescription>
        </CardHeader>
        <CardContent>
          {!serviceRequests.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={serviceRequests.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="serviceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="url(#serviceGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar: Transportation Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transportation & Road Requests</CardTitle>
          <CardDescription>
            Road, traffic, pothole, and transit-related service requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transportation.isLoading ? (
            <SkeletonBars />
          ) : !transportation.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={transportationChartConfig} className="h-[300px] w-full">
              <BarChart
                data={transportation.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="transportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="url(#transportGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Donut: 311 Requests by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">311 Requests by Status</CardTitle>
          <CardDescription>Current status breakdown of all 311 service requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requestsByStatus.isLoading ? (
            <SkeletonBars />
          ) : !requestsByStatus.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={statusChartConfig} className="mx-auto h-[350px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                <Pie
                  data={requestsByStatus.data}
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
                  {requestsByStatus.data.map((_: unknown, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<PieLegendContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar: 311 Requests by District */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">311 Requests by Council District</CardTitle>
          <CardDescription>
            Distribution of 311 service requests across council districts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requestsByDistrict.isLoading ? (
            <SkeletonBars />
          ) : !requestsByDistrict.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={districtChartConfig} className="h-[300px] w-full">
              <BarChart
                data={requestsByDistrict.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="districtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="district"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="url(#districtGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Horizontal Bar: Community Facilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Community Facilities by Type</CardTitle>
          <CardDescription>
            Count of community facilities across Montgomery by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facilityCounts.isLoading ? (
            <SkeletonBars />
          ) : !facilityCounts.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer config={facilityChartConfig} className="h-[300px] w-full">
              <BarChart
                data={facilityCounts.data}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 80, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="facilityGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="facility"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="url(#facilityGrad)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Donut: Code Violations by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code Violations by Status</CardTitle>
          <CardDescription>Case status breakdown for reported code violations</CardDescription>
        </CardHeader>
        <CardContent>
          {violationsByStatus.isLoading ? (
            <SkeletonBars />
          ) : !violationsByStatus.data ? (
            <ChartErrorState message="Could not load code violations data." />
          ) : (
            <ChartContainer config={violationsStatusConfig} className="mx-auto h-[350px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                <Pie
                  data={violationsByStatus.data}
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
                  {violationsByStatus.data.map((_: unknown, i: number) => (
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

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useChartData } from "@/lib/hooks/use-chart-data";
import { SkeletonBars, ChartErrorState } from "@/components/chart-helpers";

const chartConfig = {
  count: {
    label: "Requests",
    color: "hsl(221 83% 53%)",
  },
} satisfies ChartConfig;

const transportationChartConfig = {
  count: {
    label: "Requests",
    color: "hsl(262 83% 58%)",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  count: {
    label: "Requests",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig;

const districtChartConfig = {
  count: {
    label: "Requests",
    color: "hsl(234 89% 74%)",
  },
} satisfies ChartConfig;

const facilityChartConfig = {
  count: {
    label: "Facilities",
    color: "hsl(173 80% 40%)",
  },
} satisfies ChartConfig;

const violationsStatusConfig = {
  count: {
    label: "Violations",
    color: "hsl(0 72% 51%)",
  },
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Requests by Type</CardTitle>
          <CardDescription>
            Top 311 service request categories for 2024
          </CardDescription>
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
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.5}
                    />
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
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#serviceGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Transportation & Road Requests
          </CardTitle>
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
            <ChartContainer
              config={transportationChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={transportation.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient
                    id="transportGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.5}
                    />
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
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#transportGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">311 Requests by Status</CardTitle>
          <CardDescription>
            Current status breakdown of all 311 service requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requestsByStatus.isLoading ? (
            <SkeletonBars />
          ) : !requestsByStatus.data ? (
            <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer
              config={statusChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={requestsByStatus.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="statusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.5}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#statusGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            311 Requests by Council District
          </CardTitle>
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
            <ChartContainer
              config={districtChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={requestsByDistrict.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="districtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.5}
                    />
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
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#districtGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Community Facilities by Type
          </CardTitle>
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
            <ChartContainer
              config={facilityChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={facilityCounts.data}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 80, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="facilityGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
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
                <Bar
                  dataKey="count"
                  fill="url(#facilityGrad)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code Violations by Status</CardTitle>
          <CardDescription>
            Case status breakdown for reported code violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {violationsByStatus.isLoading ? (
            <SkeletonBars />
          ) : !violationsByStatus.data ? (
            <ChartErrorState message="Could not load code violations data." />
          ) : (
            <ChartContainer
              config={violationsStatusConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={violationsByStatus.data}
                margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
              >
                <defs>
                  <linearGradient
                    id="violationsStatusGradResident"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.5}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#violationsStatusGradResident)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

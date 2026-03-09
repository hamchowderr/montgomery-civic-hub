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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useChartData } from "@/lib/hooks/use-chart-data";
import { SkeletonBars, ChartErrorState } from "@/components/chart-helpers";

const chartConfig = {
  count: {
    label: "Requests",
    color: "hsl(173 80% 40%)",
  },
} satisfies ChartConfig;

const violationsConfig = {
  count: {
    label: "Violations",
    color: "hsl(0 72% 51%)",
  },
} satisfies ChartConfig;

const permitsConfig = {
  count: {
    label: "Permits",
    color: "hsl(45 93% 47%)",
  },
} satisfies ChartConfig;

const districtConfig = {
  requests: {
    label: "311 Requests",
    color: "hsl(221 83% 53%)",
  },
  violations: {
    label: "Code Violations",
    color: "hsl(0 72% 51%)",
  },
} satisfies ChartConfig;

const censusConfig = {
  value: {
    label: "Population",
    color: "hsl(173 80% 40%)",
  },
} satisfies ChartConfig;

const licensesConfig = {
  count: {
    label: "Licenses",
    color: "hsl(199 89% 48%)",
  },
} satisfies ChartConfig;

const nuisanceConfig = {
  count: {
    label: "Complaints",
    color: "hsl(292 91% 73%)",
  },
} satisfies ChartConfig;

export function ResearcherChart() {
  const { data, isLoading } = useChartData("crimeTrends");
  const { data: violationsData, isLoading: violationsLoading } =
    useChartData("violationsByYear");
  const { data: permitsData, isLoading: permitsLoading } =
    useChartData("permitsByYear");
  const { data: districtData, isLoading: districtLoading } =
    useChartData("districtComparison");
  const { data: censusData, isLoading: censusLoading } =
    useChartData("censusData");
  const { data: licensesData, isLoading: licensesLoading } =
    useChartData("licensesByYear");
  const { data: nuisanceData, isLoading: nuisanceLoading } =
    useChartData("nuisanceByType");

  return (
    <div className="flex flex-col gap-6">
      {/* Chart 1: 311 Requests by Year (existing) */}
      {isLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">311 Requests by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card data-tour-step-id="researcher-chart">
          <CardHeader>
            <CardTitle className="text-base">311 Requests by Year</CardTitle>
            <CardDescription>
              Annual 311 service request volume (2021 onwards)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data ? (
              <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="researchGrad"
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
                    dataKey="year"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#researchGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 2: Code Violations by Year */}
      {violationsLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Code Violations by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Code Violations by Year</CardTitle>
            <CardDescription>
              Annual code enforcement violations reported across Montgomery
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!violationsData ? (
              <ChartErrorState message="Could not load violations data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer
                config={violationsConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={violationsData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="violationsGrad"
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
                    dataKey="year"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#violationsGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 3: Construction Permits by Year */}
      {permitsLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Construction Permits by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Construction Permits by Year
            </CardTitle>
            <CardDescription>
              Annual construction permits issued in Montgomery
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!permitsData ? (
              <ChartErrorState message="Could not load permits data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer
                config={permitsConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={permitsData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="permitsGrad"
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
                    dataKey="year"
                    tick={{ fontSize: 12 }}
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
                    fill="url(#permitsGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 4: 311 Requests vs Code Violations by District */}
      {districtLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              311 Requests vs Code Violations by District
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              311 Requests vs Code Violations by District
            </CardTitle>
            <CardDescription>
              Side-by-side comparison of 311 requests and code violations across
              council districts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!districtData ? (
              <ChartErrorState message="Could not load district comparison data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer
                config={districtConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={districtData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="district"
                    tick={{ fontSize: 12 }}
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
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="requests"
                    fill="var(--color-requests)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="violations"
                    fill="var(--color-violations)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 5: 2020 Census — Population by Race */}
      {censusLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              2020 Census — Population by Race
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              2020 Census — Population by Race
            </CardTitle>
            <CardDescription>
              Montgomery city-level population breakdown from 2020 Census
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!censusData ? (
              <ChartErrorState message="Could not load census data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer
                config={censusConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={censusData}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="censusGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop
                        offset="0%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.5}
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
                    dataKey="category"
                    width={160}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#censusGrad)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 6: Business Licenses by Year */}
      {licensesLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Business Licenses by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Business Licenses by Year
            </CardTitle>
            <CardDescription>
              Annual business license issuances in Montgomery
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!licensesData ? (
              <ChartErrorState message="Could not load business licenses data." />
            ) : (
              <ChartContainer
                config={licensesConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={licensesData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="licensesByYearResearcherGrad"
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
                    dataKey="year"
                    tick={{ fontSize: 12 }}
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
                    fill="url(#licensesByYearResearcherGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 7: Nuisance Complaints by Type */}
      {nuisanceLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Nuisance Complaints by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Nuisance Complaints by Type
            </CardTitle>
            <CardDescription>Top nuisance complaint categories</CardDescription>
          </CardHeader>
          <CardContent>
            {!nuisanceData ? (
              <ChartErrorState message="Could not load nuisance complaints data." />
            ) : (
              <ChartContainer
                config={nuisanceConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={nuisanceData}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="nuisanceByTypeResearcherGrad"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
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
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: 11 }}
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#nuisanceByTypeResearcherGrad)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

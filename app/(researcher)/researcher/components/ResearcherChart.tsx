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

const chartConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-7))" },
} satisfies ChartConfig;

const violationsConfig = {
  count: { label: "Violations", color: "hsl(var(--chart-10))" },
} satisfies ChartConfig;

const permitsConfig = {
  count: { label: "Permits", color: "hsl(var(--chart-6))" },
} satisfies ChartConfig;

const districtConfig = {
  requests: { label: "311 Requests", color: "hsl(var(--chart-1))" },
  violations: { label: "Code Violations", color: "hsl(var(--chart-10))" },
} satisfies ChartConfig;

const censusConfig = {
  value: { label: "Population", color: "hsl(var(--chart-7))" },
} satisfies ChartConfig;

const licensesConfig = {
  count: { label: "Licenses", color: "hsl(var(--chart-8))" },
} satisfies ChartConfig;

const nuisanceConfig = {
  count: { label: "Complaints", color: "hsl(var(--chart-9))" },
} satisfies ChartConfig;

const householdConfig = {
  value: { label: "Households", color: "hsl(var(--chart-6))" },
} satisfies ChartConfig;

export function ResearcherChart() {
  const { data, isLoading } = useChartData("crimeTrends");
  const { data: violationsData, isLoading: violationsLoading } = useChartData("violationsByYear");
  const { data: permitsData, isLoading: permitsLoading } = useChartData("permitsByYear");
  const { data: districtData, isLoading: districtLoading } = useChartData("districtComparison");
  const { data: censusData, isLoading: censusLoading } = useChartData("censusData");
  const { data: licensesData, isLoading: licensesLoading } = useChartData("licensesByYear");
  const { data: nuisanceData, isLoading: nuisanceLoading } = useChartData("nuisanceByType");
  const { data: householdData, isLoading: householdLoading } = useChartData("householdData");

  return (
    <div className="grid grid-cols-1 gap-4 @[700px]:grid-cols-2">
      {/* Line: 311 Requests by Year */}
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
            <CardDescription>Annual 311 service request volume (2021 onwards)</CardDescription>
          </CardHeader>
          <CardContent>
            {!data ? (
              <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-count)" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line: Code Violations by Year */}
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
              <ChartContainer config={violationsConfig} className="h-[300px] w-full">
                <LineChart data={violationsData} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-count)" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Area: Construction Permits by Year */}
      {permitsLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Construction Permits by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Construction Permits by Year</CardTitle>
            <CardDescription>Annual construction permits issued in Montgomery</CardDescription>
          </CardHeader>
          <CardContent>
            {!permitsData ? (
              <ChartErrorState message="Could not load permits data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer config={permitsConfig} className="h-[300px] w-full">
                <AreaChart data={permitsData} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="permitsAreaFill" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#permitsAreaFill)"
                    dot={{ r: 4, fill: "var(--color-count)" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouped Bar: District Comparison */}
      {districtLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">311 Requests vs Code Violations by District</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">311 Requests vs Code Violations by District</CardTitle>
            <CardDescription>
              Side-by-side comparison of 311 requests and code violations across council districts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!districtData ? (
              <ChartErrorState message="Could not load district comparison data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer config={districtConfig} className="h-[300px] w-full">
                <BarChart data={districtData} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="district"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="requests" fill="var(--color-requests)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="violations" fill="var(--color-violations)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Donut: 2020 Census Population by Race */}
      {censusLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">2020 Census — Population by Race</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2020 Census — Population by Race</CardTitle>
            <CardDescription>
              Montgomery city-level population breakdown from 2020 Census
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!censusData ? (
              <ChartErrorState message="Could not load census data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer config={censusConfig} className="mx-auto h-[350px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                  <Pie
                    data={censusData}
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
                    {censusData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<PieLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Area: Business Licenses by Year */}
      {licensesLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Business Licenses by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Licenses by Year</CardTitle>
            <CardDescription>Annual business license issuances in Montgomery</CardDescription>
          </CardHeader>
          <CardContent>
            {!licensesData ? (
              <ChartErrorState message="Could not load business licenses data." />
            ) : (
              <ChartContainer config={licensesConfig} className="h-[300px] w-full">
                <AreaChart data={licensesData} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="licensesByYearResearcherFill" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#licensesByYearResearcherFill)"
                    dot={{ r: 4, fill: "var(--color-count)" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Horizontal Bar: Nuisance Complaints by Type */}
      {nuisanceLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nuisance Complaints by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuisance Complaints by Type</CardTitle>
            <CardDescription>Top nuisance complaint categories</CardDescription>
          </CardHeader>
          <CardContent>
            {!nuisanceData ? (
              <ChartErrorState message="Could not load nuisance complaints data." />
            ) : (
              <ChartContainer config={nuisanceConfig} className="h-[300px] w-full">
                <BarChart
                  data={nuisanceData}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="nuisanceByTypeResearcherGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
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

      {/* Donut: Household Occupancy (Occupied vs Vacant) */}
      {householdLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Household Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Household Occupancy</CardTitle>
            <CardDescription>Occupied vs vacant households from 2020 Census data</CardDescription>
          </CardHeader>
          <CardContent>
            {!householdData ? (
              <ChartErrorState message="Could not load household data." />
            ) : (
              <ChartContainer config={householdConfig} className="mx-auto h-[350px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                  <Pie
                    data={householdData}
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
                    {householdData.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<PieLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

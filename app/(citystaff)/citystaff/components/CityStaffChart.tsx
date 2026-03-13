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
  budget: { label: "Spending", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const violationsByStatusConfig = {
  count: { label: "Violations", color: "hsl(var(--chart-10))" },
} satisfies ChartConfig;

const violationsByDistrictConfig = {
  count: { label: "Violations", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const pavingByStatusConfig = {
  count: { label: "Projects", color: "hsl(var(--chart-6))" },
} satisfies ChartConfig;

const nuisanceByTypeConfig = {
  count: { label: "Complaints", color: "hsl(var(--chart-9))" },
} satisfies ChartConfig;

const serviceRequestsConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export function CityStaffChart() {
  const { data, isLoading } = useChartData("budget");
  const { data: violationsByStatusData, isLoading: violationsByStatusLoading } =
    useChartData("violationsByStatus");
  const { data: violationsByDistrictData, isLoading: violationsByDistrictLoading } =
    useChartData("violationsByDistrict");
  const { data: pavingByStatusData, isLoading: pavingByStatusLoading } =
    useChartData("pavingByStatus");
  const { data: nuisanceByTypeData, isLoading: nuisanceByTypeLoading } =
    useChartData("nuisanceByType");
  const { data: serviceRequestsData, isLoading: serviceRequestsLoading } =
    useChartData("serviceRequests");

  return (
    <div className="grid grid-cols-1 gap-4 @[700px]:grid-cols-2">
      {/* Horizontal Bar: Permit Spending by District */}
      {isLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Permit Spending by District</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card data-tour-step-id="citystaff-chart">
          <CardHeader>
            <CardTitle className="text-base">Permit Spending by District</CardTitle>
            <CardDescription>
              Total estimated construction permit costs by council district (2023+)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data ? (
              <ChartErrorState message="Could not load data. Check your connection or try refreshing." />
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="budgetGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--color-budget)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-budget)" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => `$${v}M`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fontSize: 11 }}
                    width={100}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="budget" fill="url(#budgetGrad)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Donut: Code Violations by Status */}
      {violationsByStatusLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Code Violations by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Code Violations by Status</CardTitle>
            <CardDescription>Case status distribution for reported violations</CardDescription>
          </CardHeader>
          <CardContent>
            {!violationsByStatusData ? (
              <ChartErrorState message="Could not load violations by status data." />
            ) : (
              <ChartContainer
                config={violationsByStatusConfig}
                className="mx-auto h-[350px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                  <Pie
                    data={violationsByStatusData}
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
                    {violationsByStatusData.map((_: unknown, i: number) => (
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

      {/* Bar: Code Violations by District */}
      {violationsByDistrictLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Code Violations by District</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Code Violations by District</CardTitle>
            <CardDescription>Violations per council district</CardDescription>
          </CardHeader>
          <CardContent>
            {!violationsByDistrictData ? (
              <ChartErrorState message="Could not load violations by district data." />
            ) : (
              <ChartContainer config={violationsByDistrictConfig} className="h-[300px] w-full">
                <BarChart
                  data={violationsByDistrictData}
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="violationsByDistrictGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="district"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#violationsByDistrictGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Donut: Paving Projects by Status */}
      {pavingByStatusLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Paving Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paving Projects by Status</CardTitle>
            <CardDescription>Current status of road paving projects</CardDescription>
          </CardHeader>
          <CardContent>
            {!pavingByStatusData ? (
              <ChartErrorState message="Could not load paving projects data." />
            ) : (
              <ChartContainer config={pavingByStatusConfig} className="mx-auto h-[350px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                  <Pie
                    data={pavingByStatusData}
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
                    {pavingByStatusData.map((_: unknown, i: number) => (
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

      {/* Horizontal Bar: Nuisance Complaints by Type */}
      {nuisanceByTypeLoading ? (
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
            <CardDescription>Top complaint categories</CardDescription>
          </CardHeader>
          <CardContent>
            {!nuisanceByTypeData ? (
              <ChartErrorState message="Could not load nuisance complaints data." />
            ) : (
              <ChartContainer config={nuisanceByTypeConfig} className="h-[300px] w-full">
                <BarChart
                  data={nuisanceByTypeData}
                  layout="vertical"
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="nuisanceByTypeGrad" x1="0" y1="0" x2="1" y2="0">
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
                  <Bar dataKey="count" fill="url(#nuisanceByTypeGrad)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bar: 311 Service Requests by Type */}
      {serviceRequestsLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">311 Service Requests by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">311 Service Requests by Type</CardTitle>
            <CardDescription>Top 311 service request categories</CardDescription>
          </CardHeader>
          <CardContent>
            {!serviceRequestsData ? (
              <ChartErrorState message="Could not load service requests data." />
            ) : (
              <ChartContainer config={serviceRequestsConfig} className="h-[300px] w-full">
                <BarChart
                  data={serviceRequestsData}
                  margin={{ top: 8, right: 30, left: 10, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="serviceRequestsCityStaffGrad" x1="0" y1="0" x2="0" y2="1">
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
                  <Bar
                    dataKey="count"
                    fill="url(#serviceRequestsCityStaffGrad)"
                    radius={[6, 6, 0, 0]}
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

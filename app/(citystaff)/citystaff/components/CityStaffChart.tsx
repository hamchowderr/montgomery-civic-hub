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
  budget: {
    label: "Spending",
    color: "hsl(346 77% 50%)",
  },
} satisfies ChartConfig;

const violationsByStatusConfig = {
  count: {
    label: "Violations",
    color: "hsl(0 72% 51%)",
  },
} satisfies ChartConfig;

const violationsByDistrictConfig = {
  count: {
    label: "Violations",
    color: "hsl(25 95% 53%)",
  },
} satisfies ChartConfig;

const pavingByStatusConfig = {
  count: {
    label: "Projects",
    color: "hsl(45 93% 47%)",
  },
} satisfies ChartConfig;

const nuisanceByTypeConfig = {
  count: {
    label: "Complaints",
    color: "hsl(292 91% 73%)",
  },
} satisfies ChartConfig;

const serviceRequestsConfig = {
  count: {
    label: "Requests",
    color: "hsl(221 83% 53%)",
  },
} satisfies ChartConfig;

export function CityStaffChart() {
  const { data, isLoading } = useChartData("budget");
  const { data: violationsByStatusData, isLoading: violationsByStatusLoading } =
    useChartData("violationsByStatus");
  const {
    data: violationsByDistrictData,
    isLoading: violationsByDistrictLoading,
  } = useChartData("violationsByDistrict");
  const { data: pavingByStatusData, isLoading: pavingByStatusLoading } =
    useChartData("pavingByStatus");
  const { data: nuisanceByTypeData, isLoading: nuisanceByTypeLoading } =
    useChartData("nuisanceByType");
  const { data: serviceRequestsData, isLoading: serviceRequestsLoading } =
    useChartData("serviceRequests");

  return (
    <>
      {/* Permit Spending by District */}
      {isLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Permit Spending by District
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonBars />
          </CardContent>
        </Card>
      ) : (
        <Card data-tour-step-id="citystaff-chart">
          <CardHeader>
            <CardTitle className="text-base">
              Permit Spending by District
            </CardTitle>
            <CardDescription>
              Total estimated construction permit costs by council district
              (2023+)
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
                      <stop
                        offset="0%"
                        stopColor="var(--color-budget)"
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-budget)"
                        stopOpacity={0.9}
                      />
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
                  <Bar
                    dataKey="budget"
                    fill="url(#budgetGrad)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Code Violations by Status */}
      {violationsByStatusLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Code Violations by Status
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
              Code Violations by Status
            </CardTitle>
            <CardDescription>
              Case status distribution for reported violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!violationsByStatusData ? (
              <ChartErrorState message="Could not load violations by status data." />
            ) : (
              <ChartContainer
                config={violationsByStatusConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={violationsByStatusData}
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="violationsByStatusGrad"
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
                    fill="url(#violationsByStatusGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Code Violations by District */}
      {violationsByDistrictLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Code Violations by District
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
              Code Violations by District
            </CardTitle>
            <CardDescription>Violations per council district</CardDescription>
          </CardHeader>
          <CardContent>
            {!violationsByDistrictData ? (
              <ChartErrorState message="Could not load violations by district data." />
            ) : (
              <ChartContainer
                config={violationsByDistrictConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={violationsByDistrictData}
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="violationsByDistrictGrad"
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
                    dataKey="district"
                    tick={{ fontSize: 11 }}
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
                    fill="url(#violationsByDistrictGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paving Projects by Status */}
      {pavingByStatusLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Paving Projects by Status
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
              Paving Projects by Status
            </CardTitle>
            <CardDescription>
              Current status of road paving projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!pavingByStatusData ? (
              <ChartErrorState message="Could not load paving projects data." />
            ) : (
              <ChartContainer
                config={pavingByStatusConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={pavingByStatusData}
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="pavingByStatusGrad"
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
                    fill="url(#pavingByStatusGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nuisance Complaints by Type */}
      {nuisanceByTypeLoading ? (
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
            <CardDescription>Top complaint categories</CardDescription>
          </CardHeader>
          <CardContent>
            {!nuisanceByTypeData ? (
              <ChartErrorState message="Could not load nuisance complaints data." />
            ) : (
              <ChartContainer
                config={nuisanceByTypeConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={nuisanceByTypeData}
                  layout="vertical"
                  margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="nuisanceByTypeGrad"
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
                    fill="url(#nuisanceByTypeGrad)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* 311 Service Requests by Type */}
      {serviceRequestsLoading ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              311 Service Requests by Type
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
              311 Service Requests by Type
            </CardTitle>
            <CardDescription>
              Top 311 service request categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!serviceRequestsData ? (
              <ChartErrorState message="Could not load service requests data." />
            ) : (
              <ChartContainer
                config={serviceRequestsConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={serviceRequestsData}
                  margin={{ top: 8, right: 30, left: 10, bottom: 60 }}
                >
                  <defs>
                    <linearGradient
                      id="serviceRequestsCityStaffGrad"
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
                    fill="url(#serviceRequestsCityStaffGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

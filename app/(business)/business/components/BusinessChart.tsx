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

const permitChartConfig = {
  permits: {
    label: "Permits Issued",
    color: "hsl(142 71% 45%)",
  },
  cost: {
    label: "Est. Cost ($M)",
    color: "hsl(47 96% 53%)",
  },
} satisfies ChartConfig;

const propertyChartConfig = {
  count: {
    label: "Properties",
    color: "hsl(25 95% 53%)",
  },
} satisfies ChartConfig;

const licensesByCategoryConfig = {
  count: {
    label: "Licenses",
    color: "hsl(271 91% 65%)",
  },
} satisfies ChartConfig;

const permitStatusConfig = {
  count: {
    label: "Permits",
    color: "hsl(346 77% 50%)",
  },
} satisfies ChartConfig;

const licensesByYearConfig = {
  count: {
    label: "Licenses",
    color: "hsl(199 89% 48%)",
  },
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
    <div className="flex flex-col gap-4">
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
            <ChartContainer
              config={permitChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 50, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="permitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-permits)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-permits)"
                      stopOpacity={0.5}
                    />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-cost)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-cost)"
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
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Permits",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    },
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
                    style: {
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    },
                  }}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="permits"
                  fill="url(#permitGrad)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="cost"
                  fill="url(#costGrad)"
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
            City-Owned Properties by Type
          </CardTitle>
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
            <ChartContainer
              config={propertyChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={properties.data}
                layout="vertical"
                margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="propertyGrad" x1="0" y1="0" x2="1" y2="0">
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
                  fill="url(#propertyGrad)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top Business License Categories
          </CardTitle>
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
            <ChartContainer
              config={licensesByCategoryConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={licensesByCategory.data}
                layout="vertical"
                margin={{ top: 8, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="licenseCatGrad"
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
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  width={140}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#licenseCatGrad)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

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
            <ChartContainer
              config={permitStatusConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={permitStatus.data}
                margin={{ top: 8, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="permitStatusGrad"
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
                  fill="url(#permitStatusGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Licenses by Year</CardTitle>
          <CardDescription>
            Number of business licenses issued per year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {licensesByYear.isLoading ? (
            <SkeletonBars />
          ) : !licensesByYear.data ? (
            <ChartErrorState message="Could not load license year data. Check your connection or try refreshing." />
          ) : (
            <ChartContainer
              config={licensesByYearConfig}
              className="h-[300px] w-full"
            >
              <BarChart
                data={licensesByYear.data}
                margin={{ top: 8, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="licenseYearGrad"
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
                  fill="url(#licenseYearGrad)"
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

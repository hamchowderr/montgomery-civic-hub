"use client";

import { AlertTriangle, HardHat, Phone, TreePine } from "lucide-react";
import { FileText, MapPin } from "@/components/icons";
import { animate, motion, useInView } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomepageData } from "@/lib/hooks/use-homepage-data";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   Shared Helpers
   ═══════════════════════════════════════════════════════ */

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function FadeInWhenVisible({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionAccent({ className }: { className?: string }) {
  return <div className={cn("mx-auto mb-6 h-[3px] w-12 rounded-full bg-accent", className)} />;
}

/** Pulsing green "Live" badge */
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Stat Card
   ═══════════════════════════════════════════════════════ */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | null;
  loading: boolean;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, loading, delay = 0 }: StatCardProps) {
  return (
    <FadeInWhenVisible delay={delay}>
      <Card className="group relative overflow-hidden border-border/50 transition-colors hover:border-accent/30">
        {/* Top accent line */}
        <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <CardContent className="flex flex-col items-center gap-2 p-fluid-md text-center">
          <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon size={20} />
          </div>

          {loading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <div className="font-display text-fluid-2xl tracking-tight">
              {value !== null ? <AnimatedCounter value={value} /> : "---"}
            </div>
          )}

          <div className="flex min-h-[2rem] items-center text-[0.7rem] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </div>

          <LiveBadge />
        </CardContent>
      </Card>
    </FadeInWhenVisible>
  );
}

/* ═══════════════════════════════════════════════════════
   Charts
   ═══════════════════════════════════════════════════════ */

const CHART_COLORS = [
  "hsl(16, 65%, 48%)", // terracotta / accent
  "hsl(16, 55%, 58%)",
  "hsl(30, 50%, 55%)",
  "hsl(40, 45%, 58%)",
  "hsl(200, 40%, 50%)",
];

const DONUT_COLORS = [
  "hsl(45, 70%, 55%)", // amber — Pending
  "hsl(160, 55%, 45%)", // green — Approved
  "hsl(200, 60%, 50%)", // blue — Issued
  "hsl(16, 65%, 48%)", // accent
  "hsl(270, 40%, 55%)", // purple
];

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */

export function LiveDataShowcase() {
  const { stats, requestTypes, permitStatus, loading, error } = useHomepageData();

  const statCards: Omit<StatCardProps, "loading">[] = [
    {
      icon: Phone,
      label: "311 Requests",
      value: stats?.serviceRequests ?? null,
    },
    {
      icon: HardHat,
      label: "Construction Permits",
      value: stats?.constructionPermits ?? null,
    },
    {
      icon: FileText,
      label: "Business Licenses",
      value: stats?.businessLicenses ?? null,
    },
    {
      icon: AlertTriangle,
      label: "Code Violations",
      value: stats?.codeViolations ?? null,
    },
    {
      icon: TreePine,
      label: "Public Parks",
      value: 50,
    },
    {
      icon: MapPin,
      label: "Council Districts",
      value: 9,
    },
  ];

  return (
    <section className="bg-background px-fluid-md py-fluid-section">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <FadeInWhenVisible className="text-center">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Live City Data
          </span>
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mt-4 text-center" delay={0.08}>
          <h2 className="font-display text-fluid-3xl tracking-tight">
            Real-time Montgomery in numbers.
          </h2>
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mx-auto mt-5 text-center" delay={0.12}>
          <SectionAccent />
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mx-auto mb-10 max-w-2xl text-center" delay={0.16}>
          <p className="text-fluid-base leading-relaxed text-muted-foreground">
            Pulled directly from Montgomery&apos;s ArcGIS servers. These numbers update as the
            city&apos;s data changes — no static reports, no waiting for quarterly updates.
          </p>
        </FadeInWhenVisible>

        {/* Error state */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            Unable to load live data. Showing cached values where available.
          </div>
        )}

        {/* Stat cards grid */}
        <div className="grid gap-fluid-md grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} loading={loading} delay={i * 0.06} />
          ))}
        </div>

        {/* Charts row */}
        <div
          className={cn(
            "mt-8 grid gap-fluid-md",
            !loading && permitStatus.length > 0 ? "md:grid-cols-2" : "md:grid-cols-1",
          )}
        >
          {/* Top 5 Request Types — Horizontal Bar Chart */}
          <FadeInWhenVisible delay={0.1}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold tracking-tight">
                    Top Service Request Types
                  </CardTitle>
                  <LiveBadge />
                </div>
                <p className="text-xs text-muted-foreground">2025 311 requests by category</p>
              </CardHeader>
              <CardContent className="pt-2">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : requestTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240} minWidth={1}>
                    <BarChart
                      data={requestTypes}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="type"
                        width={120}
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [value.toLocaleString(), "Requests"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {requestTypes.map((_, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    No request type data available
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeInWhenVisible>

          {/* Permit Status — Donut Chart (only shown when data exists) */}
          {(loading || permitStatus.length > 0) && (
            <FadeInWhenVisible delay={0.18}>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold tracking-tight">
                      Permit Status Breakdown
                    </CardTitle>
                    <LiveBadge />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    2025 construction permits by status
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  {loading ? (
                    <div className="flex h-[240px] items-center justify-center">
                      <Skeleton className="h-40 w-40 rounded-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240} minWidth={1}>
                      <PieChart>
                        <Pie
                          data={permitStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          strokeWidth={2}
                          stroke="hsl(var(--card))"
                        >
                          {permitStatus.map((_, index) => (
                            <Cell
                              key={`pie-${index}`}
                              fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [value.toLocaleString(), "Permits"]}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => (
                            <span className="text-xs text-muted-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </FadeInWhenVisible>
          )}
        </div>
      </div>
    </section>
  );
}

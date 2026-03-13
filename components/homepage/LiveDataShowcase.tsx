"use client";

import { animate, motion, useInView } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  HardHat,
  MapPin,
  Phone,
  TreePine,
} from "@/components/icons";
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
   Stat Card — uses CSS grid to bulletproof icon centering
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
      <Card className="group relative h-full overflow-hidden animate-card-pulse border-accent/20 transition-colors hover:border-accent/40">
        <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <CardContent className="flex flex-col items-center gap-2 px-fluid-md pb-fluid-md pt-6 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent [&>div]:contents">
            <Icon size={20} />
          </div>

          {loading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <div className="font-display text-fluid-2xl tracking-tight">
              {value !== null ? <AnimatedCounter value={value} /> : "---"}
            </div>
          )}

          <div className="text-[0.7rem] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
        </CardContent>
      </Card>
    </FadeInWhenVisible>
  );
}

/* ═══════════════════════════════════════════════════════
   Chart Colors
   ═══════════════════════════════════════════════════════ */

const CHART_COLORS = [
  "hsl(16, 65%, 48%)",
  "hsl(16, 55%, 58%)",
  "hsl(30, 50%, 55%)",
  "hsl(40, 45%, 58%)",
  "hsl(200, 40%, 50%)",
  "hsl(160, 40%, 45%)",
  "hsl(280, 35%, 52%)",
  "hsl(350, 45%, 50%)",
];

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */

/** Shared tooltip style */
const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

/** Truncate long labels for chart Y-axis */
function truncateLabel(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

/* ═══════════════════════════════════════════════════════
   Chart Carousel — cycle through charts with arrows
   ═══════════════════════════════════════════════════════ */

interface ChartSlide {
  title: string;
  subtitle: string;
  dataKey: string;
  labelKey: string;
  tooltipLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  labelWidth: number;
  truncate?: boolean;
  colorOffset?: number;
}

function ChartCarousel({ slides, loading }: { slides: ChartSlide[]; loading: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = slides.length;

  const prev = () => setActiveIndex((i) => (i - 1 + total) % total);
  const next = () => setActiveIndex((i) => (i + 1) % total);

  const slide = slides[activeIndex];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              aria-label="Previous chart"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">
                {slide?.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{slide?.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {activeIndex + 1} / {total}
            </span>
            <LiveBadge />
            <button
              type="button"
              onClick={next}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              aria-label="Next chart"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : slide && slide.data.length > 0 ? (
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ResponsiveContainer width="100%" height={260} minWidth={1}>
              <BarChart
                data={slide.data}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey={slide.labelKey}
                  width={slide.labelWidth}
                  tickFormatter={slide.truncate ? (v: string) => truncateLabel(v) : undefined}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => [value.toLocaleString(), slide.tooltipLabel]}
                />
                <Bar dataKey={slide.dataKey} radius={[0, 4, 4, 0]} barSize={20}>
                  {slide.data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[(index + (slide.colorOffset ?? 0)) % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}

        {/* Dot indicators */}
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex
                  ? "w-4 bg-accent"
                  : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
              aria-label={`Go to chart ${i + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveDataShowcase() {
  const { stats, requestTypes, permitStatus, violationTypes, licenseCategories, loading, error } =
    useHomepageData();

  const statCards: Omit<StatCardProps, "loading">[] = [
    { icon: Phone, label: "311 Requests", value: stats?.serviceRequests ?? null },
    { icon: HardHat, label: "Construction Permits", value: stats?.constructionPermits ?? null },
    { icon: FileText, label: "Business Licenses", value: stats?.businessLicenses ?? null },
    { icon: AlertTriangle, label: "Code Violations", value: stats?.codeViolations ?? null },
    { icon: TreePine, label: "Public Parks", value: 50 },
    { icon: MapPin, label: "Council Districts", value: 9 },
  ];

  const chartSlides: ChartSlide[] = [
    {
      title: "Top Service Request Types",
      subtitle: "2025 311 requests by category",
      dataKey: "count",
      labelKey: "type",
      tooltipLabel: "Requests",
      data: requestTypes,
      labelWidth: 120,
      colorOffset: 0,
    },
    {
      title: "Construction Permit Status",
      subtitle: "2025 permits by current status",
      dataKey: "count",
      labelKey: "status",
      tooltipLabel: "Permits",
      data: permitStatus,
      labelWidth: 100,
      colorOffset: 2,
    },
    {
      title: "Code Violations by Type",
      subtitle: "2025 violations by case type",
      dataKey: "count",
      labelKey: "type",
      tooltipLabel: "Violations",
      data: violationTypes,
      labelWidth: 140,
      colorOffset: 4,
    },
    {
      title: "Top Business License Categories",
      subtitle: "2025 licenses by industry",
      dataKey: "count",
      labelKey: "category",
      tooltipLabel: "Licenses",
      data: licenseCategories,
      labelWidth: 160,
      truncate: true,
      colorOffset: 1,
    },
  ];

  return (
    <section className="bg-background px-fluid-md py-fluid-section">
      <div className="mx-auto max-w-6xl">
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

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            Unable to load live data. Showing cached values where available.
          </div>
        )}

        {/* Stat cards */}
        <div className="grid gap-fluid-md grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} loading={loading} delay={i * 0.06} />
          ))}
        </div>

        {/* Chart carousel */}
        <FadeInWhenVisible delay={0.1} className="mt-8">
          <ChartCarousel slides={chartSlides} loading={loading} />
        </FadeInWhenVisible>
      </div>
    </section>
  );
}

"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
  animate,
} from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  MessageSquare,
  Map,
  BarChart3,
  Landmark,
  Users,
  Shield,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import { LiveDataShowcase } from "@/components/homepage/LiveDataShowcase";
import { PortalPreview } from "@/components/homepage/PortalPreview";

/* ═══════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════ */

const stats = [
  { value: 200, suffix: "K+", label: "Residents Served" },
  { value: 40, suffix: "+", label: "City Datasets" },
  { value: 4, suffix: "", label: "Specialized Portals" },
  { value: 9, suffix: "", label: "Council Districts" },
];

const montgomeryHighlights = [
  {
    icon: Landmark,
    title: "Birthplace of Civil Rights",
    description:
      "From the 1955 Bus Boycott to the Selma-to-Montgomery marches, this city transformed America. Now it's using open data to write the next chapter of civic engagement.",
  },
  {
    icon: TrendingUp,
    title: "$1.5B Data Center Investment",
    description:
      "Meta, DC BLOX, and others are investing billions in Montgomery's data center corridor. The challenge: turning infrastructure investment into broad economic opportunity for all residents.",
  },
  {
    icon: Shield,
    title: "Public Safety Priority",
    description:
      "With a 43% vacancy rate in the 911 center and 17% longer response times since 2019, data-driven solutions for public safety are urgently needed at city hall.",
  },
  {
    icon: Users,
    title: "200K+ Residents, One Platform",
    description:
      "A majority-minority city (62.8% Black, 26.6% White) where 21.5% live below the poverty line. Equitable access to civic data isn't a luxury — it's a necessity.",
  },
];

const steps = [
  {
    icon: MessageSquare,
    title: "Choose Your Portal",
    description:
      "Select from four specialized dashboards — each tailored to your unique needs, whether you're a resident checking on neighborhood safety or a researcher analyzing city trends.",
  },
  {
    icon: Map,
    title: "Explore & Ask",
    description:
      "Interact with real-time maps, browse city datasets, and ask questions in natural language. Our AI processes your queries using live ArcGIS data and public records.",
  },
  {
    icon: BarChart3,
    title: "Get Actionable Insights",
    description:
      "Receive AI-powered answers backed by authoritative city data sources. Visualize trends, export findings, and make informed decisions about Montgomery.",
  },
];

/* ═══════════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════════ */

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
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

/** Terracotta accent bar used as section punctuation */
function SectionAccent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto mb-6 h-[3px] w-12 rounded-full bg-accent",
        className,
      )}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════════════ */

function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.97]);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity, scale: heroScale }}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#141618] px-4 text-white"
    >
      {/* Background video — MLK Selma-Montgomery March (public domain) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.45]"
        src="/hero-bg.mp4"
      />

      {/* Dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-[#141618]/40" />

      {/* Warm glow — terracotta & gold undertone */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/3 h-[600px] w-[600px] rounded-full bg-civic-accent/[0.08] blur-[140px]" />
        <div className="absolute -right-32 bottom-1/3 h-[500px] w-[500px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-neutral-800/[0.2] blur-[100px]" />
      </div>

      {/* Grain texture */}
      <div
        className="grain-overlay pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* City seal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2"
      >
        <Image
          src="/montgomery-seal.png"
          alt="City of Montgomery Seal"
          width={80}
          height={80}
          className="opacity-70 drop-shadow-lg"
          priority
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10 inline-flex items-center gap-2.5 rounded-none border-b border-t border-white/[0.12] px-5 py-2 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white/50"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-civic-accent" />
          Civic Intelligence Platform
        </motion.div>

        {/* Title */}
        <h1 className="mb-5 flex flex-col items-center text-5xl tracking-tight sm:text-7xl lg:text-[5.5rem]">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="font-display italic text-white/90"
          >
            Montgomery
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.65,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="mt-1 text-[0.45em] font-semibold uppercase tracking-[0.25em] text-white/40"
          >
            Civic Hub
          </motion.span>
        </h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mb-12 max-w-md text-[1.05rem] leading-relaxed text-white/40"
        >
          Your gateway to city data, services, and insights for{" "}
          <span className="text-white/70">Montgomery, Alabama</span>.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="flex flex-col gap-3 sm:flex-row sm:gap-4"
        >
          <Link
            href="/sign-up"
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-7 py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
          >
            Create Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#portals"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/15 px-7 py-3 text-sm font-medium text-white/60 transition-all hover:border-white/30 hover:text-white/90"
          >
            Explore Portals
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-white/20" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════
   Stats Section
   ═══════════════════════════════════════════════════════ */

function StatsSection() {
  return (
    <section className="border-b bg-background px-4 py-14">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <FadeInWhenVisible
            key={stat.label}
            delay={i * 0.08}
            className="text-center"
          >
            <div className="font-display text-4xl tracking-tight sm:text-5xl">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </div>
          </FadeInWhenVisible>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Why Montgomery Section
   ═══════════════════════════════════════════════════════ */

function WhyMontgomerySection() {
  return (
    <section className="civic-topo px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <FadeInWhenVisible className="text-center">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Why Montgomery
          </span>
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mt-4 text-center" delay={0.08}>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-[2.75rem]">
            A city where history meets innovation.
          </h2>
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mx-auto mt-5 text-center" delay={0.12}>
          <SectionAccent />
        </FadeInWhenVisible>
        <FadeInWhenVisible
          className="mx-auto mb-10 max-w-2xl text-center"
          delay={0.16}
        >
          <p className="text-[1.05rem] leading-relaxed text-muted-foreground">
            Montgomery isn&apos;t just any city. From the first capital of the
            Confederacy to the birthplace of the civil rights movement, this is
            a place defined by transformation. Today, it faces new challenges —
            and this platform puts the data behind them into everyone&apos;s
            hands.
          </p>
        </FadeInWhenVisible>

        <div className="grid gap-5 sm:grid-cols-2">
          {montgomeryHighlights.map((item, i) => (
            <FadeInWhenVisible key={item.title} delay={i * 0.08}>
              <div className="group rounded-lg border bg-card p-8 transition-colors hover:border-accent/30">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   How It Works — Scrollytelling
   ═══════════════════════════════════════════════════════ */

function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.33) setActiveStep(0);
    else if (v < 0.66) setActiveStep(1);
    else setActiveStep(2);
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="relative civic-topo"
      style={{ height: "140vh" }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 md:flex-row md:items-center md:gap-20">
          {/* Left — progress + labels */}
          <div className="flex-1">
            <FadeInWhenVisible>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
                How It Works
              </span>
              <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
                Three steps to
                <br />
                smarter civic access.
              </h2>
              <div className="mt-4 h-[3px] w-12 rounded-full bg-accent" />
            </FadeInWhenVisible>

            <div className="relative mt-12 flex flex-col">
              {/* Background line */}
              <div className="absolute left-[19px] top-0 h-full w-[2px] bg-border" />
              {/* Filled progress line */}
              <motion.div
                className="absolute left-[19px] top-0 w-[2px] bg-accent"
                style={{ height: lineHeight }}
              />

              {steps.map((step, i) => (
                <div key={step.title} className="relative flex gap-5 pb-10">
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                      activeStep >= i
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3
                      className={cn(
                        "font-semibold tracking-tight transition-colors duration-500",
                        activeStep >= i
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — animated step detail */}
          <div className="flex-1">
            <div className="relative h-72 sm:h-80">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={false}
                  animate={{
                    opacity: activeStep === i ? 1 : 0,
                    y: activeStep === i ? 0 : 16,
                    scale: activeStep === i ? 1 : 0.97,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className={cn(
                    "absolute inset-0 flex flex-col justify-center",
                    activeStep !== i && "pointer-events-none",
                  )}
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 font-display text-2xl">{step.title}</h3>
                  <p className="text-[1.05rem] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   CTA Section
   ═══════════════════════════════════════════════════════ */

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-civic-navy px-4 py-24 text-white">
      {/* Warm glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-civic-accent/[0.06] blur-[100px]" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-amber-500/[0.05] blur-[100px]" />
      </div>

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <FadeInWhenVisible>
          <h2 className="font-display text-3xl tracking-tight sm:text-5xl">
            Ready to explore
            <br />
            your city&apos;s data?
          </h2>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.08}>
          <p className="mx-auto mt-6 max-w-lg text-[1.05rem] leading-relaxed text-white/40">
            Join thousands of Montgomery residents, businesses, and researchers
            using AI-powered civic insights.
          </p>
        </FadeInWhenVisible>
        <FadeInWhenVisible delay={0.16}>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-sm bg-accent px-8 py-3.5 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
            >
              Create Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeInWhenVisible>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════════════════ */

export function Homepage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <LiveDataShowcase />
      <WhyMontgomerySection />
      <PortalPreview />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}

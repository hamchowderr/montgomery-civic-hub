"use client";

import { Activity, Database, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { FadeInWhenVisible, SectionAccent } from "@/components/homepage/shared";

/* ═══════════════════════════════════════════════════════
   Trust & Credibility Section
   ═══════════════════════════════════════════════════════ */

const pillars = [
  {
    icon: Database,
    title: "Montgomery GIS FeatureServer",
    subtitle: "Direct queries to the city\u2019s official ArcGIS REST endpoints",
    badge: "40+ Datasets",
  },
  {
    icon: ShieldCheck,
    title: "Public Records Compliant",
    subtitle: "All data sourced from Alabama Open Records Act-compliant databases",
    badge: "Open Data",
  },
  {
    icon: Activity,
    title: "Live City Data",
    subtitle: "Updated as Montgomery\u2019s systems change \u2014 no waiting for quarterly reports",
    badge: "Live",
    live: true,
  },
];

const tickerItems = [
  "311 Request filed \u2014 District 7 \u2014 Pothole Repair",
  "Construction Permit approved \u2014 142 Dexter Ave",
  "Code Violation resolved \u2014 District 2",
  "Business License issued \u2014 Montgomery Mall",
  "Fire Inspection completed \u2014 Station 4",
  "Park Maintenance scheduled \u2014 Riverwalk",
  "Traffic Signal repair \u2014 Perry St & Hull St",
  "Building Permit \u2014 890 S Court St",
];

function TickerStrip() {
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="border-t border-white/10 mt-12 pt-6 overflow-hidden">
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="flex whitespace-nowrap text-xs text-white/25"
        style={{ animation: "ticker-scroll 40s linear infinite" }}
      >
        {items.map((item, i) => (
          <span key={i} className="mx-3 shrink-0">
            {item}
            <span className="ml-3">&middot;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrustSection() {
  return (
    <section className="relative bg-[#141618] text-white py-24 overflow-hidden">
      {/* Grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Warm glow overlays */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-civic-accent/[0.06] blur-[100px]" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-amber-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeInWhenVisible className="text-center">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-white/50">
            Data You Can Trust
          </span>
          <h2 className="font-display text-fluid-3xl font-bold tracking-tight">
            Powered by authoritative data.
          </h2>
          <SectionAccent className="mt-6" />
        </FadeInWhenVisible>

        {/* 3-column grid */}
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, i) => (
            <FadeInWhenVisible key={pillar.title} delay={i * 0.12}>
              <div className="h-12 w-12 rounded-xl bg-white/5 grid place-items-center text-accent">
                <pillar.icon className="h-5 w-5" />
              </div>

              <h3 className="text-lg font-semibold text-white mt-4">{pillar.title}</h3>

              <p className="text-sm text-white/40 mt-2 leading-relaxed">{pillar.subtitle}</p>

              {"live" in pillar && pillar.live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 mt-4">
                  <motion.span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {pillar.badge}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 mt-4">
                  {pillar.badge}
                </span>
              )}
            </FadeInWhenVisible>
          ))}
        </div>

        {/* Ticker */}
        <TickerStrip />
      </div>
    </section>
  );
}

"use client";

import { CheckCircle2, Share2 } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

import { FadeInWhenVisible } from "@/components/homepage/shared";
import { BarChart3, Download, MapPin, MessageSquare } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   Step definitions
   ═══════════════════════════════════════════════════════ */

const storySteps = [
  { title: "She checks her neighborhood" },
  { title: "She asks the AI" },
  { title: "Live data responds" },
  { title: "She takes action" },
];

/* ═══════════════════════════════════════════════════════
   Step Cards
   ═══════════════════════════════════════════════════════ */

function MiniMapCard() {
  // Montgomery, AL center coordinates — District 4 area
  const mapTileUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=-86.34,32.33,-86.24,32.40&bboxSR=4326&size=800,500&format=png&f=image";
  const darkMapUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/export?bbox=-86.34,32.33,-86.24,32.40&bboxSR=4326&size=800,500&format=png&f=image";

  return (
    <div className="rounded-xl border bg-card overflow-hidden h-[420px]">
      <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
        <MapPin size={14} className="text-portal-resident" />
        <span className="text-xs font-medium">District 4 — Neighborhood Map</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>
      <div className="relative h-[calc(100%-2.75rem)] overflow-hidden">
        {/* Real ArcGIS map tile — light mode */}
        <img
          src={mapTileUrl}
          alt="Montgomery District 4 map"
          className="absolute inset-0 h-full w-full object-cover dark:hidden"
        />
        {/* Dark mode map */}
        <img
          src={darkMapUrl}
          alt="Montgomery District 4 map"
          className="absolute inset-0 h-full w-full object-cover hidden dark:block"
        />

        {/* Service request pins overlay */}
        <div className="absolute inset-0">
          {/* Urgent — red pins */}
          <div className="absolute top-[22%] left-[28%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-red-500" />
          </div>
          <div className="absolute top-[55%] left-[62%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-red-500" />
          </div>
          <div className="absolute top-[68%] left-[35%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-red-500" />
          </div>

          {/* Pending — amber pins */}
          <div className="absolute top-[35%] left-[45%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-amber-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-amber-500" />
          </div>
          <div className="absolute top-[18%] left-[72%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-amber-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-amber-500" />
          </div>
          <div className="absolute top-[48%] left-[22%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-amber-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-amber-500" />
          </div>
          <div className="absolute top-[72%] left-[55%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-amber-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-amber-500" />
          </div>

          {/* Resolved — emerald pins */}
          <div className="absolute top-[40%] left-[68%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-emerald-500" />
          </div>
          <div className="absolute top-[28%] left-[38%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-emerald-500" />
          </div>
          <div className="absolute top-[60%] left-[78%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-emerald-500" />
          </div>

          {/* Blue — info pins */}
          <div className="absolute top-[45%] left-[52%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-blue-500" />
          </div>
          <div className="absolute top-[15%] left-[42%] flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
            <div className="h-1.5 w-0.5 bg-blue-500" />
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg bg-black/70 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[9px] text-white/70">Urgent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[9px] text-white/70">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-white/70">Resolved</span>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-3 right-3 rounded-lg bg-black/70 px-3 py-2 backdrop-blur-sm">
          <div className="text-[10px] font-medium text-white">127 open requests</div>
          <div className="text-[9px] text-white/50">District 4 · Montgomery, AL</div>
        </div>
      </div>
    </div>
  );
}

function ChatCard() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden h-[420px] flex flex-col">
      <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
        <MessageSquare size={14} className="text-portal-resident" />
        <span className="text-xs font-medium">AI Civic Assistant</span>
      </div>
      <div className="flex-1 p-4 space-y-3">
        {/* User message */}
        <div className="flex justify-end">
          <div className="bg-accent text-accent-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]">
            What&apos;s the average response time for potholes in District 4?
          </div>
        </div>
        {/* AI typing indicator */}
        <div className="flex gap-1 items-center px-1">
          <div
            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

function AIResponseCard() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden h-[420px] flex flex-col">
      <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
        <BarChart3 size={14} className="text-portal-resident" />
        <span className="text-xs font-medium">AI Response — Live Data</span>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
          <p>
            Based on <strong>247 pothole reports</strong> in District 4 this year:
          </p>
          <p className="mt-2">
            Average response time: <strong>4.2 days</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Down from 6.1 days last year — a 31% improvement
          </p>
        </div>
        {/* Mini bar chart */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-20">Potholes</span>
            <div className="h-4 rounded-sm bg-portal-resident/80" style={{ width: "70%" }} />
            <span className="text-[10px] text-muted-foreground">4.2d</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-20">Streetlights</span>
            <div className="h-4 rounded-sm bg-portal-resident/60" style={{ width: "47%" }} />
            <span className="text-[10px] text-muted-foreground">2.8d</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-20">Trash</span>
            <div className="h-4 rounded-sm bg-portal-resident/40" style={{ width: "25%" }} />
            <span className="text-[10px] text-muted-foreground">1.5d</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportCard() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden h-[420px] flex flex-col">
      <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
        <Share2 size={14} className="text-portal-resident" />
        <span className="text-xs font-medium">Export & Share</span>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>
          <p className="text-xs text-muted-foreground">
            District 4 — Pothole Response Times — 247 records analyzed
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted/50 cursor-default">
            <Download size={12} /> Download PDF
          </div>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted/50 cursor-default">
            <Share2 size={12} /> Share Link
          </div>
        </div>
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <span className="text-[10px] text-muted-foreground">
            Data sourced from Montgomery ArcGIS · Updated 2 hours ago
          </span>
        </div>
      </div>
    </div>
  );
}

const stepCards = [MiniMapCard, ChatCard, AIResponseCard, ExportCard];

/* ═══════════════════════════════════════════════════════
   DataStorySection
   ═══════════════════════════════════════════════════════ */

export function DataStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.25) setActiveStep(0);
    else if (v < 0.5) setActiveStep(1);
    else if (v < 0.75) setActiveStep(2);
    else setActiveStep(3);
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative civic-topo" style={{ height: "160vh" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 md:flex-row md:items-center md:gap-16">
          {/* Left — progress + labels */}
          <div className="md:w-[38%] md:shrink-0">
            <FadeInWhenVisible>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
                See It In Action
              </span>
              <h2 className="mt-3 font-display text-fluid-3xl tracking-tight">
                A day in Maria&apos;s
                <br />
                neighborhood.
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

              {storySteps.map((step, i) => (
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
                        activeStep >= i ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — animated step cards */}
          <div className="md:w-[62%]">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {(() => {
                    const Card = stepCards[activeStep];
                    return <Card />;
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

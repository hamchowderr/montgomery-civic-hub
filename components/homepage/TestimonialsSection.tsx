"use client";

import { Quote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FadeInWhenVisible, SectionAccent } from "@/components/homepage/shared";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "I used to spend hours calling city offices to report potholes. Now I just ask the AI assistant and it shows me every open request in my neighborhood \u2014 plus which ones are already being fixed.",
    name: "Danielle R.",
    title: "Community Organizer, District 4",
    portal: "resident" as const,
  },
  {
    quote:
      "The permit tracking alone saved us weeks. Instead of driving to city hall to check status, I can see every active permit near our development site and plan accordingly.",
    name: "Marcus T.",
    title: "Commercial Developer",
    portal: "business" as const,
  },
  {
    quote:
      "The executive dashboard gives our department heads real-time metrics they used to wait weeks for. The AI briefing feature generates reports that would take my team days to compile.",
    name: "Patricia W.",
    title: "Assistant City Manager",
    portal: "citystaff" as const,
  },
  {
    quote:
      "Access to 40+ city datasets with proper source citations? This is exactly what urban planning researchers need. I\u2019ve already used it in two published papers on civic data transparency.",
    name: "Dr. James L.",
    title: "Urban Studies, Alabama State University",
    portal: "researcher" as const,
  },
];

const portalColorMap = {
  resident: {
    border: "border-l-portal-resident",
    dot: "bg-portal-resident",
    label: "Resident Portal",
  },
  business: {
    border: "border-l-portal-business",
    dot: "bg-portal-business",
    label: "Business Portal",
  },
  citystaff: {
    border: "border-l-portal-citystaff",
    dot: "bg-portal-citystaff",
    label: "City Staff Portal",
  },
  researcher: {
    border: "border-l-portal-researcher",
    dot: "bg-portal-researcher",
    label: "Researcher Portal",
  },
};

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPaused = useRef(false);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused.current) {
        goNext();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [goNext]);

  const testimonial = testimonials[activeIndex];
  const colors = portalColorMap[testimonial.portal];

  return (
    <section className="civic-topo py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeInWhenVisible>
          <div className="text-center">
            <span className="text-sm font-medium uppercase tracking-widest text-accent">
              What People Say
            </span>
            <h2 className="mt-3 font-display text-fluid-3xl font-bold tracking-tight text-foreground">
              Trusted by Montgomery&apos;s community.
            </h2>
            <SectionAccent className="mx-auto mt-4" />
          </div>
        </FadeInWhenVisible>

        <div
          className="mt-14"
          onMouseEnter={() => (isPaused.current = true)}
          onMouseLeave={() => (isPaused.current = false)}
        >
          {/* Navigation arrows + card */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goPrev}
              aria-label="Previous testimonial"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative w-full max-w-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className={cn("relative rounded-xl border border-l-4 bg-card p-8", colors.border)}
                >
                  {/* Decorative quote mark */}
                  <Quote className="absolute right-6 top-4 h-14 w-14 text-accent/15" />

                  <p className="relative text-fluid-base italic leading-relaxed text-foreground/80">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  <div className="mt-6 h-px w-full bg-border" />

                  <div className="mt-4 flex items-center gap-3">
                    <span className="font-semibold text-foreground">{testimonial.name}</span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                    <span className="text-sm text-muted-foreground">{testimonial.title}</span>
                    <span className="ml-auto rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {colors.label}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={goNext}
              aria-label="Next testimonial"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === activeIndex
                    ? cn("h-1.5 w-3", portalColorMap[t.portal].dot)
                    : "h-1.5 w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

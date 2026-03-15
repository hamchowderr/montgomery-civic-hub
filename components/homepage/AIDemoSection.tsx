"use client";

import { Bot, Database } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FadeInWhenVisible, SectionAccent } from "@/components/homepage/shared";
import { MessageSquare, Shield, Sparkles, User } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════ */

type PortalId = "resident" | "business" | "citystaff" | "researcher";

interface Exchange {
  user: string;
  ai: string;
}

interface ChatScript {
  portal: PortalId;
  label: string;
  exchanges: Exchange[];
  chips: string[];
}

const chatScripts: ChatScript[] = [
  {
    portal: "resident",
    label: "Resident Portal",
    exchanges: [
      {
        user: "What are the most common 311 requests in my neighborhood?",
        ai: "Based on the latest Montgomery 311 data:\n\n1. **Garbage/Trash** — 2,847 requests\n2. **Street Light Outages** — 1,523\n3. **Pothole Repairs** — 1,198\n\nDistrict 4 has the highest volume overall.",
      },
      {
        user: "Which district am I in if I live near Eastdale Mall?",
        ai: "Eastdale Mall is in **District 3**, represented by Council Member Tracy Larkin. District 3 covers much of east Montgomery including **Eastdale, Dalraida**, and parts of **Vaughn Road**.",
      },
      {
        user: "How does District 3 compare to other districts for pothole repairs?",
        ai: "District 3 ranks **4th of 9** for pothole requests:\n\n- **District 4** — 198 requests (highest)\n- **District 2** — 172\n- **District 7** — 156\n- **District 3** — 134\n\nYour district is **below average** at 14% under the city mean.",
      },
      {
        user: "Are pothole repairs getting faster this year?",
        ai: "Yes! Average resolution time has **improved 18%** YTD:\n\n- **2024 avg:** 12.3 days\n- **2025 avg:** 10.1 days\n- **District 3 specifically:** 8.7 days (faster than city average)\n\nThe Public Works department added 2 new crews in January.",
      },
      {
        user: "Show me the nearest open 311 requests to my area",
        ai: "I found **23 open requests** within 1 mile of Eastdale Mall:\n\n- **12** Pothole repairs (3 marked urgent)\n- **6** Street light outages\n- **3** Sidewalk damage\n- **2** Drainage issues\n\nThe closest is a pothole at **Eastern Blvd & Wares Ferry** filed 2 days ago.",
      },
    ],
    chips: ["Show on map", "File a request", "Subscribe to updates"],
  },
  {
    portal: "business",
    label: "Business Portal",
    exchanges: [
      {
        user: "Show me active construction permits near downtown",
        ai: "I found **23 active permits** within 1 mile of downtown:\n\n1. **Mixed-Use Development** — Dexter Ave, $4.2M\n2. **Office Renovation** — Commerce St, $1.8M\n3. **Retail Buildout** — Court Square, $920K",
      },
      {
        user: "What's the average permit approval time?",
        ai: "Current average processing times by permit type:\n\n- **Commercial new build:** 34 days\n- **Renovation/remodel:** 18 days\n- **Sign permits:** 7 days\n- **Temporary use:** 3 days\n\nDown from **42 days average** in 2024 after the city streamlined reviews.",
      },
      {
        user: "Are there any zoning changes planned for the warehouse district?",
        ai: "Yes — the **West Downtown Overlay District** proposal is active:\n\n- **Current zoning:** M-1 (Light Industrial)\n- **Proposed:** MX-2 (Mixed-Use Urban)\n- **Public hearing:** March 27, 2025\n- **Impact:** Allows residential + retail conversion\n\nThis could affect **47 parcels** along Coosa St and Tallapoosa St.",
      },
      {
        user: "What incentives are available for businesses in that area?",
        ai: "Several incentive programs apply to the warehouse district:\n\n- **Historic Tax Credit** — 20% federal + 25% state for qualifying buildings\n- **Opportunity Zone** — Capital gains deferral (Census Tract 12.01)\n- **City facade grant** — Up to **$25,000** for exterior improvements\n- **MIDA bond financing** — Below-market rates for projects over $1M\n\nThe combined incentives can offset **30-40%** of renovation costs.",
      },
      {
        user: "How many new business licenses were issued downtown this year?",
        ai: "**142 new business licenses** issued downtown YTD:\n\n- **Food & beverage:** 38 (up 22%)\n- **Professional services:** 31\n- **Retail:** 27 (up 15%)\n- **Personal services:** 24\n- **Other:** 22\n\nDowntown is outpacing citywide growth by **2.3x**. Court Square and Dexter Ave corridors are the hottest areas.",
      },
    ],
    chips: ["View on map", "Apply for permit", "Export data"],
  },
  {
    portal: "citystaff",
    label: "City Staff Portal",
    exchanges: [
      {
        user: "What's the code violation trend this year?",
        ai: "Code violations are **down 12% YTD**:\n\n- **Weed/Vegetation** — decreased 23%\n- **Structural** — increased 8%\n- **Junk Vehicles** — decreased 15%\n\nDistricts 2 and 4 account for 41% of all violations.",
      },
      {
        user: "Why are structural violations increasing?",
        ai: "Three factors driving the **8% increase** in structural violations:\n\n1. **New inspection program** — 12 inspectors added in Q1 (more eyes)\n2. **Aging housing stock** — District 2 homes avg. **62 years old**\n3. **Storm damage** — February storms caused 47 new cases\n\nWithout the storm surge, structural violations would be **flat YoY**.",
      },
      {
        user: "What's our compliance rate for resolved violations?",
        ai: "Overall compliance rate: **73%** (voluntary resolution within 30 days)\n\n**By type:**\n- Weed/Vegetation: **89%** (easiest to fix)\n- Junk vehicles: **71%**\n- Structural: **52%** (longest resolution)\n- Demolition candidates: **12%** (requires legal action)\n\nUp from **67%** last year after adding the compliance assistance program.",
      },
      {
        user: "Which council districts need the most attention right now?",
        ai: "**Priority districts** based on open violations per capita:\n\n1. **District 2** — 18.4/1K residents (312 open cases)\n2. **District 4** — 14.7/1K (267 open cases)\n3. **District 8** — 11.2/1K (198 open cases)\n\nDistrict 2 also has the longest avg. resolution time at **47 days** vs. the city average of **28 days**.",
      },
      {
        user: "Generate a summary for the council briefing",
        ai: "**Code Enforcement Monthly Brief — March 2025**\n\n- Total violations: **1,847** (↓12% YoY)\n- Compliance rate: **73%** (↑6pt YoY)\n- Avg. resolution: **28 days** (↓4 days)\n- Budget utilization: **67%** ($2.1M of $3.1M)\n\n**Action items:** District 2 task force, storm damage follow-up, Q2 inspector hiring.",
      },
    ],
    chips: ["Export PDF", "Schedule briefing", "District breakdown"],
  },
  {
    portal: "researcher",
    label: "Researcher Portal",
    exchanges: [
      {
        user: "Compare crime data across all districts",
        ai: "Per-capita crime rates by district (per 1,000):\n\n1. **District 2** — 34.2/1K (highest)\n2. **District 4** — 28.7/1K\n3. **District 1** — 25.1/1K\n4. **District 7** — 12.8/1K (lowest)\n\nProperty crime accounts for **68%** of incidents.",
      },
      {
        user: "Is there a correlation between 311 requests and crime rates?",
        ai: "Strong positive correlation detected: **r = 0.78** (p < 0.01)\n\nDistricts with high 311 volume also show elevated crime:\n- **District 2:** High 311 + High crime\n- **District 7:** Low 311 + Low crime\n\nBroken windows theory may apply — **code violations** show even stronger correlation at **r = 0.84**.",
      },
      {
        user: "What datasets are available for demographic analysis?",
        ai: "**12 demographic datasets** available:\n\n- ACS 5-year estimates (2020-2024)\n- Montgomery Census tracts (119 tracts)\n- Household income by block group\n- Population density grids\n- Age distribution pyramids\n- Racial/ethnic composition\n- Housing tenure (own vs. rent)\n\nAll linkable by **FIPS code** or **spatial join** to any city dataset.",
      },
      {
        user: "Can you cross-reference income levels with service request density?",
        ai: "Cross-analysis of median household income vs. 311 density:\n\n- **< $30K areas:** 42.1 requests/1K (highest)\n- **$30-50K areas:** 28.7 requests/1K\n- **$50-75K areas:** 18.3 requests/1K\n- **> $75K areas:** 11.2 requests/1K\n\nInverse correlation: **r = -0.82**. Lower-income areas file **3.8x more** requests but have **1.4x longer** resolution times.",
      },
      {
        user: "Export this analysis with methodology notes",
        ai: "Export package prepared with **4 components**:\n\n1. **Dataset** — 2,847 records, CSV + GeoJSON formats\n2. **Methodology** — OLS regression, spatial autocorrelation (Moran's I), significance tests\n3. **Visualizations** — Choropleth maps, scatter plots, time series\n4. **Citations** — Montgomery GIS FeatureServer, ACS 2024, AL Open Records\n\nAll sources are **reproducible** with included query parameters.",
      },
    ],
    chips: ["Download CSV", "View methodology", "Cite sources"],
  },
];

const portalDotColors: Record<PortalId, string> = {
  resident: "bg-portal-resident",
  business: "bg-portal-business",
  citystaff: "bg-portal-citystaff",
  researcher: "bg-portal-researcher",
};

const capabilities = [
  { icon: Database, label: "Live ArcGIS Data" },
  { icon: MessageSquare, label: "Natural Language" },
  { icon: Shield, label: "Source Citations" },
] as const;

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

/** Render AI response text, converting **bold** markers to <strong> */
function FormattedResponse({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Typewriter Hook
   ═══════════════════════════════════════════════════════ */

function useTypewriter(text: string, active: boolean, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      return;
    }

    let i = 0;
    setDisplayed("");
    setDone(false);

    const interval = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, active, speed]);

  return { displayed, done };
}

/* ═══════════════════════════════════════════════════════
   Chat Demo Card — Multi-Turn
   ═══════════════════════════════════════════════════════ */

type DemoPhase = "typing" | "thinking" | "responding" | "pause" | "chips" | "idle";

interface VisibleMessage {
  role: "user" | "ai";
  text: string;
}

function ChatDemoCard() {
  const [scriptIndex, setScriptIndex] = useState(0);
  const [exchangeIndex, setExchangeIndex] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  const script = chatScripts[scriptIndex];
  const currentExchange = script.exchanges[exchangeIndex];

  const { displayed: typedQuestion, done: questionDone } = useTypewriter(
    currentExchange?.user ?? "",
    phase === "typing",
    25,
  );

  // Auto-scroll to bottom when messages change or phase changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, phase, typedQuestion]);

  // Phase machine
  const advance = useCallback(
    (current: DemoPhase) => {
      switch (current) {
        case "idle":
          setPhase("typing");
          break;
        case "typing":
          // Wait for questionDone effect
          break;
        case "thinking":
          timerRef.current = setTimeout(() => {
            // Add AI response to message history
            setMessages((prev) => [...prev, { role: "ai", text: currentExchange.ai }]);
            setPhase("responding");
          }, 1200);
          break;
        case "responding":
          timerRef.current = setTimeout(() => {
            const isLastExchange = exchangeIndex >= script.exchanges.length - 1;
            if (isLastExchange) {
              setPhase("chips");
            } else {
              setPhase("pause");
            }
          }, 800);
          break;
        case "pause":
          // Brief pause before next exchange starts typing
          timerRef.current = setTimeout(() => {
            setExchangeIndex((prev) => prev + 1);
            setPhase("typing");
          }, 600);
          break;
        case "chips":
          timerRef.current = setTimeout(() => {
            // Reset for next portal
            setMessages([]);
            setExchangeIndex(0);
            setScriptIndex((prev) => (prev + 1) % chatScripts.length);
            setPhase("idle");
          }, 3000);
          break;
      }
    },
    [currentExchange, exchangeIndex, script.exchanges.length],
  );

  // Kick off the first cycle
  useEffect(() => {
    const t = setTimeout(() => setPhase("typing"), 800);
    return () => clearTimeout(t);
  }, []);

  // React to phase changes
  useEffect(() => {
    advance(phase);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, advance]);

  // When typewriter finishes, commit the user message and move to thinking
  useEffect(() => {
    if (questionDone && phase === "typing") {
      setMessages((prev) => [...prev, { role: "user", text: currentExchange.user }]);
      timerRef.current = setTimeout(() => setPhase("thinking"), 400);
    }
  }, [questionDone, phase, currentExchange]);

  const showTyping = phase === "typing";
  const showThinking = phase === "thinking";
  const showChips = phase === "chips";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted px-4 py-3">
        <Sparkles size={16} className="text-accent" />
        <span className="text-sm font-medium text-foreground">Montgomery AI Assistant</span>
        <span className="ml-auto text-xs text-muted-foreground">{script.label}</span>
      </div>

      {/* Messages area — scrollable */}
      <div
        ref={scrollRef}
        className="flex h-[380px] flex-col gap-3 overflow-y-auto p-4 scroll-smooth"
      >
        {/* Completed messages */}
        {messages.map((msg, i) => (
          <motion.div
            key={`${scriptIndex}-msg-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("flex items-start gap-2", msg.role === "user" && "justify-end")}
          >
            {msg.role === "ai" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot size={14} className="text-muted-foreground" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "rounded-br-sm bg-accent text-accent-foreground"
                  : "rounded-bl-sm bg-muted whitespace-pre-line leading-relaxed text-muted-foreground",
              )}
            >
              {msg.role === "ai" ? <FormattedResponse text={msg.text} /> : msg.text}
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <User size={14} className="text-accent" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Currently typing user message */}
        <AnimatePresence>
          {showTyping && (
            <motion.div
              key={`typing-${scriptIndex}-${exchangeIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start justify-end gap-2"
            >
              <div className="rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-sm text-accent-foreground ml-auto max-w-[85%]">
                {typedQuestion}
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent-foreground/70" />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20">
                <User size={14} className="text-accent" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thinking shimmer */}
        <AnimatePresence>
          {showThinking && (
            <motion.div
              key={`think-${scriptIndex}-${exchangeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot size={14} className="text-muted-foreground" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm max-w-[85%]">
                <ThinkingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion chips after last exchange */}
        <AnimatePresence>
          {showChips && (
            <motion.div
              key={`chips-${scriptIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-wrap gap-2 pl-9"
            >
              {script.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent"
                >
                  {chip}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer — portal dots + exchange counter */}
      <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {phase !== "idle" && phase !== "chips"
            ? `${Math.min(exchangeIndex + 1, script.exchanges.length)} / ${script.exchanges.length}`
            : phase === "chips"
              ? `${script.exchanges.length} / ${script.exchanges.length}`
              : ""}
        </span>
        <div className="flex items-center gap-2">
          {chatScripts.map((s, i) => (
            <span
              key={s.portal}
              className={cn(
                "rounded-full transition-all duration-300",
                portalDotColors[s.portal],
                i === scriptIndex ? "h-2 w-2" : "h-1.5 w-1.5 opacity-40",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Three animated dots for the "thinking" state */
function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════════════════ */

export function AIDemoSection() {
  return (
    <section className="civic-topo relative overflow-hidden py-fluid-section">
      <div className="mx-auto max-w-7xl px-fluid-md">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            <FadeInWhenVisible>
              <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-accent">
                AI-Powered Insights
              </span>
              <SectionAccent className="mx-0 mb-4" />
              <h2 className="font-display text-fluid-3xl font-bold tracking-tight text-foreground">
                Ask your city anything.
              </h2>
              <p className="mt-4 max-w-lg text-fluid-base leading-relaxed text-muted-foreground">
                Query live city data using plain English. Our AI assistant connects directly to
                Montgomery&apos;s ArcGIS databases, turning complex datasets into clear, actionable
                answers with full source citations.
              </p>
            </FadeInWhenVisible>

            <FadeInWhenVisible delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-3">
                {capabilities.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent"
                  >
                    <Icon size={14} />
                    {label}
                  </div>
                ))}
              </div>
            </FadeInWhenVisible>
          </div>

          {/* Right — chat demo */}
          <FadeInWhenVisible delay={0.2}>
            <ChatDemoCard />
          </FadeInWhenVisible>
        </div>
      </div>
    </section>
  );
}

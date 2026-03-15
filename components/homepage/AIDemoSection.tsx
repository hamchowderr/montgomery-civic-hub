"use client";

import { Bot, Database, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FadeInWhenVisible, SectionAccent } from "@/components/homepage/shared";
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Shield, User } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════ */

type PortalId = "resident" | "business" | "citystaff" | "researcher";

interface Exchange {
  user: string;
  ai: string;
  tool?: { name: string; detail: string };
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
        tool: { name: "arcgis_query", detail: "Querying 311 ServiceRequests layer — grouping by category, sorting by count DESC" },
      },
      {
        user: "Which district am I in if I live near Eastdale Mall?",
        ai: "Eastdale Mall is in **District 3**, represented by Council Member Tracy Larkin. District 3 covers much of east Montgomery including **Eastdale, Dalraida**, and parts of **Vaughn Road**.",
        tool: { name: "arcgis_query", detail: "Geocoding 'Eastdale Mall' → spatial join with CouncilDistricts layer" },
      },
      {
        user: "How does District 3 compare to other districts for pothole repairs?",
        ai: "District 3 ranks **4th of 9** for pothole requests:\n\n- **District 4** — 198 requests (highest)\n- **District 2** — 172\n- **District 7** — 156\n- **District 3** — 134\n\nYour district is **below average** at 14% under the city mean.",
        tool: { name: "arcgis_query", detail: "Filtering 311 requests WHERE category='Pothole' — grouping by district" },
      },
      {
        user: "Are pothole repairs getting faster this year?",
        ai: "Yes! Average resolution time has **improved 18%** YTD:\n\n- **2024 avg:** 12.3 days\n- **2025 avg:** 10.1 days\n- **District 3 specifically:** 8.7 days (faster than city average)\n\nThe Public Works department added 2 new crews in January.",
        tool: { name: "arcgis_query", detail: "Computing AVG(resolution_days) for potholes — grouped by year and district" },
      },
      {
        user: "Show me the nearest open 311 requests to my area",
        ai: "I found **23 open requests** within 1 mile of Eastdale Mall:\n\n- **12** Pothole repairs (3 marked urgent)\n- **6** Street light outages\n- **3** Sidewalk damage\n- **2** Drainage issues\n\nThe closest is a pothole at **Eastern Blvd & Wares Ferry** filed 2 days ago.",
        tool: { name: "arcgis_query", detail: "Spatial query — open requests within 1mi buffer of Eastdale Mall centroid" },
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
        tool: { name: "arcgis_query", detail: "Querying BuildingPermits layer — WHERE status='Active' within 1mi of downtown centroid" },
      },
      {
        user: "What's the average permit approval time?",
        ai: "Current average processing times by permit type:\n\n- **Commercial new build:** 34 days\n- **Renovation/remodel:** 18 days\n- **Sign permits:** 7 days\n- **Temporary use:** 3 days\n\nDown from **42 days average** in 2024 after the city streamlined reviews.",
        tool: { name: "arcgis_query", detail: "Computing AVG(approval_days) on BuildingPermits — grouped by permit_type" },
      },
      {
        user: "Are there any zoning changes planned for the warehouse district?",
        ai: "Yes — the **West Downtown Overlay District** proposal is active:\n\n- **Current zoning:** M-1 (Light Industrial)\n- **Proposed:** MX-2 (Mixed-Use Urban)\n- **Public hearing:** March 27, 2025\n- **Impact:** Allows residential + retail conversion\n\nThis could affect **47 parcels** along Coosa St and Tallapoosa St.",
        tool: { name: "brightdata_search", detail: "Searching Montgomery zoning proposals for 'warehouse district overlay'" },
      },
      {
        user: "What incentives are available for businesses in that area?",
        ai: "Several incentive programs apply to the warehouse district:\n\n- **Historic Tax Credit** — 20% federal + 25% state for qualifying buildings\n- **Opportunity Zone** — Capital gains deferral (Census Tract 12.01)\n- **City facade grant** — Up to **$25,000** for exterior improvements\n- **MIDA bond financing** — Below-market rates for projects over $1M\n\nThe combined incentives can offset **30-40%** of renovation costs.",
        tool: { name: "brightdata_search", detail: "Searching Montgomery business incentive programs for Census Tract 12.01" },
      },
      {
        user: "How many new business licenses were issued downtown this year?",
        ai: "**142 new business licenses** issued downtown YTD:\n\n- **Food & beverage:** 38 (up 22%)\n- **Professional services:** 31\n- **Retail:** 27 (up 15%)\n- **Personal services:** 24\n- **Other:** 22\n\nDowntown is outpacing citywide growth by **2.3x**. Court Square and Dexter Ave corridors are the hottest areas.",
        tool: { name: "arcgis_query", detail: "Querying BusinessLicenses layer — WHERE year=2025 AND area='Downtown'" },
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
        tool: { name: "arcgis_query", detail: "Querying CodeViolations layer — comparing YTD counts by type vs. prior year" },
      },
      {
        user: "Why are structural violations increasing?",
        ai: "Three factors driving the **8% increase** in structural violations:\n\n1. **New inspection program** — 12 inspectors added in Q1 (more eyes)\n2. **Aging housing stock** — District 2 homes avg. **62 years old**\n3. **Storm damage** — February storms caused 47 new cases\n\nWithout the storm surge, structural violations would be **flat YoY**.",
        tool: { name: "arcgis_query", detail: "Filtering CodeViolations WHERE type='Structural' — analyzing monthly trends" },
      },
      {
        user: "What's our compliance rate for resolved violations?",
        ai: "Overall compliance rate: **73%** (voluntary resolution within 30 days)\n\n**By type:**\n- Weed/Vegetation: **89%** (easiest to fix)\n- Junk vehicles: **71%**\n- Structural: **52%** (longest resolution)\n- Demolition candidates: **12%** (requires legal action)\n\nUp from **67%** last year after adding the compliance assistance program.",
        tool: { name: "arcgis_query", detail: "Computing compliance_rate on CodeViolations — WHERE resolved_within_30d=true" },
      },
      {
        user: "Which council districts need the most attention right now?",
        ai: "**Priority districts** based on open violations per capita:\n\n1. **District 2** — 18.4/1K residents (312 open cases)\n2. **District 4** — 14.7/1K (267 open cases)\n3. **District 8** — 11.2/1K (198 open cases)\n\nDistrict 2 also has the longest avg. resolution time at **47 days** vs. the city average of **28 days**.",
        tool: { name: "arcgis_query", detail: "Joining CodeViolations with CensusPopulation — computing per-capita rates by district" },
      },
      {
        user: "Generate a summary for the council briefing",
        ai: "**Code Enforcement Monthly Brief — March 2025**\n\n- Total violations: **1,847** (↓12% YoY)\n- Compliance rate: **73%** (↑6pt YoY)\n- Avg. resolution: **28 days** (↓4 days)\n- Budget utilization: **67%** ($2.1M of $3.1M)\n\n**Action items:** District 2 task force, storm damage follow-up, Q2 inspector hiring.",
        tool: { name: "arcgis_query", detail: "Aggregating CodeViolations + Budget data — generating summary statistics" },
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
        tool: { name: "arcgis_query", detail: "Querying CrimeIncidents layer — computing per-capita rates by district" },
      },
      {
        user: "Is there a correlation between 311 requests and crime rates?",
        ai: "Strong positive correlation detected: **r = 0.78** (p < 0.01)\n\nDistricts with high 311 volume also show elevated crime:\n- **District 2:** High 311 + High crime\n- **District 7:** Low 311 + Low crime\n\nBroken windows theory may apply — **code violations** show even stronger correlation at **r = 0.84**.",
        tool: { name: "arcgis_query", detail: "Joining 311 ServiceRequests with CrimeIncidents by district — Pearson correlation" },
      },
      {
        user: "What datasets are available for demographic analysis?",
        ai: "**12 demographic datasets** available:\n\n- ACS 5-year estimates (2020-2024)\n- Montgomery Census tracts (119 tracts)\n- Household income by block group\n- Population density grids\n- Age distribution pyramids\n- Racial/ethnic composition\n- Housing tenure (own vs. rent)\n\nAll linkable by **FIPS code** or **spatial join** to any city dataset.",
        tool: { name: "arcgis_query", detail: "Listing available FeatureServer layers — filtering for demographic/census data" },
      },
      {
        user: "Can you cross-reference income levels with service request density?",
        ai: "Cross-analysis of median household income vs. 311 density:\n\n- **< $30K areas:** 42.1 requests/1K (highest)\n- **$30-50K areas:** 28.7 requests/1K\n- **$50-75K areas:** 18.3 requests/1K\n- **> $75K areas:** 11.2 requests/1K\n\nInverse correlation: **r = -0.82**. Lower-income areas file **3.8x more** requests but have **1.4x longer** resolution times.",
        tool: { name: "arcgis_query", detail: "Spatial join — 311 requests with ACS income by block group, computing density" },
      },
      {
        user: "Export this analysis with methodology notes",
        ai: "Export package prepared with **4 components**:\n\n1. **Dataset** — 2,847 records, CSV + GeoJSON formats\n2. **Methodology** — OLS regression, spatial autocorrelation (Moran's I), significance tests\n3. **Visualizations** — Choropleth maps, scatter plots, time series\n4. **Citations** — Montgomery GIS FeatureServer, ACS 2024, AL Open Records\n\nAll sources are **reproducible** with included query parameters.",
        tool: { name: "arcgis_query", detail: "Packaging query results with regression output — generating CSV + GeoJSON" },
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

const portalChatStyles: Record<PortalId, { bubble: string; avatar: string; chip: string }> = {
  resident: {
    bubble: "bg-portal-resident text-white",
    avatar: "bg-portal-resident/20",
    chip: "border-portal-resident/20 bg-portal-resident/5 text-portal-resident",
  },
  business: {
    bubble: "bg-portal-business text-white",
    avatar: "bg-portal-business/20",
    chip: "border-portal-business/20 bg-portal-business/5 text-portal-business",
  },
  citystaff: {
    bubble: "bg-portal-citystaff text-white",
    avatar: "bg-portal-citystaff/20",
    chip: "border-portal-citystaff/20 bg-portal-citystaff/5 text-portal-citystaff",
  },
  researcher: {
    bubble: "bg-portal-researcher text-white",
    avatar: "bg-portal-researcher/20",
    chip: "border-portal-researcher/20 bg-portal-researcher/5 text-portal-researcher",
  },
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

function useTypewriter(text: string, active: boolean, speed = 55) {
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

type DemoPhase = "typing" | "thinking" | "toolcall" | "responding" | "pause" | "chips" | "idle";

interface VisibleMessage {
  role: "user" | "ai";
  text: string;
  tool?: { name: string; detail: string };
}

function ChatDemoCard() {
  const [scriptIndex, setScriptIndex] = useState(0);
  const [exchangeIndex, setExchangeIndex] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const script = chatScripts[scriptIndex];
  const currentExchange = script.exchanges[exchangeIndex];

  const { displayed: typedQuestion, done: questionDone } = useTypewriter(
    currentExchange?.user ?? "",
    phase === "typing",
    45,
  );

  // Detect manual scroll — if user scrolls up, stop auto-scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      userScrolledRef.current = !atBottom;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset scroll lock when script changes (new portal)
  useEffect(() => {
    userScrolledRef.current = false;
  }, [scriptIndex]);

  // Auto-scroll to bottom only when user hasn't manually scrolled up
  useEffect(() => {
    if (scrollRef.current && !userScrolledRef.current) {
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
            if (currentExchange.tool) {
              setPhase("toolcall");
            } else {
              setMessages((prev) => [...prev, { role: "ai", text: currentExchange.ai }]);
              setPhase("responding");
            }
          }, 1000);
          break;
        case "toolcall":
          timerRef.current = setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { role: "ai", text: currentExchange.ai, tool: currentExchange.tool },
            ]);
            setPhase("responding");
          }, 2000);
          break;
        case "responding":
          timerRef.current = setTimeout(() => {
            const isLastExchange = exchangeIndex >= script.exchanges.length - 1;
            if (isLastExchange) {
              setPhase("chips");
            } else {
              setPhase("pause");
            }
          }, 1500);
          break;
        case "pause":
          // Brief pause before next exchange starts typing
          timerRef.current = setTimeout(() => {
            setExchangeIndex((prev) => prev + 1);
            setPhase("typing");
          }, 1200);
          break;
        case "chips":
          timerRef.current = setTimeout(() => {
            // Reset for next portal
            setMessages([]);
            setExchangeIndex(0);
            userScrolledRef.current = false;
            setScriptIndex((prev) => (prev + 1) % chatScripts.length);
            setPhase("idle");
          }, 5000);
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
      timerRef.current = setTimeout(() => setPhase("thinking"), 700);
    }
  }, [questionDone, phase, currentExchange]);

  // Navigate to a specific script (portal)
  const goToScript = useCallback(
    (index: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessages([]);
      setExchangeIndex(0);
      setScriptIndex(index);
      userScrolledRef.current = false;
      setPhase("idle");
      // Restart after a brief delay
      timerRef.current = setTimeout(() => setPhase("typing"), 600);
    },
    [],
  );

  const goPrev = useCallback(() => {
    goToScript((scriptIndex - 1 + chatScripts.length) % chatScripts.length);
  }, [scriptIndex, goToScript]);

  const goNext = useCallback(() => {
    goToScript((scriptIndex + 1) % chatScripts.length);
  }, [scriptIndex, goToScript]);

  const chatStyles = portalChatStyles[script.portal];
  const showTyping = phase === "typing" && !questionDone;
  const showThinking = phase === "thinking";
  const showToolCall = phase === "toolcall" && currentExchange?.tool;
  const showChips = phase === "chips";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted px-4 py-3">
        <Bot size={16} className="text-accent" />
        <span className="text-sm font-medium text-foreground">Montgomery AI Assistant</span>
        <span className="ml-auto text-xs text-muted-foreground">{script.label}</span>
      </div>

      {/* Messages area — scrollable */}
      <div
        ref={scrollRef}
        className="flex h-[460px] flex-col gap-3 overflow-y-auto p-4 scroll-smooth"
      >
        {/* Completed messages */}
        {messages.map((msg, i) => (
          <motion.div
            key={`${scriptIndex}-msg-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              msg.role === "user" ? "flex items-start justify-end gap-2" : "flex flex-col gap-2 pl-0",
            )}
          >
            {msg.role === "ai" && msg.tool && (
              <div className="pl-9">
                <ToolCallDropdown tool={msg.tool} isRunning={false} />
              </div>
            )}
            <div className={cn("flex items-start gap-2", msg.role === "user" && "justify-end")}>
              {msg.role === "ai" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot size={14} className="text-muted-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? cn("rounded-br-sm", chatStyles.bubble)
                    : "rounded-bl-sm bg-muted whitespace-pre-line leading-relaxed text-muted-foreground",
                )}
              >
                {msg.role === "ai" ? <FormattedResponse text={msg.text} /> : msg.text}
              </div>
              {msg.role === "user" && (
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", chatStyles.avatar)}>
                  <User size={14} className="text-current opacity-70" />
                </div>
              )}
            </div>
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
              <div className={cn("rounded-2xl rounded-br-sm px-4 py-2.5 text-sm ml-auto max-w-[85%]", chatStyles.bubble)}>
                {typedQuestion}
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-white/70" />
              </div>
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", chatStyles.avatar)}>
                <User size={14} className="text-current opacity-70" />
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

        {/* Tool call collapsible dropdown */}
        <AnimatePresence>
          {showToolCall && currentExchange?.tool && (
            <motion.div
              key={`tool-${scriptIndex}-${exchangeIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pl-9"
            >
              <ToolCallDropdown
                tool={currentExchange.tool}
                isRunning={phase === "toolcall"}
              />
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
                  className={cn("rounded-full border px-3 py-1 text-xs font-medium", chatStyles.chip)}
                >
                  {chip}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer — arrows + exchange counter + portal dots */}
      <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {phase !== "idle" && phase !== "chips"
            ? `${Math.min(exchangeIndex + 1, script.exchanges.length)} / ${script.exchanges.length}`
            : phase === "chips"
              ? `${script.exchanges.length} / ${script.exchanges.length}`
              : ""}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous portal"
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {chatScripts.map((s, i) => (
              <button
                type="button"
                key={s.portal}
                onClick={() => goToScript(i)}
                aria-label={`Go to ${s.label}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  portalDotColors[s.portal],
                  i === scriptIndex ? "h-2.5 w-2.5" : "h-1.5 w-1.5 opacity-40 hover:opacity-70",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next portal"
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Collapsible tool call indicator shown during AI processing */
function ToolCallDropdown({
  tool,
  isRunning,
}: {
  tool: { name: string; detail: string };
  isRunning: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/40 bg-muted/50 text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {isRunning ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Search size={12} className="text-accent" />
          </motion.div>
        ) : (
          <Search size={12} className="text-muted-foreground" />
        )}
        <span className={cn("font-medium", isRunning ? "text-accent" : "text-muted-foreground")}>
          {isRunning ? `Running ${tool.name}...` : `Used ${tool.name}`}
        </span>
        <motion.span
          className="ml-auto"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} className="text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 px-3 py-2 text-muted-foreground">
              {tool.detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  GraduationCap,
  Home,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Minus,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════ */

type PortalId = "resident" | "business" | "citystaff" | "researcher";
type FeatureId = "map" | "chat" | "table" | "chart";

const portalStyles = {
  resident: {
    text: "text-portal-resident",
    bg: "bg-portal-resident",
    bgLight: "bg-portal-resident/10",
    border: "border-portal-resident/30",
  },
  business: {
    text: "text-portal-business",
    bg: "bg-portal-business",
    bgLight: "bg-portal-business/10",
    border: "border-portal-business/30",
  },
  citystaff: {
    text: "text-portal-citystaff",
    bg: "bg-portal-citystaff",
    bgLight: "bg-portal-citystaff/10",
    border: "border-portal-citystaff/30",
  },
  researcher: {
    text: "text-portal-researcher",
    bg: "bg-portal-researcher",
    bgLight: "bg-portal-researcher/10",
    border: "border-portal-researcher/30",
  },
} as const;

interface PortalConfig {
  id: PortalId;
  label: string;
  icon: typeof Home;
  href: string;
  features: FeatureConfig[];
}

interface FeatureConfig {
  id: FeatureId;
  name: string;
  description: string;
  icon: typeof MapPin;
  featured?: boolean;
}

const portals: PortalConfig[] = [
  {
    id: "resident",
    label: "Resident",
    icon: Home,
    href: "/resident",
    features: [
      {
        id: "chat",
        name: "AI Civic Assistant",
        description:
          "Ask questions about 311 requests, safety, and city services in plain English.",
        icon: MessageSquare,
        featured: true,
      },
      {
        id: "map",
        name: "Neighborhood Map",
        description:
          "See 311 requests, code violations, and services plotted across all 9 districts.",
        icon: MapPin,
      },
      {
        id: "table",
        name: "Service Request Data",
        description: "Browse, filter, and sort 311 service requests with full detail views.",
        icon: Table2,
      },
      {
        id: "chart",
        name: "Trend Analysis",
        description: "Track request volumes, response times, and resolution rates over time.",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: Briefcase,
    href: "/business",
    features: [
      {
        id: "map",
        name: "Permit & License Map",
        description: "Find active construction permits, business licenses, and development sites.",
        icon: MapPin,
        featured: true,
      },
      {
        id: "chat",
        name: "Business AI Assistant",
        description: "Get answers about permits, zoning, and economic opportunities in Montgomery.",
        icon: MessageSquare,
      },
      {
        id: "table",
        name: "Permit Database",
        description: "Search construction permits by address, contractor, type, and status.",
        icon: Table2,
      },
      {
        id: "chart",
        name: "Market Analytics",
        description: "Analyze permit trends, license activity, and development patterns.",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "citystaff",
    label: "City Staff",
    icon: Building2,
    href: "/citystaff",
    features: [
      {
        id: "chart",
        name: "Executive Dashboard",
        description:
          "Key performance indicators for public safety, infrastructure, and 311 trends.",
        icon: BarChart3,
        featured: true,
      },
      {
        id: "map",
        name: "Infrastructure Map",
        description: "Monitor code violations, fire incidents, and facility conditions citywide.",
        icon: MapPin,
      },
      {
        id: "chat",
        name: "Staff AI Briefing",
        description: "Generate data-backed briefings for the mayor and department heads.",
        icon: MessageSquare,
      },
      {
        id: "table",
        name: "Operations Data",
        description: "Access violation records, inspection logs, and compliance tracking.",
        icon: Table2,
      },
    ],
  },
  {
    id: "researcher",
    label: "Researcher",
    icon: GraduationCap,
    href: "/researcher",
    features: [
      {
        id: "table",
        name: "Dataset Explorer",
        description:
          "Access 40+ city datasets with full attribute details and export capabilities.",
        icon: Table2,
        featured: true,
      },
      {
        id: "chart",
        name: "Cross-Dataset Analysis",
        description: "Compare crime trends, demographics, and land use patterns across districts.",
        icon: BarChart3,
      },
      {
        id: "map",
        name: "Spatial Analysis",
        description:
          "Overlay multiple datasets on interactive maps with council district boundaries.",
        icon: MapPin,
      },
      {
        id: "chat",
        name: "Research AI",
        description: "Query datasets with methodology transparency and data source citations.",
        icon: MessageSquare,
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════
   Chat Demo Data
   ═══════════════════════════════════════════════════════ */

const chatScripts: Record<
  PortalId,
  { question: string; tool: string; response: string; chips: string[] }
> = {
  resident: {
    question: "What are the most common 311 requests in Montgomery this year?",
    tool: "Querying Montgomery ArcGIS \u2014 311 Service Requests...",
    response: `Based on the latest 311 data from Montgomery's ArcGIS system, the top service requests this year are:

1. **Garbage/Trash Collection** \u2014 2,847 requests
2. **Street Light Outages** \u2014 1,523 requests
3. **Pothole Repairs** \u2014 1,198 requests
4. **Code Violations** \u2014 956 requests
5. **Storm Drainage** \u2014 743 requests

District 4 has the highest volume overall. Would you like me to show these on a map?`,
    chips: ["Show on map", "Compare districts", "View trends"],
  },
  business: {
    question: "Show me active construction permits near downtown",
    tool: "Querying Montgomery ArcGIS \u2014 Construction Permits...",
    response: `I found **23 active construction permits** within 1 mile of downtown Montgomery:

1. **Mixed-Use Development** \u2014 Dexter Ave, $4.2M
2. **Office Renovation** \u2014 Commerce St, $1.8M
3. **Retail Buildout** \u2014 Court Square, $920K

The downtown corridor is seeing 34% more permit activity than last year.`,
    chips: ["View on map", "Filter by type", "Export data"],
  },
  citystaff: {
    question: "What\u2019s the code violation trend this year?",
    tool: "Querying Montgomery ArcGIS \u2014 Code Violations...",
    response: `Code violations are **down 12% YTD** compared to last year:

- **Weed/Vegetation** \u2014 decreased 23% (1,204 \u2192 927)
- **Structural Complaints** \u2014 increased 8% (456 \u2192 492)
- **Junk Vehicles** \u2014 decreased 15% (312 \u2192 265)

Districts 2 and 4 account for 41% of all violations.`,
    chips: ["District breakdown", "Monthly trend", "Compliance rate"],
  },
  researcher: {
    question: "Compare crime data across all districts",
    tool: "Querying Montgomery ArcGIS \u2014 Crime Reports...",
    response: `Per-capita crime rates by district (per 1,000 residents):

1. **District 2** \u2014 34.2/1K (highest)
2. **District 4** \u2014 28.7/1K
3. **District 1** \u2014 25.1/1K
4. **District 7** \u2014 12.8/1K (lowest)

Property crime accounts for **68%** of all incidents citywide. Violent crime is down 7% YTD.`,
    chips: ["Export CSV", "Methodology", "Time series"],
  },
};

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

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

/** Render markdown-style bold (**text**) as <strong> */
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ═══════════════════════════════════════════════════════
   Bento Feature Card
   ═══════════════════════════════════════════════════════ */

function FeatureCard({
  feature,
  portalId,
  onClick,
}: {
  feature: FeatureConfig;
  portalId: PortalId;
  onClick: () => void;
}) {
  const styles = portalStyles[portalId];
  const Icon = feature.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-xl border bg-card p-5 transition-all duration-200 hover:bg-muted/50",
        "hover:border-foreground/10",
        feature.featured && "sm:col-span-2 p-6",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            styles.bgLight,
          )}
        >
          <Icon className={cn("h-4 w-4", styles.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 text-sm font-medium text-foreground">{feature.name}</h4>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </div>
      </div>

      {/* Play indicator on hover */}
      <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
        <Play className={cn("h-3.5 w-3.5", styles.text)} />
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline Chat Demo
   ═══════════════════════════════════════════════════════ */

type ChatPhase = "typing" | "tool" | "responding" | "done";

function InlineChatDemo({ portalId }: { portalId: PortalId }) {
  const script = chatScripts[portalId];
  const [phase, setPhase] = useState<ChatPhase>("typing");
  const [charIndex, setCharIndex] = useState(0);
  // Key to force full replay when a suggestion chip is clicked
  const [replayKey, setReplayKey] = useState(0);

  const handleChipClick = useCallback(() => {
    setPhase("typing");
    setCharIndex(0);
    setReplayKey((k) => k + 1);
  }, []);

  // Realistic timeline: typing 1.2s -> tool use 2.5s -> responding char-by-char
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("tool"), 1200));
    timers.push(setTimeout(() => setPhase("responding"), 3700));
    return () => timers.forEach(clearTimeout);
  }, [replayKey]);

  // Realistic typewriter: 1 char at ~25ms (readable speed)
  useEffect(() => {
    if (phase !== "responding") return;
    if (charIndex >= script.response.length) {
      const timer = setTimeout(() => setPhase("done"), 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => setCharIndex((prev) => Math.min(prev + 1, script.response.length)),
      25,
    );
    return () => clearTimeout(timer);
  }, [phase, charIndex, script.response.length]);

  const showTool = phase === "tool" || phase === "responding" || phase === "done";
  const showResponse = phase === "responding" || phase === "done";
  const showChips = phase === "done";
  const isToolStreaming = phase === "tool";
  const displayedResponse = showResponse ? script.response.slice(0, charIndex) : "";

  const portalStyle = portalStyles[portalId];

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <div className={cn("flex size-6 items-center justify-center rounded", portalStyle.bgLight)}>
          <Sparkles className={cn("size-3.5", portalStyle.text)} />
        </div>
        <span className="text-sm font-semibold">Civic Assistant</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Message area */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* User message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Message from="user">
            <MessageContent>{script.question}</MessageContent>
          </Message>
        </motion.div>

        {/* Typing indicator */}
        {phase === "typing" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div
              className={cn("flex size-6 items-center justify-center rounded", portalStyle.bgLight)}
            >
              <Sparkles className={cn("size-3.5", portalStyle.text)} />
            </div>
            <div className="flex items-center gap-1 px-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground/50"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Tool use / Reasoning block */}
        {showTool && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Reasoning
              isStreaming={isToolStreaming}
              defaultOpen={true}
              duration={isToolStreaming ? undefined : 1}
            >
              <ReasoningTrigger
                getThinkingMessage={(streaming, duration) => {
                  if (streaming) {
                    return <Shimmer duration={1}>{script.tool}</Shimmer>;
                  }
                  return (
                    <span className="text-muted-foreground">
                      Queried ArcGIS in {duration ?? 1}s
                    </span>
                  );
                }}
              />
              <ReasoningContent>
                {`Searching Montgomery ArcGIS FeatureServer...\nFiltering by date range and district boundaries.\nFound ${portalId === "business" ? "23" : portalId === "resident" ? "8,267" : "1,684"} matching records.`}
              </ReasoningContent>
            </Reasoning>
          </motion.div>
        )}

        {/* AI response */}
        {showResponse && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Message from="assistant">
              <MessageContent>
                <div className="text-sm leading-relaxed">
                  {displayedResponse.split("\n").map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {renderBoldText(line)}
                    </span>
                  ))}
                  {charIndex < script.response.length && (
                    <motion.span
                      className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-foreground/60"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </MessageContent>
            </Message>
          </motion.div>
        )}

        {/* Suggestion chips */}
        {showChips && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suggestions className="gap-1.5">
              {script.chips.map((chip, i) => (
                <motion.div
                  key={chip}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.08 }}
                >
                  <Suggestion
                    suggestion={chip}
                    onClick={handleChipClick}
                    variant="outline"
                    size="sm"
                    className="h-7 cursor-pointer border-accent/20 text-xs font-medium text-accent hover:bg-accent/10 hover:text-accent"
                  />
                </motion.div>
              ))}
            </Suggestions>
          </motion.div>
        )}
      </div>

      {/* Decorative input bar */}
      <div className="border-t px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <span className="flex-1 text-xs text-muted-foreground/60">
            Ask about Montgomery data...
          </span>
          <div
            className={cn("flex size-6 items-center justify-center rounded", portalStyle.bgLight)}
          >
            <ArrowRight className={cn("size-3", portalStyle.text)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline Map Demo — Real MapLibre map
   ═══════════════════════════════════════════════════════ */

const PORTAL_HEX: Record<PortalId, string> = {
  resident: "#1482c8",
  business: "#f07818",
  citystaff: "#279a6b",
  researcher: "#7c4dcc",
};

const PORTAL_HEX_SECONDARY: Record<PortalId, string> = {
  resident: "#3b82f6",
  business: "#f59e0b",
  citystaff: "#10b981",
  researcher: "#a78bfa",
};

const mapLegendLayers: Record<PortalId, string[]> = {
  resident: ["311 Requests", "Code Violations", "Services"],
  business: ["Permits", "Licenses", "Dev Sites"],
  citystaff: ["Fire Incidents", "Violations", "Infrastructure"],
  researcher: ["Crime Data", "Demographics", "Land Use"],
};

/** Generate demo GeoJSON points scattered around Montgomery */
function makeDemoPoints(portalId: PortalId): GeoJSON.FeatureCollection<GeoJSON.Point> {
  // Real locations around Montgomery for each portal
  const seeds: Record<PortalId, [number, number][]> = {
    resident: [
      [-86.3005, 32.3754],
      [-86.2741, 32.3618],
      [-86.3198, 32.3931],
      [-86.2592, 32.3821],
      [-86.3412, 32.3587],
      [-86.2865, 32.4012],
      [-86.3321, 32.3725],
      [-86.2678, 32.3492],
      [-86.3078, 32.4105],
      [-86.2952, 32.3551],
      [-86.3185, 32.3665],
      [-86.2813, 32.3878],
      [-86.3451, 32.3812],
      [-86.2601, 32.3745],
      [-86.3092, 32.3498],
      [-86.3275, 32.4055],
      [-86.272, 32.3925],
      [-86.3388, 32.361],
    ],
    business: [
      [-86.3077, 32.3792],
      [-86.3015, 32.3761],
      [-86.312, 32.381],
      [-86.2985, 32.373],
      [-86.3155, 32.3845],
      [-86.2905, 32.3695],
      [-86.3198, 32.3778],
      [-86.3045, 32.385],
      [-86.287, 32.3715],
      [-86.325, 32.381],
      [-86.2955, 32.3765],
      [-86.308, 32.368],
    ],
    citystaff: [
      [-86.3077, 32.3792],
      [-86.29, 32.365],
      [-86.325, 32.39],
      [-86.275, 32.38],
      [-86.34, 32.37],
      [-86.31, 32.4],
      [-86.28, 32.355],
      [-86.335, 32.385],
      [-86.265, 32.375],
      [-86.318, 32.362],
      [-86.295, 32.392],
      [-86.328, 32.358],
    ],
    researcher: [
      [-86.3077, 32.3792],
      [-86.285, 32.365],
      [-86.33, 32.392],
      [-86.26, 32.378],
      [-86.345, 32.36],
      [-86.315, 32.405],
      [-86.27, 32.35],
      [-86.338, 32.38],
      [-86.255, 32.385],
      [-86.32, 32.355],
      [-86.29, 32.4],
      [-86.31, 32.345],
      [-86.278, 32.37],
      [-86.342, 32.375],
    ],
  };

  const layerLabels = mapLegendLayers[portalId];
  return {
    type: "FeatureCollection",
    features: seeds[portalId].map((coords, i) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: coords },
      properties: { layer: i % 3, label: layerLabels[i % 3] },
    })),
  };
}

function InlineMapDemo({ portalId }: { portalId: PortalId }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styles = portalStyles[portalId];
  const primary = PORTAL_HEX[portalId];
  const secondary = PORTAL_HEX_SECONDARY[portalId];
  const legendLayers = mapLegendLayers[portalId];
  const layerColors = [primary, secondary, PORTAL_HEX_SECONDARY[portalId]];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import maplibre to avoid SSR issues
    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current) return;

      const isDark =
        document.documentElement.classList.contains("dark") ||
        (!document.documentElement.classList.contains("light") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: isDark
          ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: [-86.3077, 32.3792],
        zoom: 11.5,
        attributionControl: false,
        interactive: false, // static demo — no pan/zoom
      });

      map.on("load", () => {
        const points = makeDemoPoints(portalId);

        // Add three separate layers for the three data categories
        [0, 1, 2].forEach((layerIdx) => {
          const filtered: GeoJSON.FeatureCollection<GeoJSON.Point> = {
            type: "FeatureCollection",
            features: points.features.filter((f) => f.properties?.layer === layerIdx),
          };

          map.addSource(`demo-${layerIdx}`, {
            type: "geojson",
            data: filtered,
          });

          // Glow ring
          map.addLayer({
            id: `demo-glow-${layerIdx}`,
            type: "circle",
            source: `demo-${layerIdx}`,
            paint: {
              "circle-radius": 12,
              "circle-color": layerColors[layerIdx],
              "circle-opacity": 0.12,
              "circle-blur": 1,
            },
          });

          // Core dot
          map.addLayer({
            id: `demo-dot-${layerIdx}`,
            type: "circle",
            source: `demo-${layerIdx}`,
            paint: {
              "circle-radius": 5,
              "circle-color": layerColors[layerIdx],
              "circle-opacity": 0.85,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-opacity": 0.4,
            },
          });
        });
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [portalId, primary, secondary, layerColors]);

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      {/* Map toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <MapPin className={cn("h-3.5 w-3.5", styles.text)} />
          <span className="text-xs font-medium">Montgomery, AL</span>
          <span className="text-[0.6rem] text-muted-foreground">32.3792° N, 86.3077° W</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center rounded border bg-background">
            <span className="px-1.5 py-0.5 text-muted-foreground">
              <Plus className="h-3 w-3" />
            </span>
            <div className="h-3 w-px bg-border" />
            <span className="px-1.5 py-0.5 text-muted-foreground">
              <Minus className="h-3 w-3" />
            </span>
          </div>
          <span className="ml-1 rounded border bg-background px-1.5 py-0.5 text-muted-foreground">
            <Compass className="h-3 w-3" />
          </span>
          <span className="rounded border bg-background px-1.5 py-0.5 text-muted-foreground">
            <Layers className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Real MapLibre map */}
      <div className="relative">
        <div ref={mapContainerRef} className="h-[360px] w-full sm:h-[420px]" />

        {/* Legend overlay */}
        <motion.div
          className="absolute bottom-3 left-3 flex flex-col gap-1 rounded-md border border-white/10 bg-black/60 px-2.5 py-2 backdrop-blur-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <span className="text-[0.5rem] font-semibold uppercase tracking-widest text-white/50">
            Layers
          </span>
          {legendLayers.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: layerColors[i] }}
              />
              <span className="text-[0.6rem] text-white/70">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 divide-x border-t bg-muted/20">
        {[
          {
            label: "Data Points",
            value: `${makeDemoPoints(portalId).features.length * 80}+`,
          },
          { label: "Districts", value: "9" },
          { label: "Updated", value: "Live" },
        ].map((stat) => (
          <div key={stat.label} className="px-3 py-2 text-center">
            <div className="text-sm font-bold">{stat.value}</div>
            <div className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline Table Demo
   ═══════════════════════════════════════════════════════ */

type StatusColor = "green" | "blue" | "amber" | "red" | "gray";

interface TableRow {
  id: string;
  name: string;
  location: string;
  status: string;
  statusColor: StatusColor;
  date: string;
  value?: string;
}

const STATUS_BADGE_CLASSES: Record<StatusColor, string> = {
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  red: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  gray: "bg-muted text-muted-foreground border-border",
};

const STATUS_DOT_CLASSES: Record<StatusColor, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-muted-foreground",
};

const tableData: Record<
  PortalId,
  {
    columns: { key: string; label: string; align?: "right" }[];
    rows: TableRow[];
    totalRecords: number;
    filterPlaceholder: string;
  }
> = {
  resident: {
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Request" },
      { key: "location", label: "District" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ],
    filterPlaceholder: "Filter by type, district, status...",
    totalRecords: 8947,
    rows: [
      {
        id: "SR-4821",
        name: "Pothole Repair",
        location: "District 3",
        status: "In Progress",
        statusColor: "blue",
        date: "Mar 5, 2025",
      },
      {
        id: "SR-4820",
        name: "Street Light Out",
        location: "District 7",
        status: "Completed",
        statusColor: "green",
        date: "Mar 4, 2025",
      },
      {
        id: "SR-4819",
        name: "Illegal Dumping",
        location: "District 2",
        status: "Open",
        statusColor: "red",
        date: "Mar 3, 2025",
      },
      {
        id: "SR-4818",
        name: "Trash Pickup Missed",
        location: "District 4",
        status: "Completed",
        statusColor: "green",
        date: "Mar 2, 2025",
      },
      {
        id: "SR-4817",
        name: "Storm Drain Blocked",
        location: "District 1",
        status: "In Progress",
        statusColor: "blue",
        date: "Mar 1, 2025",
      },
      {
        id: "SR-4816",
        name: "Graffiti Removal",
        location: "District 5",
        status: "On Hold",
        statusColor: "amber",
        date: "Feb 28, 2025",
      },
    ],
  },
  business: {
    columns: [
      { key: "id", label: "Permit #" },
      { key: "name", label: "Project" },
      { key: "location", label: "Address" },
      { key: "status", label: "Status" },
      { key: "value", label: "Value", align: "right" },
    ],
    filterPlaceholder: "Filter by permit, address, status...",
    totalRecords: 2156,
    rows: [
      {
        id: "BP-1247",
        name: "Commercial Build",
        location: "123 Dexter Ave",
        status: "Issued",
        statusColor: "blue",
        date: "Mar 5, 2025",
        value: "$4.2M",
      },
      {
        id: "BP-1246",
        name: "Office Renovation",
        location: "456 Commerce St",
        status: "Completed",
        statusColor: "green",
        date: "Mar 4, 2025",
        value: "$1.8M",
      },
      {
        id: "BP-1245",
        name: "Retail Buildout",
        location: "789 Court Sq",
        status: "Requested",
        statusColor: "amber",
        date: "Mar 3, 2025",
        value: "$920K",
      },
      {
        id: "BP-1244",
        name: "Office TI",
        location: "321 Monroe St",
        status: "Approved",
        statusColor: "blue",
        date: "Mar 2, 2025",
        value: "$340K",
      },
      {
        id: "BP-1243",
        name: "Restaurant Build",
        location: "654 Bell St",
        status: "Denied",
        statusColor: "red",
        date: "Mar 1, 2025",
        value: "$280K",
      },
      {
        id: "BP-1242",
        name: "Warehouse Reno",
        location: "987 Holt St",
        status: "Issued",
        statusColor: "blue",
        date: "Feb 28, 2025",
        value: "$510K",
      },
    ],
  },
  citystaff: {
    columns: [
      { key: "id", label: "Case #" },
      { key: "name", label: "Violation" },
      { key: "location", label: "District" },
      { key: "status", label: "Priority" },
      { key: "date", label: "Inspector" },
    ],
    filterPlaceholder: "Filter by violation, district, priority...",
    totalRecords: 3891,
    rows: [
      {
        id: "CV-3021",
        name: "Weed/Vegetation",
        location: "District 2",
        status: "Medium",
        statusColor: "amber",
        date: "J. Williams",
      },
      {
        id: "CV-3020",
        name: "Structural Damage",
        location: "District 4",
        status: "High",
        statusColor: "red",
        date: "R. Davis",
      },
      {
        id: "CV-3019",
        name: "Junk Vehicle",
        location: "District 3",
        status: "Low",
        statusColor: "green",
        date: "M. Johnson",
      },
      {
        id: "CV-3018",
        name: "Property Overgrowth",
        location: "District 1",
        status: "Medium",
        statusColor: "amber",
        date: "S. Brown",
      },
      {
        id: "CV-3017",
        name: "Unsafe Building",
        location: "District 5",
        status: "High",
        statusColor: "red",
        date: "K. Anderson",
      },
      {
        id: "CV-3016",
        name: "Illegal Sign",
        location: "District 6",
        status: "Low",
        statusColor: "green",
        date: "T. Harris",
      },
    ],
  },
  researcher: {
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Dataset" },
      { key: "value", label: "Records", align: "right" },
      { key: "status", label: "Frequency" },
      { key: "date", label: "Format" },
    ],
    filterPlaceholder: "Filter by dataset, format, frequency...",
    totalRecords: 42,
    rows: [
      {
        id: "DS-001",
        name: "Crime Reports 2025",
        location: "",
        status: "Daily",
        statusColor: "green",
        date: "GeoJSON",
        value: "14,823",
      },
      {
        id: "DS-002",
        name: "311 Service Requests",
        location: "",
        status: "Real-time",
        statusColor: "blue",
        date: "REST API",
        value: "8,947",
      },
      {
        id: "DS-003",
        name: "Census Blocks",
        location: "",
        status: "Decennial",
        statusColor: "gray",
        date: "Shapefile",
        value: "3,214",
      },
      {
        id: "DS-004",
        name: "Business Licenses",
        location: "",
        status: "Monthly",
        statusColor: "amber",
        date: "CSV",
        value: "2,156",
      },
      {
        id: "DS-005",
        name: "Fire Incidents",
        location: "",
        status: "Daily",
        statusColor: "green",
        date: "REST API",
        value: "1,892",
      },
      {
        id: "DS-006",
        name: "Building Permits",
        location: "",
        status: "Weekly",
        statusColor: "blue",
        date: "GeoJSON",
        value: "4,310",
      },
    ],
  },
};

function InlineTableDemo({ portalId }: { portalId: PortalId }) {
  const data = tableData[portalId];
  const styles = portalStyles[portalId];

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  // Filter rows by search
  const filtered = data.rows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.id.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q) ||
      row.location.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q) ||
      (row.date?.toLowerCase().includes(q) ?? false) ||
      (row.value?.toLowerCase().includes(q) ?? false)
    );
  });

  // Sort filtered rows
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a[sortKey as keyof typeof a] ?? "").toString();
    const bVal = (b[sortKey as keyof typeof b] ?? "").toString();
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table2 className={cn("h-4 w-4", styles.text)} />
          <span className="text-sm font-semibold">Data Explorer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-[0.65rem] font-medium text-muted-foreground">
            <Download className="h-3 w-3" />
            Export
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            {data.totalRecords.toLocaleString()} records
          </span>
        </div>
      </div>

      {/* Working search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={data.filterPlaceholder}
            className="flex h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="text-[10px] font-medium">✕</span>
            </button>
          )}
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {data.columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                      sortKey === col.key && "text-foreground",
                    )}
                  >
                    {col.label}
                    <ArrowUpDown
                      className={cn(
                        "h-3 w-3 transition-opacity",
                        sortKey === col.key ? "opacity-100" : "opacity-40",
                      )}
                    />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paged.length === 0 ? (
                <motion.tr
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td
                    colSpan={data.columns.length}
                    className="px-3 py-8 text-center text-xs text-muted-foreground"
                  >
                    No records match &ldquo;{searchQuery}&rdquo;
                  </td>
                </motion.tr>
              ) : (
                paged.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                    className={cn(
                      "cursor-pointer border-b transition-colors last:border-0",
                      "hover:bg-muted/50",
                      expandedRow === row.id
                        ? "bg-accent/5 ring-1 ring-inset ring-accent/10"
                        : i % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    {/* ID */}
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {row.id}
                    </td>
                    {/* Name */}
                    <td className="px-3 py-2.5 text-xs font-semibold">
                      {searchQuery ? highlightMatch(row.name, searchQuery) : row.name}
                    </td>
                    {/* Column 3 — location or records */}
                    {data.columns[2]?.align === "right" ? (
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                        {row.value}
                      </td>
                    ) : (
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {searchQuery ? highlightMatch(row.location, searchQuery) : row.location}
                      </td>
                    )}
                    {/* Status badge */}
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium leading-none",
                          STATUS_BADGE_CLASSES[row.statusColor],
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            STATUS_DOT_CLASSES[row.statusColor],
                          )}
                        />
                        {row.status}
                      </span>
                    </td>
                    {/* Last column */}
                    {data.columns[4]?.align === "right" ? (
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {row.value}
                      </td>
                    ) : (
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{row.date}</td>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Row detail panel (expands below table) */}
      <AnimatePresence>
        {expandedRow && (
          <motion.div
            key={expandedRow}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg border bg-muted/30"
          >
            {(() => {
              const row = data.rows.find((r) => r.id === expandedRow);
              if (!row) return null;
              return (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 sm:grid-cols-3">
                  {data.columns.map((col) => {
                    const val =
                      col.key === "location"
                        ? row.location
                        : col.key === "date"
                          ? row.date
                          : col.key === "value"
                            ? row.value
                            : col.key === "status"
                              ? row.status
                              : col.key === "name"
                                ? row.name
                                : row.id;
                    return (
                      <div key={col.key}>
                        <div className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
                          {col.label}
                        </div>
                        <div className="text-xs font-medium">{val || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <span className="font-medium text-foreground">{paged.length}</span> of{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          {searchQuery && `(filtered from ${data.totalRecords.toLocaleString()})`}
          {!searchQuery && `of ${data.totalRecords.toLocaleString()}`} records
        </span>
        <div className="flex items-center gap-1.5">
          <span className="mr-1">
            Page {safePage} of {totalPages}
          </span>
          <button
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background transition-colors",
              safePage <= 1
                ? "cursor-not-allowed text-muted-foreground/50"
                : "cursor-pointer text-foreground hover:bg-muted",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background transition-colors",
              safePage >= totalPages
                ? "cursor-not-allowed text-muted-foreground/50"
                : cn("cursor-pointer hover:bg-muted", styles.text),
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Highlight search matches in text */
function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="rounded-sm bg-accent/20 px-0.5 font-semibold text-accent">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline Chart Demo
   ═══════════════════════════════════════════════════════ */

const chartData: Record<
  PortalId,
  {
    data: { label: string; value: number; prev: number }[];
    title: string;
    unit: string;
    gradientId: string;
    color: string;
  }
> = {
  resident: {
    title: "311 Service Requests",
    unit: "requests",
    gradientId: "residentGrad",
    color: "hsl(205, 85%, 45%)",
    data: [
      { label: "Jan", value: 1284, prev: 1120 },
      { label: "Feb", value: 1452, prev: 1280 },
      { label: "Mar", value: 1189, prev: 1340 },
      { label: "Apr", value: 1637, prev: 1410 },
      { label: "May", value: 923, prev: 1150 },
      { label: "Jun", value: 1841, prev: 1520 },
      { label: "Jul", value: 1598, prev: 1680 },
      { label: "Aug", value: 1273, prev: 1390 },
    ],
  },
  business: {
    title: "Permit Applications",
    unit: "permits",
    gradientId: "businessGrad",
    color: "hsl(25, 90%, 50%)",
    data: [
      { label: "Q1", value: 342, prev: 298 },
      { label: "Q2", value: 287, prev: 310 },
      { label: "Q3", value: 415, prev: 345 },
      { label: "Q4", value: 263, prev: 290 },
    ],
  },
  citystaff: {
    title: "Work Orders Completed",
    unit: "orders",
    gradientId: "citystaffGrad",
    color: "hsl(155, 60%, 38%)",
    data: [
      { label: "Safety", value: 486, prev: 420 },
      { label: "Infra", value: 372, prev: 390 },
      { label: "311", value: 531, prev: 465 },
      { label: "Code", value: 245, prev: 280 },
      { label: "Fire", value: 418, prev: 395 },
    ],
  },
  researcher: {
    title: "Incidents by District",
    unit: "incidents",
    gradientId: "researcherGrad",
    color: "hsl(265, 55%, 50%)",
    data: [
      { label: "D1", value: 189, prev: 210 },
      { label: "D2", value: 467, prev: 398 },
      { label: "D3", value: 312, prev: 340 },
      { label: "D4", value: 398, prev: 365 },
      { label: "D5", value: 256, prev: 290 },
      { label: "D6", value: 178, prev: 195 },
      { label: "D7", value: 134, prev: 160 },
      { label: "D8", value: 223, prev: 240 },
      { label: "D9", value: 195, prev: 185 },
    ],
  },
};

function InlineChartDemo({ portalId }: { portalId: PortalId }) {
  const config = chartData[portalId];
  const styles = portalStyles[portalId];
  const total = config.data.reduce((s, d) => s + d.value, 0);
  const prevTotal = config.data.reduce((s, d) => s + d.prev, 0);
  const changePct = ((total - prevTotal) / prevTotal) * 100;
  const topItem = config.data.reduce((max, d) => (d.value > max.value ? d : max));

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={cn("h-4 w-4", styles.text)} />
          <span className="text-sm font-medium">{config.title}</span>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
          2025 YTD
        </span>
      </div>

      {/* Recharts area chart */}
      <motion.div
        className="h-52 rounded-lg border bg-card p-2 sm:h-64"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={1}>
          <AreaChart data={config.data} margin={{ top: 12, right: 8, left: -12, bottom: 4 }}>
            <defs>
              <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border) / 0.5)"
            />
            <XAxis
              dataKey="label"
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === "value" ? "Current" : "Prior Year",
              ]}
              labelFormatter={(label: string) => `Period: ${label}`}
            />
            {/* Prior year dashed line */}
            <Area
              type="monotone"
              dataKey="prev"
              stroke="hsl(var(--muted-foreground) / 0.3)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              fill="none"
              dot={false}
            />
            {/* Current year filled area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              fill={`url(#${config.gradientId})`}
              dot={{
                r: 3,
                fill: config.color,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: config.color,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border bg-card px-3 py-2 text-center">
          <div className="text-sm font-bold">{total.toLocaleString()}</div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            Total {config.unit}
          </div>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            {changePct >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                "text-sm font-bold",
                changePct >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(1)}%
            </span>
          </div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            vs Prior Year
          </div>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 text-center">
          <div className="text-sm font-bold">{topItem.label}</div>
          <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            Peak ({topItem.value.toLocaleString()})
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Demo Renderer
   ═══════════════════════════════════════════════════════ */

function DemoContent({ featureId, portalId }: { featureId: FeatureId; portalId: PortalId }) {
  switch (featureId) {
    case "chat":
      return <InlineChatDemo portalId={portalId} />;
    case "map":
      return <InlineMapDemo portalId={portalId} />;
    case "table":
      return <InlineTableDemo portalId={portalId} />;
    case "chart":
      return <InlineChartDemo portalId={portalId} />;
  }
}

/* ═══════════════════════════════════════════════════════
   Main Export — Interactive Portal Showcase
   ═══════════════════════════════════════════════════════ */

export function PortalPreview() {
  const [activePortal, setActivePortal] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<FeatureId | null>(null);

  const portal = portals[activePortal];
  const styles = portalStyles[portal.id];

  const handleTabChange = (index: number) => {
    setActivePortal(index);
    setSelectedFeature(null);
  };

  const selectedFeatureConfig = selectedFeature
    ? portal.features.find((f) => f.id === selectedFeature)
    : null;

  return (
    <section id="portals" className="bg-background px-fluid-md py-fluid-section">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <FadeInWhenVisible className="text-center">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Interactive Showcase
          </span>
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mt-4 text-center" delay={0.08}>
          <h2 className="font-display text-fluid-3xl tracking-tight">
            Four portals. See them in action.
          </h2>
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mx-auto mt-5 text-center" delay={0.12}>
          <SectionAccent />
        </FadeInWhenVisible>
        <FadeInWhenVisible className="mx-auto mb-10 max-w-2xl text-center" delay={0.16}>
          <p className="text-fluid-base leading-relaxed text-muted-foreground">
            Each portal is tailored to its audience — with specialized maps, data tables, charts,
            and an AI assistant. Click any feature below to see it in action.
          </p>
        </FadeInWhenVisible>

        {/* Main showcase container */}
        <FadeInWhenVisible delay={0.2}>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-lg shadow-foreground/5">
            {/* Tab navigation / back button */}
            <div className="flex items-center justify-center border-b bg-background/50 px-4 py-3">
              {selectedFeature ? (
                <div className="flex w-full items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFeature(null)}
                    className="shrink-0"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Back to showcase</span>
                    <span className="sm:hidden">Back</span>
                  </Button>

                  <span className="truncate text-sm font-medium text-foreground/80">
                    {portal.label} — {selectedFeatureConfig?.name}
                  </span>

                  <Link
                    href={portal.href}
                    className={cn(
                      "hidden shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:inline-flex",
                      styles.bgLight,
                      styles.text,
                    )}
                  >
                    Open full portal
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {portals.map((p, i) => {
                    const Icon = p.icon;
                    const isActive = activePortal === i;
                    const pStyles = portalStyles[p.id];
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleTabChange(i)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? cn(pStyles.bgLight, pStyles.border, pStyles.text, "shadow-sm")
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content area */}
            <AnimatePresence mode="wait">
              {selectedFeature ? (
                /* Demo view */
                <motion.div
                  key={`demo-${portal.id}-${selectedFeature}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="min-h-[400px] sm:min-h-[440px]"
                >
                  <DemoContent featureId={selectedFeature} portalId={portal.id} />
                </motion.div>
              ) : (
                /* Bento card grid */
                <motion.div
                  key={`grid-${portal.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="p-5 sm:p-8"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {portal.features.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        portalId={portal.id}
                        onClick={() => setSelectedFeature(feature.id)}
                      />
                    ))}
                  </div>
                  <p className="mt-6 text-center text-xs text-muted-foreground">
                    Click any feature to see a live preview — or{" "}
                    <Link href={portal.href} className={cn("font-medium underline", styles.text)}>
                      open the full {portal.label.toLowerCase()} portal
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeInWhenVisible>
      </div>
    </section>
  );
}

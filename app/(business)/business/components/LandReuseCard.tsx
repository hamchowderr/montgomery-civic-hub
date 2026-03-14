"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { LandPlot, Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { VacantProperty } from "./VacantLandExplorer";

// ── Zoning descriptions ──────────────────────────────────────────────────────

const ZONING_DESCRIPTIONS: Record<string, string> = {
  "R-1": "Single-Family Residential",
  "R-2": "Two-Family Residential",
  "C-1": "Neighborhood Commercial",
  "C-2": "General Commercial",
  "M-1": "Light Industrial",
  "M-2": "Heavy Industrial",
};

function getZoningDescription(code: string): string {
  const upper = code.toUpperCase().trim();
  for (const [prefix, desc] of Object.entries(ZONING_DESCRIPTIONS)) {
    if (upper.startsWith(prefix)) return desc;
  }
  return "Mixed Use / Special District";
}

/** Color for zoning badge based on category */
function zoningBadgeClasses(zoning: string): string {
  const upper = zoning.toUpperCase().trim();
  if (upper.startsWith("R"))
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
  if (upper.startsWith("C"))
    return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
  if (upper.startsWith("M"))
    return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
  return "bg-muted text-muted-foreground";
}

/** Parse the suggestion string into structured parts */
function parseSuggestions(raw: string): {
  ideas: string[];
  planNote: string | null;
} {
  // Format: "Reuse ideas for ADDRESS (ZONING, ACRES): idea1, idea2, idea3. Montgomery's 2040..."
  const colonIndex = raw.indexOf(":");
  if (colonIndex === -1) return { ideas: [raw], planNote: null };

  const afterColon = raw.slice(colonIndex + 1).trim();

  // Split at the first sentence that starts with "Montgomery's"
  const montgomeryIndex = afterColon.indexOf("Montgomery's");
  let ideasPart: string;
  let planNote: string | null = null;

  if (montgomeryIndex !== -1) {
    ideasPart = afterColon.slice(0, montgomeryIndex).trim();
    planNote = afterColon.slice(montgomeryIndex).trim();
    // Remove trailing period from ideas part
    if (ideasPart.endsWith(".")) ideasPart = ideasPart.slice(0, -1);
  } else {
    ideasPart = afterColon;
  }

  const ideas = ideasPart
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { ideas, planNote };
}

/** Generate reuse suggestions based on property attributes */
function generateReuseSuggestions(property: VacantProperty): string {
  const zoning = property.zoning.toUpperCase().trim();
  const acres = property.acreage;

  const suggestions: string[] = [];

  if (zoning.startsWith("R")) {
    if (acres < 0.5) suggestions.push("infill housing", "community garden", "pocket park");
    else if (acres < 2)
      suggestions.push("affordable housing development", "community garden", "neighborhood park");
    else suggestions.push("mixed-income housing development", "urban farm", "recreation center");
  } else if (zoning.startsWith("C")) {
    if (acres < 1) suggestions.push("small business incubator", "food truck park", "pop-up market");
    else
      suggestions.push(
        "mixed-use commercial development",
        "community marketplace",
        "workforce training center",
      );
  } else if (zoning.startsWith("M")) {
    suggestions.push(
      "makerspace",
      "light manufacturing co-op",
      "solar energy installation",
      "logistics hub",
    );
  } else {
    suggestions.push("community green space", "urban agriculture", "public art installation");
  }

  return `Reuse ideas for ${property.address} (${property.zoning}, ${acres.toFixed(2)} acres): ${suggestions.join(", ")}. Montgomery's 2040 comprehensive plan encourages adaptive reuse of city-owned parcels to support neighborhood revitalization and equitable development.`;
}

// ── Component ────────────────────────────────────────────────────────────────

interface LandReuseCardProps {
  property: VacantProperty;
}

export function LandReuseCard({ property }: LandReuseCardProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Register CopilotKit action so AI assistant can suggest reuse ideas
  useCopilotAction({
    name: "suggest_land_reuse",
    description:
      "Suggest reuse ideas for a city-owned property based on its zoning, acreage, and current use",
    parameters: [
      {
        name: "propertyAddress",
        type: "string",
        description: "Street address of the property",
        required: true,
      },
      {
        name: "zoningCode",
        type: "string",
        description: "Current zoning code (e.g. R-1, C-2)",
        required: true,
      },
      {
        name: "acreage",
        type: "number",
        description: "Property size in acres",
        required: true,
      },
      {
        name: "currentUse",
        type: "string",
        description: "Current use of the property",
        required: true,
      },
    ],
    handler: ({ propertyAddress, zoningCode, acreage, currentUse }) => {
      const tempProperty: VacantProperty = {
        address: propertyAddress,
        zoning: zoningCode,
        acreage,
        use: currentUse,
        owner: "City of Montgomery",
        neighborhood: "Unknown",
        maintainedBy: "Unknown",
        appraised: 0,
        location: "",
        notes: "",
      };
      const result = generateReuseSuggestions(tempProperty);
      setSuggestion(result);
      return result;
    },
  });

  function handleGenerateIdeas() {
    setIsGenerating(true);
    setSuggestion(null);
    // Simulate a brief delay for UX, then generate locally
    setTimeout(() => {
      setSuggestion(generateReuseSuggestions(property));
      setIsGenerating(false);
    }, 500);
  }

  const parsed = suggestion ? parseSuggestions(suggestion) : null;

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base font-semibold leading-tight">{property.address}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Property info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Zoning
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${zoningBadgeClasses(property.zoning)}`}
              >
                {property.zoning}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getZoningDescription(property.zoning)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Acreage
            </p>
            <div className="flex items-center gap-1.5">
              <LandPlot className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{property.acreage.toFixed(2)} acres</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Current Use
            </p>
            <p className="text-xs text-foreground">{property.use}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Owner
            </p>
            <p className="text-xs text-foreground">{property.owner}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Generate button — prominent */}
        <Button
          variant="default"
          size="sm"
          className="w-full gap-2 h-9"
          onClick={handleGenerateIdeas}
          disabled={isGenerating}
        >
          {isGenerating ? <Spinner className="size-4" /> : <Lightbulb className="size-4" />}
          Generate Reuse Ideas
        </Button>

        {/* AI Suggestions panel */}
        {parsed && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-semibold text-foreground">Reuse Ideas</span>
            </div>

            {/* Individual idea pills */}
            <div className="flex flex-wrap gap-2">
              {parsed.ideas.map((idea, index) => (
                <div
                  key={index}
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm capitalize"
                >
                  {idea}
                </div>
              ))}
            </div>

            {/* Montgomery plan footer note */}
            {parsed.planNote && (
              <p className="text-[11px] leading-relaxed text-muted-foreground border-t pt-2">
                {parsed.planNote}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

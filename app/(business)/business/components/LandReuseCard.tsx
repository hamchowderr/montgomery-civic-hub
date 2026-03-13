"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { Lightbulb } from "lucide-react";
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
        district: 0,
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

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Selected Property</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{property.address}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {property.zoning}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {getZoningDescription(property.zoning)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{property.acreage.toFixed(2)} acres</p>
          <p className="text-xs text-muted-foreground">Current use: {property.use}</p>
        </div>

        <Button
          variant="default"
          size="sm"
          className="w-full gap-1.5"
          onClick={handleGenerateIdeas}
          disabled={isGenerating}
        >
          {isGenerating ? <Spinner className="size-3.5" /> : <Lightbulb className="size-3.5" />}
          Generate Reuse Ideas
        </Button>

        {suggestion && (
          <div className="rounded-md border bg-muted/50 p-2.5">
            <p className="text-xs leading-relaxed">{suggestion}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import {
  Building2,
  DollarSign,
  Factory,
  Home,
  Info,
  LandPlot,
  Lightbulb,
  MapPin,
  Palette,
  RefreshCw,
  Sparkles,
  Store,
  Trees,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NearbyActivity } from "./NearbyActivity";
import type { VacantProperty } from "./types";
import { DISPOSITION_LABELS } from "./types";
import {
  classifyManagedBy,
  classifyZoning,
  dispositionColor,
  formatCurrency,
  generateReuseSuggestions,
  getSuggestionIcon,
  getZoningDescription,
  parseSuggestions,
  zoningBadgeClasses,
  zoningCategoryColor,
} from "./utils";

interface PropertyDetailProps {
  property: VacantProperty;
  onClose: () => void;
}

const SUGGESTION_ICONS = {
  home: Home,
  tree: Trees,
  store: Store,
  factory: Factory,
  palette: Palette,
} as const;

export function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate suggestions when AI tab is selected
  useEffect(() => {
    if (activeTab === "ai" && !suggestion) {
      setIsGenerating(true);
      // Brief delay for UX smoothness
      const timer = setTimeout(() => {
        setSuggestion(generateReuseSuggestions(property));
        setIsGenerating(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, suggestion, property]);

  // Reset suggestions when property changes
  useEffect(() => {
    setSuggestion(null);
    setActiveTab("overview");
  }, [property.address]);

  const parsed = suggestion ? parseSuggestions(suggestion) : null;
  const zoningCat = classifyZoning(property.zoning);
  const managedCat = classifyManagedBy(property.maintainedBy);

  function handleRegenerate() {
    setIsGenerating(true);
    setSuggestion(null);
    setTimeout(() => {
      setSuggestion(generateReuseSuggestions(property));
      setIsGenerating(false);
    }, 400);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 border-b px-4 py-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold leading-tight truncate">{property.address}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant="outline"
              className={`text-[11px] font-medium ${dispositionColor(property.use)}`}
            >
              {DISPOSITION_LABELS[property.use] ?? property.use}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[11px] font-medium ${zoningCategoryColor(zoningCat)}`}
            >
              {property.zoning}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 w-auto justify-start">
          <TabsTrigger value="overview" className="text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">
            <Sparkles className="size-3 mr-1" />
            AI Ideas
          </TabsTrigger>
          <TabsTrigger value="nearby" className="text-xs">
            <MapPin className="size-3 mr-1" />
            Nearby
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 min-h-0">
          {/* Overview Tab */}
          <TabsContent value="overview" className="px-4 pb-4 mt-0">
            <div className="grid grid-cols-2 gap-4 pt-3">
              <DetailField
                icon={<LandPlot className="size-3.5 text-emerald-500" />}
                label="Acreage"
                value={`${property.acreage.toFixed(2)} acres`}
                emphasis
              />
              <DetailField
                icon={<DollarSign className="size-3.5 text-amber-500" />}
                label="Appraised Value"
                value={formatCurrency(property.appraised)}
                emphasis
              />
              <DetailField
                icon={
                  <Badge
                    variant="outline"
                    className={`text-[9px] h-4 ${zoningBadgeClasses(property.zoning)}`}
                  >
                    {property.zoning}
                  </Badge>
                }
                label="Zoning"
                value={getZoningDescription(property.zoning)}
              />
              <DetailField
                icon={<Info className="size-3.5 text-blue-500" />}
                label="Status"
                value={DISPOSITION_LABELS[property.use] ?? property.use}
              />
              <DetailField
                icon={<User className="size-3.5 text-muted-foreground" />}
                label="Owner"
                value={property.owner}
              />
              <DetailField
                icon={<Building2 className="size-3.5 text-muted-foreground" />}
                label="Managed By"
                value={`${property.maintainedBy} (${managedCat})`}
              />
              <DetailField
                icon={<Building2 className="size-3.5 text-muted-foreground" />}
                label="Neighborhood"
                value={property.neighborhood}
              />
              <DetailField
                icon={<LandPlot className="size-3.5 text-muted-foreground" />}
                label="Current Use"
                value={property.use}
              />
            </div>

            {/* Full-width fields */}
            {property.location && (
              <>
                <Separator className="my-3" />
                <DetailField
                  icon={<MapPin className="size-3.5 text-muted-foreground" />}
                  label="Location"
                  value={property.location}
                  fullWidth
                />
              </>
            )}

            {property.notes && (
              <>
                <Separator className="my-3" />
                <DetailField
                  icon={<Info className="size-3.5 text-muted-foreground" />}
                  label="Notes"
                  value={property.notes}
                  fullWidth
                />
              </>
            )}
          </TabsContent>

          {/* AI Ideas Tab */}
          <TabsContent value="ai" className="px-4 pb-4 mt-0">
            <div className="pt-3 space-y-4">
              {isGenerating ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5 animate-pulse text-amber-500" />
                    Generating reuse ideas...
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : parsed ? (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-amber-500" />
                    <span className="text-xs font-semibold">Reuse Ideas</span>
                  </div>

                  {/* Idea cards */}
                  <div className="space-y-2">
                    {parsed.ideas.map((idea, index) => {
                      const iconType = getSuggestionIcon(idea);
                      const Icon = SUGGESTION_ICONS[iconType];
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-lg border bg-card p-3"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Icon className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">{idea}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Based on {property.zoning} zoning, {property.acreage.toFixed(2)} acres
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Montgomery plan callout */}
                  {parsed.planNote && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {parsed.planNote}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Regenerate button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="size-3" />
                    Regenerate Ideas
                  </Button>
                </>
              ) : null}
            </div>
          </TabsContent>

          {/* Nearby Activity Tab */}
          <TabsContent value="nearby" className="px-4 pb-4 mt-0">
            <div className="pt-3">
              <NearbyActivity property={property} />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// ── Detail field helper ────────────────────────────────────────────────────

function DetailField({
  icon,
  label,
  value,
  emphasis,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasis?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-1 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`text-foreground ${emphasis ? "text-sm font-semibold" : "text-xs"}`}>{value}</p>
    </div>
  );
}

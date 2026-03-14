"use client";

import { Building2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResourceCounts } from "./types";
import { RESOURCE_CARDS } from "./types";

interface CommunityResourcesProps {
  resources: ResourceCounts;
  isLoading: boolean;
}

/** Map resource keys to left-border accent colors */
const BORDER_COLORS: Record<string, string> = {
  communityCenters: "border-l-blue-500",
  libraries: "border-l-amber-500",
  daycareCenters: "border-l-pink-500",
  educationFacilities: "border-l-emerald-500",
  recyclingLocations: "border-l-teal-500",
};

function useDefaultOpen() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });
  return [isOpen, setIsOpen] as const;
}

export function CommunityResources({ resources, isLoading }: CommunityResourcesProps) {
  const [isOpen, setIsOpen] = useDefaultOpen();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-2 transition-colors hover:bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Community Resources
              <ChevronDown
                className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {RESOURCE_CARDS.map((rc) => {
                const Icon = rc.icon;
                const count = resources[rc.key];
                const borderColor = BORDER_COLORS[rc.key] ?? "border-l-gray-500";
                return (
                  <div
                    key={rc.key}
                    className={`flex flex-col items-center gap-2 rounded-xl border border-l-4 p-4 text-center transition-all hover:shadow-md ${rc.bg} ${borderColor}`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-black/20 ${rc.iconColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {isLoading || count === null ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-bold tabular-nums">{count}</p>
                    )}
                    <p className="text-xs font-semibold text-muted-foreground">{rc.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

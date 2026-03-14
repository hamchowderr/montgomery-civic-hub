"use client";

import { DollarSign, LandPlot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VacantProperty } from "./types";
import { DISPOSITION_LABELS } from "./types";
import {
  classifyManagedBy,
  classifyZoning,
  dispositionColor,
  formatCurrency,
  zoningCategoryColor,
} from "./utils";

interface PropertyCardProps {
  property: VacantProperty;
  isSelected: boolean;
  onClick: () => void;
}

export function PropertyCard({ property, isSelected, onClick }: PropertyCardProps) {
  const zoningCat = classifyZoning(property.zoning);
  const managedCat = classifyManagedBy(property.maintainedBy);

  return (
    <Card
      className={`group cursor-pointer transition-all duration-150 hover:shadow-md hover:border-foreground/20 dark:hover:border-foreground/10 ${
        isSelected ? "ring-2 ring-portal-business shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2.5">
        {/* Address + status */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight text-foreground line-clamp-1">
            {property.address}
          </p>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-medium ${dispositionColor(property.use)}`}
          >
            {DISPOSITION_LABELS[property.use] ?? property.use}
          </Badge>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${zoningCategoryColor(zoningCat)}`}
          >
            {property.zoning}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {managedCat}
          </Badge>
        </div>

        {/* Notes / Location */}
        {(property.notes || property.location) && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
            {property.notes || property.location}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
          <div className="flex items-center gap-1">
            <LandPlot className="size-3" />
            <span className="tabular-nums">{property.acreage.toFixed(2)} ac</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="size-3" />
            <span className="tabular-nums">{formatCurrency(property.appraised)}</span>
          </div>
          {property.neighborhood !== "Unknown" && (
            <>
              <span className="text-border">&middot;</span>
              <span className="truncate">{property.neighborhood}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

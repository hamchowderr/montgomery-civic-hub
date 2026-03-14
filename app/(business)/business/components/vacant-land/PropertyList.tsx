"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "./PropertyCard";
import type { VacantProperty } from "./types";

interface PropertyListProps {
  properties: VacantProperty[];
  isLoading: boolean;
  error: string | null;
  selectedProperty: VacantProperty | null;
  onSelectProperty: (property: VacantProperty) => void;
}

export function PropertyList({
  properties,
  isLoading,
  error,
  selectedProperty,
  onSelectProperty,
}: PropertyListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="grid gap-2.5 p-3 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          properties.map((property, i) => (
            <PropertyCard
              key={`${property.address}-${i}`}
              property={property}
              isSelected={selectedProperty?.address === property.address}
              onClick={() => onSelectProperty(property)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}

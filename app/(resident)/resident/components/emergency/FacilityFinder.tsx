"use client";

import {
  Building2,
  ChevronDown,
  Flame,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FireStation, HealthCareFacility, PoliceFacility } from "./types";
import { mapsUrl } from "./utils";

interface FacilityFinderProps {
  policeFacilities: PoliceFacility[];
  fireStations: FireStation[];
  healthCare: HealthCareFacility[];
  healthCareByType: Record<string, HealthCareFacility[]>;
  isLoading: boolean;
}

function FacilityGridSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FacilityFinder({
  policeFacilities,
  fireStations,
  healthCare,
  healthCareByType,
  isLoading,
}: FacilityFinderProps) {
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const toggleFacility = (id: string) => setExpandedFacility((prev) => (prev === id ? null : id));

  const query = searchQuery.toLowerCase().trim();

  const filteredPolice = useMemo(
    () =>
      query
        ? policeFacilities.filter(
            (f) =>
              f.Facility_Name.toLowerCase().includes(query) ||
              f.Facility_Address.toLowerCase().includes(query),
          )
        : policeFacilities,
    [policeFacilities, query],
  );

  const filteredFire = useMemo(
    () =>
      query
        ? fireStations.filter(
            (f) => f.Name.toLowerCase().includes(query) || f.Address.toLowerCase().includes(query),
          )
        : fireStations,
    [fireStations, query],
  );

  const filteredHealthCareByType = useMemo(() => {
    if (!query) return healthCareByType;
    const result: Record<string, HealthCareFacility[]> = {};
    for (const [type, facilities] of Object.entries(healthCareByType)) {
      const filtered = facilities.filter(
        (f) =>
          f.COMPANY_NA.toLowerCase().includes(query) ||
          f.ADDRESS.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query),
      );
      if (filtered.length > 0) result[type] = filtered;
    }
    return result;
  }, [healthCareByType, query]);

  const filteredHealthCareCount = useMemo(
    () => Object.values(filteredHealthCareByType).reduce((sum, arr) => sum + arr.length, 0),
    [filteredHealthCareByType],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          Facility Finder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search facilities by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="police" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="police" className="flex-1 gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Police ({filteredPolice.length || "..."})
            </TabsTrigger>
            <TabsTrigger value="fire" className="flex-1 gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Fire ({filteredFire.length || "..."})
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex-1 gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              Medical ({filteredHealthCareCount || "..."})
            </TabsTrigger>
          </TabsList>

          {/* Police Tab */}
          <TabsContent value="police">
            {isLoading ? (
              <FacilityGridSkeleton />
            ) : filteredPolice.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No police facilities match your search
              </p>
            ) : (
              <div className="space-y-2">
                {filteredPolice.map((fac, i) => {
                  const id = `police-${i}`;
                  const isExpanded = expandedFacility === id;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border transition-all hover:bg-slate-50 hover:shadow-sm dark:hover:bg-slate-900 cursor-pointer"
                      onClick={() => toggleFacility(id)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{fac.Facility_Name}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {fac.Facility_Address}
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                        />
                      </div>
                      {isExpanded && (
                        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-muted-foreground">Facility</span>
                              <span className="ml-auto text-xs font-medium">
                                {fac.Facility_Name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Address</span>
                              <span className="ml-auto text-xs">{fac.Facility_Address}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={mapsUrl(fac.Facility_Address)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Navigation className="h-3.5 w-3.5" />
                                Get Directions
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Fire Tab */}
          <TabsContent value="fire">
            {isLoading ? (
              <FacilityGridSkeleton />
            ) : filteredFire.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No fire stations match your search
              </p>
            ) : (
              <div className="space-y-2">
                {filteredFire.map((station, i) => {
                  const id = `fire-${i}`;
                  const isExpanded = expandedFacility === id;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border transition-all hover:bg-slate-50 hover:shadow-sm dark:hover:bg-slate-900 cursor-pointer"
                      onClick={() => toggleFacility(id)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                          <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{station.Name}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {station.Address}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          Station #{station.Id}
                        </Badge>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                        />
                      </div>
                      {isExpanded && (
                        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Flame className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-muted-foreground">Station</span>
                              <span className="ml-auto text-xs font-medium">{station.Name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Address</span>
                              <span className="ml-auto text-xs">{station.Address}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={mapsUrl(station.Address)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Navigation className="h-3.5 w-3.5" />
                                Get Directions
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Medical Tab */}
          <TabsContent value="medical">
            {isLoading ? (
              <FacilityGridSkeleton />
            ) : Object.keys(filteredHealthCareByType).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No medical facilities match your search
              </p>
            ) : (
              <div className="space-y-5">
                {Object.entries(filteredHealthCareByType)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([type, facilities]) => (
                    <div key={type}>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {facilities.length} {facilities.length === 1 ? "facility" : "facilities"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {facilities.map((fac, i) => {
                          const id = `medical-${type}-${i}`;
                          const isExpanded = expandedFacility === id;
                          return (
                            <div
                              key={i}
                              className="rounded-lg border transition-all hover:bg-slate-50 hover:shadow-sm dark:hover:bg-slate-900 cursor-pointer"
                              onClick={() => toggleFacility(id)}
                            >
                              <div className="flex items-center gap-3 p-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
                                  <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">{fac.COMPANY_NA}</p>
                                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    {fac.ADDRESS}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  {fac.BEDS_UNITS > 0 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {fac.BEDS_UNITS} beds
                                    </Badge>
                                  )}
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                                  />
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                                    <div className="flex items-center gap-2">
                                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                                      <span className="text-muted-foreground">Name</span>
                                      <span className="ml-auto text-xs font-medium">
                                        {fac.COMPANY_NA}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-muted-foreground">Address</span>
                                      <span className="ml-auto text-xs">{fac.ADDRESS}</span>
                                    </div>
                                    {fac.PHONE && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-muted-foreground">Phone</span>
                                        <a
                                          href={`tel:${fac.PHONE.replace(/[^0-9]/g, "")}`}
                                          className="ml-auto text-xs font-mono hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {fac.PHONE}
                                        </a>
                                      </div>
                                    )}
                                    {fac.BEDS_UNITS > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-muted-foreground">Capacity</span>
                                        <span className="ml-auto text-xs">
                                          {fac.BEDS_UNITS} beds/units
                                        </span>
                                      </div>
                                    )}
                                    {fac.EMPLOY > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-muted-foreground">Staff</span>
                                        <span className="ml-auto text-xs">
                                          {fac.EMPLOY} employees
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    {fac.PHONE && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 text-xs"
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <a href={`tel:${fac.PHONE.replace(/[^0-9]/g, "")}`}>
                                          <Phone className="h-3.5 w-3.5" />
                                          Call
                                        </a>
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      className="h-8 gap-1.5 text-xs"
                                      asChild
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <a
                                        href={mapsUrl(fac.ADDRESS)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Navigation className="h-3.5 w-3.5" />
                                        Get Directions
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

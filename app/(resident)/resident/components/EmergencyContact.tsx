"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import {
  AlertTriangle,
  Baby,
  BookOpen,
  Building2,
  ChevronDown,
  ExternalLink,
  Flame,
  GraduationCap,
  Heart,
  MapPin,
  Phone,
  Recycle,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ARCGIS_URLS,
  queryFeatureAttributes,
  queryFeatureCount,
  queryFeatureStats,
} from "@/lib/arcgis-client";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const emergencyNumbers = [
  { label: "Emergency", number: "911", highlight: true },
  { label: "MPD Non-Emergency", number: "334-625-2651" },
  { label: "Fire Non-Emergency", number: "334-241-2600" },
  { label: "City Main Line", number: "334-625-2000" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PoliceFacility {
  Facility_Name: string;
  Facility_Address: string;
}

interface FireStation {
  Id: number;
  Name: string;
  Address: string;
}

interface HealthCareFacility {
  COMPANY_NA: string;
  ADDRESS: string;
  PHONE: string;
  TYPE_FACIL: string;
  EMPLOY: number;
  BEDS_UNITS: number;
}

interface DistrictStat {
  group: string;
  value: number;
}

interface ResourceCounts {
  communityCenters: number | null;
  libraries: number | null;
  daycareCenters: number | null;
  educationFacilities: number | null;
  recyclingLocations: number | null;
}

// ---------------------------------------------------------------------------
// Donut chart colors
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  Open: "hsl(0 84% 60%)",
  "In Progress": "hsl(38 92% 50%)",
  Closed: "hsl(142 71% 45%)",
};

const DEFAULT_STATUS_COLOR = "hsl(215 20% 65%)";

const CHART_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Resource card config
// ---------------------------------------------------------------------------

const resourceCards = [
  {
    key: "communityCenters" as const,
    label: "Community Centers",
    icon: Building2,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "libraries" as const,
    label: "Libraries",
    icon: BookOpen,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "daycareCenters" as const,
    label: "Daycare Centers",
    icon: Baby,
    bg: "bg-pink-50 dark:bg-pink-950/40",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    key: "educationFacilities" as const,
    label: "Schools",
    icon: GraduationCap,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "recyclingLocations" as const,
    label: "Recycling Sites",
    icon: Recycle,
    bg: "bg-teal-50 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmergencyContact() {
  // Tornado siren count
  const [sirenCount, setSirenCount] = useState<number | null>(null);

  // Facility data
  const [policeFacilities, setPoliceFacilities] = useState<PoliceFacility[]>([]);
  const [fireStations, setFireStations] = useState<FireStation[]>([]);
  const [healthCare, setHealthCare] = useState<HealthCareFacility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  // 311 stats
  const [districtDemand, setDistrictDemand] = useState<DistrictStat[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<DistrictStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Resource counts
  const [resources, setResources] = useState<ResourceCounts>({
    communityCenters: null,
    libraries: null,
    daycareCenters: null,
    educationFacilities: null,
    recyclingLocations: null,
  });
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Fetch tornado siren count
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    queryFeatureCount(ARCGIS_URLS.tornadoSirens).then((count) => {
      if (!cancelled) setSirenCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch facility data (police, fire, medical)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchFacilities() {
      setFacilitiesLoading(true);

      const [policeData, fireData, healthData] = await Promise.all([
        queryFeatureAttributes({
          url: ARCGIS_URLS.policeFacilities,
          outFields: "Facility_Name,Facility_Address",
        }),
        queryFeatureAttributes({
          url: ARCGIS_URLS.fireStations,
          outFields: "Id,Name,Address",
        }),
        queryFeatureAttributes({
          url: ARCGIS_URLS.healthCare,
          outFields: "COMPANY_NA,ADDRESS,PHONE,TYPE_FACIL,EMPLOY,BEDS_UNITS",
        }),
      ]);

      if (cancelled) return;

      setPoliceFacilities(
        policeData.map((d) => ({
          Facility_Name: String(d.Facility_Name ?? "Unknown"),
          Facility_Address: String(d.Facility_Address ?? ""),
        })),
      );
      setFireStations(
        fireData.map((d) => ({
          Id: Number(d.Id) || 0,
          Name: String(d.Name ?? "Unknown"),
          Address: String(d.Address ?? ""),
        })),
      );
      setHealthCare(
        healthData.map((d) => ({
          COMPANY_NA: String(d.COMPANY_NA ?? "Unknown"),
          ADDRESS: String(d.ADDRESS ?? ""),
          PHONE: String(d.PHONE ?? ""),
          TYPE_FACIL: String(d.TYPE_FACIL ?? "Other"),
          EMPLOY: Number(d.EMPLOY) || 0,
          BEDS_UNITS: Number(d.BEDS_UNITS) || 0,
        })),
      );
      setFacilitiesLoading(false);
    }

    fetchFacilities();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch 311 stats
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setStatsLoading(true);

      const [districtData, statusData] = await Promise.all([
        queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "District",
          statisticField: "OBJECTID",
        }),
        queryFeatureStats({
          url: ARCGIS_URLS.serviceRequests311,
          groupByField: "Status",
          statisticField: "OBJECTID",
        }),
      ]);

      if (cancelled) return;

      // Sort district demand descending
      setDistrictDemand(
        districtData
          .filter((d) => d.group && d.group !== "null" && d.group !== "Unknown")
          .sort((a, b) => b.value - a.value),
      );
      setStatusBreakdown(statusData.filter((d) => d.group && d.group !== "null"));
      setStatsLoading(false);
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch resource counts
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchResources() {
      setResourcesLoading(true);

      const [cc, lib, daycare, edu, recycle] = await Promise.all([
        queryFeatureCount(ARCGIS_URLS.communityCenters),
        queryFeatureCount(ARCGIS_URLS.libraries),
        queryFeatureCount(ARCGIS_URLS.daycareCenters),
        queryFeatureCount(ARCGIS_URLS.educationFacilities),
        queryFeatureCount(ARCGIS_URLS.recyclingLocations),
      ]);

      if (cancelled) return;

      setResources({
        communityCenters: cc,
        libraries: lib,
        daycareCenters: daycare,
        educationFacilities: edu,
        recyclingLocations: recycle,
      });
      setResourcesLoading(false);
    }

    fetchResources();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // CopilotKit readable
  // -------------------------------------------------------------------------
  useCopilotReadable({
    description:
      "Montgomery emergency contacts, facility counts, 311 demand stats, and community resource counts",
    value: {
      emergencyNumbers,
      tornadoSirenCount: sirenCount,
      facilityCounts: {
        police: policeFacilities.length,
        fire: fireStations.length,
        medical: healthCare.length,
      },
      serviceRequestsByDistrict: districtDemand,
      serviceRequestsByStatus: statusBreakdown,
      communityResources: resources,
    },
  });

  // -------------------------------------------------------------------------
  // Group healthcare by type
  // -------------------------------------------------------------------------
  const healthCareByType = healthCare.reduce<Record<string, HealthCareFacility[]>>((acc, fac) => {
    const type = fac.TYPE_FACIL || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(fac);
    return acc;
  }, {});

  // -------------------------------------------------------------------------
  // Expandable facility state
  // -------------------------------------------------------------------------
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const toggleFacility = (id: string) => setExpandedFacility((prev) => (prev === id ? null : id));

  /** Google Maps search URL for an address */
  const mapsUrl = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Montgomery, AL")}`;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div data-tour-step-id="resident-emergency" className="space-y-6">
      {/* ================================================================= */}
      {/* Section 1 — Emergency Numbers                                      */}
      {/* ================================================================= */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4" />
            Emergency Numbers
            {sirenCount !== null && (
              <Badge variant="outline" className="ml-auto gap-1 text-xs font-normal">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                {sirenCount} Tornado Sirens Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* 911 — dominant card */}
          <a
            href="tel:911"
            className="group relative flex items-center gap-3 rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-4 py-3 text-white shadow-md shadow-red-500/20 transition-all hover:shadow-lg hover:shadow-red-500/30 dark:from-red-700 dark:to-red-800"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-red-100">Emergency</p>
              <p className="text-3xl font-black tracking-tight">911</p>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-red-200 opacity-0 transition-opacity group-hover:opacity-100">
              Tap to call
            </div>
          </a>

          {/* Non-emergency numbers */}
          <div className="space-y-1">
            {emergencyNumbers
              .filter((item) => !item.highlight)
              .map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number.replace(/-/g, "")}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                  <span className="flex-1 text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-xs font-medium text-foreground">
                    {item.number}
                  </span>
                </a>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Section 2 — Facility Finder                                        */}
      {/* ================================================================= */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            Facility Finder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="police" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="police" className="flex-1 gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Police ({policeFacilities.length || "..."})
              </TabsTrigger>
              <TabsTrigger value="fire" className="flex-1 gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                Fire ({fireStations.length || "..."})
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex-1 gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Medical ({healthCare.length || "..."})
              </TabsTrigger>
            </TabsList>

            {/* Police Tab */}
            <TabsContent value="police">
              {facilitiesLoading ? (
                <FacilityGridSkeleton />
              ) : (
                <div className="space-y-2">
                  {policeFacilities.map((fac, i) => {
                    const id = `police-${i}`;
                    const isExpanded = expandedFacility === id;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                        onClick={() => toggleFacility(id)}
                      >
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{fac.Facility_Name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground truncate">
                              {fac.Facility_Address}
                            </p>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                          />
                        </div>
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
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
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a
                                  href={mapsUrl(fac.Facility_Address)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="mr-1.5 h-3 w-3" />
                                  View on Map
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
              {facilitiesLoading ? (
                <FacilityGridSkeleton />
              ) : (
                <div className="space-y-2">
                  {fireStations.map((station, i) => {
                    const id = `fire-${i}`;
                    const isExpanded = expandedFacility === id;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                        onClick={() => toggleFacility(id)}
                      >
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900">
                            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{station.Name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground truncate">
                              {station.Address}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            #{station.Id}
                          </Badge>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                          />
                        </div>
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
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
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a
                                  href={mapsUrl(station.Address)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="mr-1.5 h-3 w-3" />
                                  View on Map
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
              {facilitiesLoading ? (
                <FacilityGridSkeleton />
              ) : (
                <div className="space-y-5">
                  {Object.entries(healthCareByType)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([type, facilities]) => (
                      <div key={type}>
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {facilities.length}{" "}
                            {facilities.length === 1 ? "facility" : "facilities"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {facilities.map((fac, i) => {
                            const id = `medical-${type}-${i}`;
                            const isExpanded = expandedFacility === id;
                            return (
                              <div
                                key={i}
                                className="rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                                onClick={() => toggleFacility(id)}
                              >
                                <div className="flex items-center gap-3 p-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900">
                                    <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{fac.COMPANY_NA}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
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
                                      className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                                    />
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
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
                                          className="h-7 text-xs"
                                          asChild
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <a href={`tel:${fac.PHONE.replace(/[^0-9]/g, "")}`}>
                                            <Phone className="mr-1.5 h-3 w-3" />
                                            Call
                                          </a>
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <a
                                          href={mapsUrl(fac.ADDRESS)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="mr-1.5 h-3 w-3" />
                                          View on Map
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

      {/* ================================================================= */}
      {/* Section 3 — Service Demand + Resolution Rate                       */}
      {/* ================================================================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — District Demand Custom Bar Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 p-4 pb-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">311 Requests by District</CardTitle>
            {!statsLoading && districtDemand.length > 0 && (
              <Badge variant="outline" className="ml-auto text-[10px] font-normal tabular-nums">
                {formatNumber(districtDemand.reduce((s, d) => s + d.value, 0))} total
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {statsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 flex-1 rounded" />
                  </div>
                ))}
              </div>
            ) : districtDemand.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No district data available
              </p>
            ) : (
              <div className="space-y-1.5">
                {districtDemand.map((item, index) => {
                  const maxVal = districtDemand[0]?.value ?? 1;
                  const pct = (item.value / maxVal) * 100;
                  return (
                    <div
                      key={item.group}
                      className="group flex w-full items-center gap-3 rounded-md px-2 py-1.5"
                    >
                      <span
                        className="w-[80px] shrink-0 truncate text-xs text-muted-foreground"
                        title={item.group}
                      >
                        {item.group}
                      </span>
                      <div className="relative flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            opacity: 0.75,
                          }}
                        />
                        <span className="relative z-10 flex h-full items-center px-2 text-[11px] font-semibold tabular-nums text-foreground">
                          {formatNumber(item.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — Status Donut Chart (Enhanced) */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 p-4 pb-1">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">311 Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {statsLoading ? (
              <div className="flex items-center justify-center">
                <Skeleton className="h-[220px] w-[220px] rounded-full" />
              </div>
            ) : statusBreakdown.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No status data available
              </div>
            ) : (
              (() => {
                const total = statusBreakdown.reduce((s, d) => s + d.value, 0);
                const closedCount = statusBreakdown.find((d) => d.group === "Closed")?.value ?? 0;
                const resolutionPct = total > 0 ? ((closedCount / total) * 100).toFixed(0) : "0";
                return (
                  <div className="flex flex-col items-center gap-4">
                    {/* Donut with center stat */}
                    <div className="relative">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie
                            data={statusBreakdown}
                            dataKey="value"
                            nameKey="group"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={105}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {statusBreakdown.map((entry) => (
                              <Cell
                                key={entry.group}
                                fill={STATUS_COLORS[entry.group] ?? DEFAULT_STATUS_COLOR}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), "Requests"]}
                            contentStyle={{
                              borderRadius: "8px",
                              fontSize: "12px",
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--popover))",
                              color: "hsl(var(--popover-foreground))",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center stat overlay */}
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold tabular-nums">{resolutionPct}%</span>
                        <span className="text-[11px] text-muted-foreground">Resolved</span>
                      </div>
                    </div>

                    {/* Legend items */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {statusBreakdown.map((entry) => {
                        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
                        return (
                          <div key={entry.group} className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: STATUS_COLORS[entry.group] ?? DEFAULT_STATUS_COLOR,
                              }}
                            />
                            <span className="text-xs text-muted-foreground">{entry.group}</span>
                            <span className="text-xs font-semibold tabular-nums">
                              {formatNumber(entry.value)} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* Section 4 — Community Resources                                    */}
      {/* ================================================================= */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4" />
            Community Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {resourceCards.map((rc) => {
              const Icon = rc.icon;
              const count = resources[rc.key];
              return (
                <div
                  key={rc.key}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center ${rc.bg}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-black/20 ${rc.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {resourcesLoading || count === null ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums">{count}</p>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">{rc.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton for facility grid
// ---------------------------------------------------------------------------

function FacilityGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

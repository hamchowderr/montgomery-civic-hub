"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Filter,
  HardHat,
  LandPlot,
  MapPin,
  SortAsc,
  Trees,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ARCGIS_URLS, queryFeatureAttributes, queryFeaturesAsGeoJSON } from "@/lib/arcgis-client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface VacantProperty {
  address: string;
  owner: string;
  zoning: string;
  use: string;
  acreage: number;
  neighborhood: string;
  maintainedBy: string;
  appraised: number;
  location: string;
  notes: string;
}

interface VacantLandExplorerProps {
  onSelectProperty: (property: VacantProperty) => void;
}

// ── Zoning classification ───────────────────────────────────────────────────

const ZONING_CATEGORIES = [
  "Residential",
  "Business",
  "Office",
  "Industrial",
  "Agricultural",
  "Transect",
  "Institutional",
  "Other",
] as const;
type ZoningCategory = (typeof ZONING_CATEGORIES)[number];

function classifyZoning(raw: string): ZoningCategory {
  if (!raw || raw === "None") return "Other";
  const upper = raw.toUpperCase().trim();
  if (upper.startsWith("R-") || upper.startsWith("R1")) return "Residential";
  if (upper.startsWith("B-")) return "Business";
  if (upper.startsWith("O-")) return "Office";
  if (upper.startsWith("M-")) return "Industrial";
  if (upper.startsWith("AGR")) return "Agricultural";
  if (upper.startsWith("T") && /^T\d/.test(upper)) return "Transect";
  if (upper === "CIVIC" || upper === "INST" || upper === "FH") return "Institutional";
  if (upper === "PUD" || upper === "U") return "Other";
  return "Other";
}

// ── Disposition status (Use_ field) ─────────────────────────────────────────

const DISPOSITION_STATUSES = ["AVAILABLE", "HOLDING", "USE", "LEASED", "DUE DILIGENCE"] as const;
type DispositionStatus = (typeof DISPOSITION_STATUSES)[number];

const DISPOSITION_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  HOLDING: "Holding",
  USE: "In Use",
  LEASED: "Leased",
  "DUE DILIGENCE": "Due Diligence",
};

// ── Managed By classification (Maint_By field) ─────────────────────────────

const MANAGED_BY_CATEGORIES = [
  "Vacant Lots",
  "Parks & Recreation",
  "Maintenance",
  "Public Safety",
  "Utilities & Infrastructure",
  "Cultural & Education",
  "Other",
] as const;
type ManagedByCategory = (typeof MANAGED_BY_CATEGORIES)[number];

function classifyManagedBy(raw: string): ManagedByCategory {
  if (!raw || raw === "None") return "Other";
  const lower = raw.toLowerCase();
  if (lower.includes("vacant")) return "Vacant Lots";
  if (
    lower.includes("park") ||
    lower.includes("recreation") ||
    lower.includes("zoo") ||
    lower.includes("biscuits")
  )
    return "Parks & Recreation";
  if (lower === "maintenance" || lower.includes("general services")) return "Maintenance";
  if (lower.includes("fire") || lower.includes("police") || lower.includes("mpd"))
    return "Public Safety";
  if (
    lower.includes("water") ||
    lower.includes("landfill") ||
    lower.includes("mats") ||
    lower.includes("airport") ||
    lower.includes("repower")
  )
    return "Utilities & Infrastructure";
  if (
    lower.includes("library") ||
    lower.includes("mps") ||
    lower.includes("old alabama") ||
    lower.includes("cemetery") ||
    lower.includes("rsa") ||
    lower.includes("nixon")
  )
    return "Cultural & Education";
  return "Other";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseProperty(feature: GeoJSON.Feature): VacantProperty {
  const p = feature.properties ?? {};
  return {
    address: String(p.PROP_ADDRE ?? "Unknown").trim(),
    owner: String(p.OWNER1_1 ?? "City of Montgomery").trim(),
    zoning: String(p.ZONING ?? "Unknown").trim(),
    use: String(p.Use_ ?? "Unknown").trim(),
    acreage: Number(p.CALC_ACRE ?? 0),
    neighborhood: String(p.NBHD ?? "").trim() || "Unknown",
    maintainedBy: String(p.Maint_By ?? "").trim() || "Unknown",
    appraised: Number(p.APPRAISED_ ?? 0),
    location: String(p.LOCATION ?? "").trim(),
    notes: String(p.NOTES ?? "").trim(),
  };
}

function formatCurrency(value: number): string {
  if (value === 0) return "N/A";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function zoningCategoryColor(cat: ZoningCategory): string {
  switch (cat) {
    case "Residential":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
    case "Business":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400";
    case "Office":
      return "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400";
    case "Industrial":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
    case "Agricultural":
      return "bg-lime-500/10 text-lime-700 border-lime-500/20 dark:text-lime-400";
    case "Transect":
      return "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400";
    case "Institutional":
      return "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function dispositionColor(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-500/15 text-green-700 border-green-400/30 dark:text-green-400";
    case "HOLDING":
      return "bg-amber-500/15 text-amber-700 border-amber-400/30 dark:text-amber-400";
    case "USE":
      return "bg-blue-500/15 text-blue-700 border-blue-400/30 dark:text-blue-400";
    case "LEASED":
      return "bg-purple-500/15 text-purple-700 border-purple-400/30 dark:text-purple-400";
    case "DUE DILIGENCE":
      return "bg-orange-500/15 text-orange-700 border-orange-400/30 dark:text-orange-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ── Sort options ─────────────────────────────────────────────────────────────

type SortField = "acreage-desc" | "acreage-asc" | "appraised-desc" | "neighborhood" | "address";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "acreage-desc", label: "Largest First" },
  { value: "acreage-asc", label: "Smallest First" },
  { value: "appraised-desc", label: "Highest Value" },
  { value: "neighborhood", label: "Neighborhood" },
  { value: "address", label: "Address A-Z" },
];

function sortProperties(properties: VacantProperty[], sort: SortField): VacantProperty[] {
  const sorted = [...properties];
  switch (sort) {
    case "acreage-desc":
      return sorted.sort((a, b) => b.acreage - a.acreage);
    case "acreage-asc":
      return sorted.sort((a, b) => a.acreage - b.acreage);
    case "appraised-desc":
      return sorted.sort((a, b) => b.appraised - a.appraised);
    case "neighborhood":
      return sorted.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
    case "address":
      return sorted.sort((a, b) => a.address.localeCompare(b.address));
  }
}

// ── Collapsible Filter Section ───────────────────────────────────────────────

function FilterSection({
  title,
  count,
  total,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  total: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const allSelected = count === total;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {open ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
          {title}
        </span>
        {!allSelected && (
          <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[10px] font-medium">
            {count}
          </Badge>
        )}
      </button>
      {open && <div className="pl-1">{children}</div>}
    </div>
  );
}

// ── Summary Stats Bar ───────────────────────────────────────────────────────

function SummaryStats({ properties }: { properties: VacantProperty[] }) {
  const stats = useMemo(() => {
    const available = properties.filter((p) => p.use === "AVAILABLE").length;
    const totalAcres = properties.reduce((sum, p) => sum + p.acreage, 0);
    const totalValue = properties.reduce((sum, p) => sum + p.appraised, 0);
    const neighborhoods = new Set(properties.map((p) => p.neighborhood)).size;
    return { available, totalAcres, totalValue, neighborhoods };
  }, [properties]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {
          label: "Available",
          value: stats.available.toString(),
          sub: `of ${properties.length} total`,
          icon: LandPlot,
          color: "text-green-600 dark:text-green-400",
        },
        {
          label: "Total Acreage",
          value: stats.totalAcres.toFixed(0),
          sub: "acres",
          icon: Trees,
          color: "text-emerald-600 dark:text-emerald-400",
        },
        {
          label: "Appraised Value",
          value: formatCurrency(stats.totalValue),
          sub: "combined",
          icon: DollarSign,
          color: "text-amber-600 dark:text-amber-400",
        },
        {
          label: "Neighborhoods",
          value: stats.neighborhoods.toString(),
          sub: "areas",
          icon: Building2,
          color: "text-blue-600 dark:text-blue-400",
        },
      ].map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-card p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <stat.icon className={`size-3.5 ${stat.color}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Pie chart hex colors (match zoningCategoryColor tailwind classes) ────────

const ZONING_HEX_COLORS: Record<ZoningCategory, string> = {
  Residential: "#10b981",
  Business: "#3b82f6",
  Office: "#6366f1",
  Industrial: "#f59e0b",
  Agricultural: "#84cc16",
  Transect: "#8b5cf6",
  Institutional: "#f43f5e",
  Other: "#9ca3af",
};

// ── ZoningChart ─────────────────────────────────────────────────────────────

function ZoningChart({ properties }: { properties: VacantProperty[] }) {
  const data = useMemo(() => {
    const counts = new Map<ZoningCategory, number>();
    for (const p of properties) {
      const cat = classifyZoning(p.zoning);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value, fill: ZONING_HEX_COLORS[name] }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Zoning Distribution</h3>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} properties`, name]}
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="shrink-0 space-y-1.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium tabular-nums ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── NeighborhoodTable ───────────────────────────────────────────────────────

type NhSortField = "name" | "count" | "acres" | "value" | "pctAvailable";
type NhSortDir = "asc" | "desc";

interface NeighborhoodRow {
  name: string;
  count: number;
  acres: number;
  value: number;
  pctAvailable: number;
}

function NeighborhoodTable({ properties }: { properties: VacantProperty[] }) {
  const [sortBy, setSortBy] = useState<NhSortField>("count");
  const [sortDir, setSortDir] = useState<NhSortDir>("desc");

  const rows = useMemo(() => {
    const map = new Map<
      string,
      { count: number; acres: number; value: number; available: number }
    >();
    for (const p of properties) {
      const key = p.neighborhood;
      const row = map.get(key) ?? { count: 0, acres: 0, value: 0, available: 0 };
      row.count++;
      row.acres += p.acreage;
      row.value += p.appraised;
      if (p.use === "AVAILABLE") row.available++;
      map.set(key, row);
    }
    return [...map.entries()].map(([name, r]) => ({
      name,
      count: r.count,
      acres: r.acres,
      value: r.value,
      pctAvailable: r.count > 0 ? (r.available / r.count) * 100 : 0,
    }));
  }, [properties]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortBy === "name") return dir * a.name.localeCompare(b.name);
      return dir * (a[sortBy] - b[sortBy]);
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  const handleSort = useCallback(
    (field: NhSortField) => {
      if (sortBy === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir(field === "name" ? "asc" : "desc");
      }
    },
    [sortBy],
  );

  const SortIcon = ({ field }: { field: NhSortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="size-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3 text-foreground" />
    ) : (
      <ArrowDown className="size-3 text-foreground" />
    );
  };

  if (rows.length === 0) return null;

  const columns: { field: NhSortField; label: string; align?: string }[] = [
    { field: "name", label: "Neighborhood" },
    { field: "count", label: "Properties", align: "text-right" },
    { field: "acres", label: "Total Acres", align: "text-right" },
    { field: "value", label: "Appraised Value", align: "text-right" },
    { field: "pctAvailable", label: "% Available", align: "text-right" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Neighborhood Summary</h3>
        <ScrollArea className="max-h-[220px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b">
                {columns.map((col) => (
                  <th
                    key={col.field}
                    className={`pb-2 pr-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${col.align ?? "text-left"}`}
                    onClick={() => handleSort(col.field)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-1.5 pr-3 font-medium truncate max-w-[140px]">{row.name}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{row.count}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{row.acres.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatCurrency(row.value)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.pctAvailable.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ── NearbyActivity ──────────────────────────────────────────────────────────

interface NearbyItem {
  type: "permit" | "violation";
  description: string;
  date: string;
  status: string;
}

function NearbyActivity({
  property,
  onDismiss,
}: {
  property: VacantProperty;
  onDismiss: () => void;
}) {
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevAddress = useRef<string | null>(null);

  useEffect(() => {
    if (property.address === prevAddress.current) return;
    prevAddress.current = property.address;

    let cancelled = false;
    async function fetchNearby() {
      setLoading(true);
      setItems([]);

      // Extract street name from address for loose matching
      // e.g. "123 MAIN ST" → "MAIN ST"
      const parts = property.address.split(" ");
      const street = parts.length > 1 ? parts.slice(1).join(" ") : property.address;
      const escaped = street.replace(/'/g, "''");

      try {
        const [permits, violations] = await Promise.all([
          queryFeatureAttributes({
            url: ARCGIS_URLS.constructionPermits,
            where: `Address LIKE '%${escaped}%'`,
            outFields: "Address,PermitType,IssueDate,Status",
          }),
          queryFeatureAttributes({
            url: ARCGIS_URLS.codeViolations,
            where: `Address1 LIKE '%${escaped}%'`,
            outFields: "Address1,ViolationType,DateOpened,Status",
          }),
        ]);

        if (cancelled) return;

        const mapped: NearbyItem[] = [];

        for (const p of permits.slice(0, 10)) {
          const rawDate = p.IssueDate as number | null;
          mapped.push({
            type: "permit",
            description: `${String(p.PermitType ?? "Permit")} — ${String(p.Address ?? "")}`,
            date: rawDate ? new Date(rawDate).toLocaleDateString() : "N/A",
            status: String(p.Status ?? "Unknown"),
          });
        }

        for (const v of violations.slice(0, 10)) {
          const rawDate = v.DateOpened as number | null;
          mapped.push({
            type: "violation",
            description: `${String(v.ViolationType ?? "Violation")} — ${String(v.Address1 ?? "")}`,
            date: rawDate ? new Date(rawDate).toLocaleDateString() : "N/A",
            status: String(v.Status ?? "Unknown"),
          });
        }

        setItems(mapped);
      } catch (err) {
        console.error("[NearbyActivity] fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNearby();
    return () => {
      cancelled = true;
    };
  }, [property.address]);

  return (
    <div className="border-t bg-muted/10">
      <div className="px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="size-3.5 text-muted-foreground" />
            Nearby Activity — {property.address}
          </h3>
          <Button variant="ghost" size="icon" className="size-6" onClick={onDismiss}>
            <X className="size-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 flex-1 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No nearby permits or violations found on this street.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <div key={`${item.type}-${i}`} className="rounded-lg border bg-card p-2.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  {item.type === "permit" ? (
                    <HardHat className="size-3 text-blue-500" />
                  ) : (
                    <AlertTriangle className="size-3 text-amber-500" />
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      item.type === "permit"
                        ? "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400"
                        : "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400"
                    }`}
                  >
                    {item.type === "permit" ? "Permit" : "Violation"}
                  </Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground">{item.date}</span>
                </div>
                <p className="text-[11px] text-foreground line-clamp-2">{item.description}</p>
                <p className="text-[10px] text-muted-foreground">Status: {item.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function VacantLandExplorer({ onSelectProperty }: VacantLandExplorerProps) {
  const [properties, setProperties] = useState<VacantProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sortField, setSortField] = useState<SortField>("acreage-desc");
  const [selectedProperty, setSelectedProperty] = useState<VacantProperty | null>(null);

  // Filter state
  const [selectedZoning, setSelectedZoning] = useState<Set<ZoningCategory>>(
    () => new Set(ZONING_CATEGORIES),
  );
  const [selectedDisposition, setSelectedDisposition] = useState<Set<string>>(
    () => new Set<string>(DISPOSITION_STATUSES),
  );
  const [selectedManagedBy, setSelectedManagedBy] = useState<Set<ManagedByCategory>>(
    () => new Set(MANAGED_BY_CATEGORIES),
  );
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string> | null>(null);
  const [minAcreage, setMinAcreage] = useState(0);

  // Extract unique neighborhoods from data
  const allNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) set.add(p.neighborhood);
    return [...set].sort();
  }, [properties]);

  // Initialize neighborhood filter once data loads
  useEffect(() => {
    if (properties.length > 0 && selectedNeighborhoods === null) {
      setSelectedNeighborhoods(new Set(allNeighborhoods));
    }
  }, [properties, allNeighborhoods, selectedNeighborhoods]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const geojson = await queryFeaturesAsGeoJSON({
          url: ARCGIS_URLS.cityOwnedProperties,
          outFields:
            "PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE,Maint_By,NBHD,APPRAISED_,LOCATION,NOTES",
          returnGeometry: false,
        });
        if (!cancelled) {
          const parsed = geojson.features.map(parseProperty);
          if (parsed.length === 0) {
            setError(
              "No properties returned from the server. The data source may be temporarily unavailable.",
            );
          }
          setProperties(parsed);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[VacantLandExplorer] fetch failed:", err);
        if (!cancelled) {
          setError("Failed to load property data. Please try again.");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered + sorted results
  const filtered = useMemo(() => {
    const result = properties.filter((p) => {
      if (!selectedZoning.has(classifyZoning(p.zoning))) return false;
      if (!selectedDisposition.has(p.use)) return false;
      if (!selectedManagedBy.has(classifyManagedBy(p.maintainedBy))) return false;
      if (selectedNeighborhoods && !selectedNeighborhoods.has(p.neighborhood)) return false;
      if (p.acreage < minAcreage) return false;
      return true;
    });
    return sortProperties(result, sortField);
  }, [
    properties,
    selectedZoning,
    selectedDisposition,
    selectedManagedBy,
    selectedNeighborhoods,
    minAcreage,
    sortField,
  ]);

  // Toggle helpers
  const toggleSet = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });
    },
    [],
  );

  const toggleNeighborhood = useCallback((n: string) => {
    setSelectedNeighborhoods((prev) => {
      if (!prev) return prev;
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedZoning.size < ZONING_CATEGORIES.length) count++;
    if (selectedDisposition.size < DISPOSITION_STATUSES.length) count++;
    if (selectedManagedBy.size < MANAGED_BY_CATEGORIES.length) count++;
    if (selectedNeighborhoods && selectedNeighborhoods.size < allNeighborhoods.length) count++;
    if (minAcreage > 0) count++;
    return count;
  }, [
    selectedZoning,
    selectedDisposition,
    selectedManagedBy,
    selectedNeighborhoods,
    allNeighborhoods,
    minAcreage,
  ]);

  // CopilotKit readable
  useCopilotReadable({
    description:
      "Filtered city-owned properties with zoning, status, maintenance, and appraisal data",
    value: {
      total: properties.length,
      filtered: filtered.length,
      topProperties: filtered.slice(0, 10).map((p) => ({
        address: p.address,
        zoning: `${p.zoning} (${classifyZoning(p.zoning)})`,
        status: p.use,
        acreage: p.acreage,
        appraised: p.appraised,
        neighborhood: p.neighborhood,
        maintainedBy: p.maintainedBy,
        notes: p.notes,
      })),
    },
  });

  // Neighborhood summary for CopilotKit
  const neighborhoodSummary = useMemo(() => {
    const map = new Map<
      string,
      { count: number; acres: number; value: number; available: number }
    >();
    for (const p of filtered) {
      const row = map.get(p.neighborhood) ?? { count: 0, acres: 0, value: 0, available: 0 };
      row.count++;
      row.acres += p.acreage;
      row.value += p.appraised;
      if (p.use === "AVAILABLE") row.available++;
      map.set(p.neighborhood, row);
    }
    return [...map.entries()]
      .map(([name, r]) => ({
        neighborhood: name,
        properties: r.count,
        totalAcres: Math.round(r.acres * 10) / 10,
        totalValue: r.value,
        pctAvailable: r.count > 0 ? Math.round((r.available / r.count) * 100) : 0,
      }))
      .sort((a, b) => b.properties - a.properties)
      .slice(0, 15);
  }, [filtered]);

  useCopilotReadable({
    description:
      "Neighborhood-level summary of city-owned properties with counts, acreage, value, and availability percentage",
    value: neighborhoodSummary,
  });

  // CopilotKit action — filter by neighborhood
  useCopilotAction({
    name: "filter_land_by_neighborhood",
    description: "Filter land explorer to specified neighborhoods",
    parameters: [
      {
        name: "neighborhoods",
        type: "string[]",
        description: "Array of neighborhood names to filter by",
        required: true,
      },
    ],
    handler: ({ neighborhoods }: { neighborhoods: string[] }) => {
      setSelectedNeighborhoods(new Set(neighborhoods));
      return `Filtered to neighborhoods: ${neighborhoods.join(", ")}`;
    },
  });

  // CopilotKit action — filter by disposition status
  useCopilotAction({
    name: "filter_land_by_status",
    description:
      "Filter properties by disposition status (AVAILABLE, HOLDING, USE, LEASED, DUE DILIGENCE)",
    parameters: [
      {
        name: "statuses",
        type: "string[]",
        description: "Array of disposition statuses",
        required: true,
      },
    ],
    handler: ({ statuses }: { statuses: string[] }) => {
      setSelectedDisposition(new Set(statuses));
      return `Filtered to statuses: ${statuses.join(", ")}`;
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Summary stats */}
      {!isLoading && properties.length > 0 && (
        <div className="border-b px-4 py-4 sm:px-6">
          <SummaryStats properties={filtered} />
        </div>
      )}

      {/* Zoning chart + Neighborhood table */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-3 border-b px-4 py-4 sm:px-6 lg:grid-cols-2">
          <ZoningChart properties={filtered} />
          <NeighborhoodTable properties={filtered} />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 shrink-0 border-r bg-muted/20">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-3">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="size-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Filters</h3>
                    {activeFilterCount > 0 && (
                      <Badge variant="default" className="h-4 min-w-[18px] px-1 text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>

                <div className="h-px bg-border" />

                {/* Disposition Status */}
                <FilterSection
                  title="Status"
                  count={selectedDisposition.size}
                  total={DISPOSITION_STATUSES.length}
                >
                  <div className="space-y-2.5 py-1">
                    {DISPOSITION_STATUSES.map((s) => (
                      <label
                        key={s}
                        className="flex cursor-pointer items-center gap-2 text-xs hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <Checkbox
                          checked={selectedDisposition.has(s)}
                          onCheckedChange={() => toggleSet(setSelectedDisposition, s as string)}
                          className="size-4"
                        />
                        <span className="select-none">{DISPOSITION_LABELS[s] ?? s}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <div className="h-px bg-border" />

                {/* Managed By */}
                <FilterSection
                  title="Managed By"
                  count={selectedManagedBy.size}
                  total={MANAGED_BY_CATEGORIES.length}
                >
                  <div className="space-y-2.5 py-1">
                    {MANAGED_BY_CATEGORIES.map((cat) => (
                      <label
                        key={cat}
                        className="flex cursor-pointer items-center gap-2 text-xs hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <Checkbox
                          checked={selectedManagedBy.has(cat)}
                          onCheckedChange={() => toggleSet(setSelectedManagedBy, cat)}
                          className="size-4"
                        />
                        <span className="select-none">{cat}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <div className="h-px bg-border" />

                {/* Zoning Category */}
                <FilterSection
                  title="Zoning"
                  count={selectedZoning.size}
                  total={ZONING_CATEGORIES.length}
                >
                  <div className="space-y-2.5 py-1">
                    {ZONING_CATEGORIES.map((z) => (
                      <label
                        key={z}
                        className="flex cursor-pointer items-center gap-2 text-xs hover:text-foreground text-muted-foreground transition-colors"
                      >
                        <Checkbox
                          checked={selectedZoning.has(z)}
                          onCheckedChange={() => toggleSet(setSelectedZoning, z)}
                          className="size-4"
                        />
                        <span className="select-none">{z}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <div className="h-px bg-border" />

                {/* Neighborhoods */}
                {allNeighborhoods.length > 0 && (
                  <>
                    <FilterSection
                      title="Neighborhood"
                      count={selectedNeighborhoods?.size ?? allNeighborhoods.length}
                      total={allNeighborhoods.length}
                      defaultOpen={false}
                    >
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2.5 py-1 pr-2">
                          {allNeighborhoods.map((n) => (
                            <label
                              key={n}
                              className="flex cursor-pointer items-center gap-2 text-xs hover:text-foreground text-muted-foreground transition-colors"
                            >
                              <Checkbox
                                checked={selectedNeighborhoods?.has(n) ?? true}
                                onCheckedChange={() => toggleNeighborhood(n)}
                                className="size-4"
                              />
                              <span className="select-none truncate">{n}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </FilterSection>
                    <div className="h-px bg-border" />
                  </>
                )}

                {/* Acreage slider */}
                <FilterSection
                  title="Minimum Acreage"
                  count={minAcreage > 0 ? 1 : 0}
                  total={1}
                  defaultOpen={false}
                >
                  <div className="space-y-3 py-1 pr-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {minAcreage === 0 ? "No minimum" : `${minAcreage} acres+`}
                      </span>
                      {minAcreage > 0 && (
                        <button
                          onClick={() => setMinAcreage(0)}
                          className="text-[10px] text-muted-foreground hover:text-foreground underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <Slider
                      value={[minAcreage]}
                      onValueChange={([v]: number[]) => setMinAcreage(v)}
                      min={0}
                      max={50}
                      step={0.5}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span>
                      <span>50 acres</span>
                    </div>
                  </div>
                </FilterSection>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Property cards */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/10 px-3 py-2">
            {!sidebarOpen && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setSidebarOpen(true)}
              >
                <Filter className="size-3" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            )}
            <span className="text-xs font-medium text-foreground">
              {filtered.length}
              <span className="text-muted-foreground font-normal">
                {" "}
                of {properties.length} properties
              </span>
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <SortAsc className="size-3 text-muted-foreground" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="h-7 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
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
                filtered.map((property, i) => {
                  const zoningCat = classifyZoning(property.zoning);
                  const managedCat = classifyManagedBy(property.maintainedBy);
                  return (
                    <Card
                      key={`${property.address}-${i}`}
                      className="group cursor-pointer transition-all duration-150 hover:shadow-md hover:border-foreground/20 dark:hover:border-foreground/10"
                      onClick={() => {
                        setSelectedProperty(property);
                        onSelectProperty(property);
                      }}
                    >
                      <CardContent className="p-4 space-y-2.5">
                        {/* Address */}
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
                            <span className="tabular-nums">
                              {formatCurrency(property.appraised)}
                            </span>
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
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Nearby activity panel */}
      {selectedProperty && (
        <NearbyActivity property={selectedProperty} onDismiss={() => setSelectedProperty(null)} />
      )}
    </div>
  );
}

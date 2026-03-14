import type { ManagedByCategory, SortField, VacantProperty, ZoningCategory } from "./types";

// ── From VacantLandExplorer.tsx ─────────────────────────────────────────────

export function classifyZoning(raw: string): ZoningCategory {
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

export function classifyManagedBy(raw: string): ManagedByCategory {
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

export function parseProperty(feature: GeoJSON.Feature): VacantProperty {
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

export function formatCurrency(value: number): string {
  if (value === 0) return "N/A";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function zoningCategoryColor(cat: ZoningCategory): string {
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

export function dispositionColor(status: string): string {
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

export function sortProperties(properties: VacantProperty[], sort: SortField): VacantProperty[] {
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

// ── From LandReuseCard.tsx ──────────────────────────────────────────────────

export const ZONING_DESCRIPTIONS: Record<string, string> = {
  "R-1": "Single-Family Residential",
  "R-2": "Two-Family Residential",
  "C-1": "Neighborhood Commercial",
  "C-2": "General Commercial",
  "M-1": "Light Industrial",
  "M-2": "Heavy Industrial",
};

export function getZoningDescription(code: string): string {
  const upper = code.toUpperCase().trim();
  for (const [prefix, desc] of Object.entries(ZONING_DESCRIPTIONS)) {
    if (upper.startsWith(prefix)) return desc;
  }
  return "Mixed Use / Special District";
}

/** Color for zoning badge based on category */
export function zoningBadgeClasses(zoning: string): string {
  const upper = zoning.toUpperCase().trim();
  if (upper.startsWith("R"))
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
  if (upper.startsWith("C"))
    return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
  if (upper.startsWith("M"))
    return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
  return "bg-muted text-muted-foreground";
}

/** Generate reuse suggestions based on property attributes */
export function generateReuseSuggestions(property: VacantProperty): string {
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

/** Parse the suggestion string into structured parts */
export function parseSuggestions(raw: string): {
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

/** Map a suggestion idea to an icon type for the detail panel */
export function getSuggestionIcon(idea: string): "home" | "tree" | "store" | "factory" | "palette" {
  const lower = idea.toLowerCase();
  if (lower.includes("housing") || lower.includes("infill")) return "home";
  if (
    lower.includes("garden") ||
    lower.includes("park") ||
    lower.includes("farm") ||
    lower.includes("green")
  )
    return "tree";
  if (
    lower.includes("business") ||
    lower.includes("market") ||
    lower.includes("commercial") ||
    lower.includes("truck")
  )
    return "store";
  if (
    lower.includes("maker") ||
    lower.includes("manufacturing") ||
    lower.includes("solar") ||
    lower.includes("logistics")
  )
    return "factory";
  return "palette";
}

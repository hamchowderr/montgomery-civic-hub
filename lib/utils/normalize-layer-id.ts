/**
 * Normalize a layer ID that the AI model may have generated incorrectly.
 * Tries exact match first, then fuzzy matching against known layer IDs.
 */
export function normalizeLayerId(input: string, validIds: string[]): string {
  // Exact match
  if (validIds.includes(input)) return input;

  const normalized = input.toLowerCase().replace(/[_\s]+/g, "-");

  // Try normalized exact match
  if (validIds.includes(normalized)) return normalized;

  // Common AI-generated ID mappings
  const aliasMap: Record<string, string> = {
    "received-311-service-request": "311-requests",
    "received-311-service-requests": "311-requests",
    "311-service-requests": "311-requests",
    "311-service-request": "311-requests",
    "311": "311-requests",
    "service-requests": "311-requests",
    "police-facilities": "police",
    "police-facility": "police",
    "police-stations": "police",
    "fire-station": "fire-stations",
    "city-owned-properties": "city-properties",
    "city-owned-property": "city-properties",
    "flood-hazard-areas": "flood-zones",
    "flood-hazard": "flood-zones",
    "flood-hazard-area": "flood-zones",
    "health-care-facilities": "health-care",
    healthcare: "health-care",
    "healthcare-facilities": "health-care",
    "community-center": "community-centers",
    library: "libraries",
    schools: "education",
    school: "education",
    "daycare-centers": "daycare",
    "daycare-center": "daycare",
    "recycling-locations": "recycling",
    "recycling-location": "recycling",
    "tornado-siren": "tornado-sirens",
    park: "parks",
    "city-parks": "parks",
    "garbage-collection": "garbage-schedule",
    "garbage-collection-schedule": "garbage-schedule",
    "curbside-pickup": "curbside-trash",
    "curbside-trash-pickup": "curbside-trash",
    "construction-permits": "permits",
    "construction-permit": "permits",
    permit: "permits",
    "business-license": "business-licenses",
    "entertainment-district": "entertainment-districts",
    "zoning-districts": "zoning",
    "zoning-district": "zoning",
    "nuisance-complaints": "nuisance",
    "nuisance-properties": "nuisance",
    "nuisance-complaint": "nuisance",
    "code-violation": "code-violations",
    "paving-projects": "paving",
    "paving-project": "paving",
    "pavement-assessment": "pavement",
    neighborhood: "neighborhoods",
    "census-tract": "census-tracts",
  };

  const mapped = aliasMap[normalized];
  if (mapped && validIds.includes(mapped)) return mapped;

  // Substring match: find any valid ID that the input contains or vice versa
  for (const id of validIds) {
    if (normalized.includes(id) || id.includes(normalized)) return id;
  }

  // No match found — return original (will be a no-op)
  console.warn(`[normalizeLayerId] No match for "${input}" in [${validIds.join(", ")}]`);
  return input;
}

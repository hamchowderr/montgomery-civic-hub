// Map data is now fetched client-side via lib/arcgis-client.ts.
// Public ArcGIS endpoints return native GeoJSON (f: "geojson") directly to
// the browser. Montgomery's GIS server blocks Convex cloud IPs, so
// server-side fetching is not viable.
//
// This file previously contained: refreshResidentMap, refreshBusinessMap,
// refreshCityStaffMap, refreshResearcherMap, refreshAllMapData, and
// ArcGIS-to-GeoJSON conversion helpers.

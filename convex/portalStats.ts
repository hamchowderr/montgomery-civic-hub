// Portal stats are now fetched client-side.
// Public ArcGIS data is fetched directly from the browser (Montgomery's GIS
// server blocks Convex cloud IPs). Dataset count is read via useQuery
// against convex/queries.ts#getDatasetCount.
//
// This file previously contained: refreshResidentStats, refreshBusinessStats,
// refreshCityStaffStats, refreshResearcherStats, refreshAllPortalStats,
// getOrRefreshPortalStats, and ArcGIS helper functions.

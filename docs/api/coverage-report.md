# ArcGIS Endpoint & Field Usage Coverage Report

Generated: 2026-03-13 (Phase 3 update)

---

## 1. Summary Table — Before vs After

| #   | Endpoint Key             | Phase 1 Files | Phase 3 Files | Phase 1 Fields | Phase 3 Fields | Phase 1 Coverage | Phase 3 Coverage |
| --- | ------------------------ | ------------- | ------------- | -------------- | -------------- | ---------------- | ---------------- |
| 1   | `serviceRequests311`     | 7             | 12            | 11             | 11             | Heavy            | Heavy            |
| 2   | `businessLicense`        | 4             | 4             | 7              | 7              | Heavy            | Heavy            |
| 3   | `constructionPermits`    | 4             | 5             | 15             | 18             | Heavy            | Heavy            |
| 4   | `codeViolations`         | 4             | 7             | 7              | 10             | Heavy            | Heavy            |
| 5   | `pavingProject`          | 3             | 4             | 11             | 14             | Moderate         | Heavy            |
| 6   | `policeFacilities`       | 3             | 4             | 2              | 2              | Light            | Moderate         |
| 7   | `fireStations`           | 3             | 4             | 2              | 3              | Light            | Moderate         |
| 8   | `communityCenters`       | 2             | 4             | 3              | 3              | Light            | Moderate         |
| 9   | `libraries`              | 2             | 4             | 2              | 2              | Light            | Moderate         |
| 10  | `educationFacilities`    | 2             | 4             | 5              | 5              | Light            | Moderate         |
| 11  | `daycareCenters`         | 2             | 3             | 5              | 5              | Light            | Light            |
| 12  | `nuisance`               | 4             | 4             | 6              | 6              | Moderate         | Moderate         |
| 13  | `tornadoSirens`          | 2             | 3             | 3              | 3              | Light            | Moderate         |
| 14  | `cityOwnedProperties`    | 4             | 5             | 11             | 11             | Heavy            | Heavy            |
| 15  | `pavementAssessment`     | 1             | 1             | 6              | 6              | Light            | Light            |
| 16  | `healthCare`             | 2             | 3             | 3              | 6              | Light            | Moderate         |
| 17  | `entertainmentDistricts` | 1             | 1             | \* (all)       | \* (all)       | Light            | Light            |
| 18  | `recyclingLocations`     | 1             | 2             | 4              | 4              | Light            | Light            |
| 19  | `garbageSchedule`        | 1             | 1             | 2              | 2              | Light            | Light            |
| 20  | `curbsideTrash`          | 1             | 1             | 1              | 1              | Light            | Light            |
| 21  | `councilDistricts`       | 1             | 1             | 5              | 5              | Moderate         | Moderate         |
| 22  | `neighborhoods`          | 1             | 2             | \* (all)       | \* (all)       | Light            | Moderate         |
| 23  | `censusTract`            | 1             | 1             | 2              | 2              | Light            | Light            |
| 24  | `censusBlockGroup`       | 0             | 0             | 0              | 0              | None             | None             |
| 25  | `censusBlock`            | 1             | 2             | 8              | 10             | Moderate         | Heavy            |
| 26  | `cityParks`              | 1             | 1             | \* (all)       | \* (all)       | Light            | Light            |
| 27  | `zoning`                 | 1             | 1             | 4              | 4              | Light            | Light            |
| 28  | `floodHazardAreas`       | 2             | 2             | 3              | 3              | Light            | Light            |

**Totals:** 27 of 28 endpoints used (unchanged). 58 unique files referencing ArcGIS (up from 38). Total unique named fields across all endpoints: ~147 (up from ~126).

---

## 2. Phase 3 Improvements

### IncidentNewsfeed.tsx (Resident Portal)

**Endpoint:** `serviceRequests311`

New usage pattern — standalone page with full interactive filtering and analytics:

- `queryFeatureAttributes` with outFields: `Request_ID,Create_Date,Department,Request_Type,Address,District,Status,Close_Date,Origin,Year` — live scrollable feed of recent 311 requests
- `queryFeatureStats` groupBy `Department` + `Origin` — populates dynamic filter dropdowns
- `queryFeatureStats` groupBy `Status` — summary stat cards (Open/Closed/In Progress)
- `queryFeatureStats` groupBy `Request_Type` — interactive bar chart with click-to-filter
- `queryFeatureStats` groupBy `Year` — area chart trend sparkline

**Impact:** This component uses ALL 11 serviceRequests311 fields (Request_ID, Request_Type, Department, Address, Status, District, Year, Create_Date, Close_Date, Origin, OBJECTID) in a single view. It demonstrates the richest possible usage of this endpoint — filtering by 5 dimensions, charting by 3, and computing derived metrics (avg resolution time from Create_Date/Close_Date delta).

### EmergencyContact.tsx (Resident Portal)

**Endpoints:** `policeFacilities`, `fireStations`, `healthCare`, `tornadoSirens`, `serviceRequests311`, `communityCenters`, `libraries`, `daycareCenters`, `educationFacilities`, `recyclingLocations`

New usage pattern — replaced hardcoded facility data with live ArcGIS queries:

- `queryFeatureAttributes` for `policeFacilities` (Facility_Name, Facility_Address) — tabbed facility finder
- `queryFeatureAttributes` for `fireStations` (Id, Name, Address) — **NEW field: `Id`**
- `queryFeatureAttributes` for `healthCare` (COMPANY_NA, ADDRESS, PHONE, TYPE_FACIL, EMPLOY, BEDS_UNITS) — **3 NEW fields: `PHONE`, `EMPLOY`, `BEDS_UNITS`** — grouped by TYPE_FACIL with bed count and employee badges
- `queryFeatureCount` for `tornadoSirens` — siren count badge
- `queryFeatureStats` for `serviceRequests311` groupBy `District` and `Status` — district demand bar chart + status donut
- `queryFeatureCount` for `communityCenters`, `libraries`, `daycareCenters`, `educationFacilities`, `recyclingLocations` — community resource count cards

**Impact:** This single component now queries **10 different endpoints**, making it the widest cross-endpoint consumer in the app. Previously these facilities were hardcoded; now they're live. The healthcare section in particular tripled its field usage (3 to 6 fields).

### StaffingDashboard.tsx (City Staff Portal)

**Endpoints:** `serviceRequests311`, `codeViolations`, `pavingProject`

New usage pattern — demand analysis overlaid on staffing data:

- `queryFeatureStats` for `serviceRequests311` groupBy `District` and `Request_Type` — demand vs capacity chart + top request types analysis
- `queryFeatureStats` for `codeViolations` groupBy `CouncilDistrict` and `CaseType` — violation demand overlay + pie chart breakdown
- `queryFeatureStats` for `pavingProject` groupBy `DistrictDesc` and `Status` — paving by district and status charts
- `queryTotalStats` for `pavingProject` with fields `Length_Miles`, `AsphaltEst`, `EstTons`, `OBJECTID` — **2 NEW fields: `AsphaltEst`, `EstTons`** — aggregate infrastructure stats

**Impact:** Brought 3 live ArcGIS endpoints into the staffing dashboard as demand proxies. The paving section now uses 14 fields (up from 11), surfacing cost and tonnage data that wasn't previously consumed anywhere in the UI.

### VacantLandExplorer.tsx (Business Portal)

**Endpoints:** `cityOwnedProperties`, `constructionPermits`, `codeViolations`

New usage pattern — full property explorer with nearby activity lookups:

- `queryFeaturesAsGeoJSON` for `cityOwnedProperties` with outFields: `PROP_ADDRE,OWNER1_1,ZONING,Use_,CALC_ACRE,Maint_By,NBHD,APPRAISED_,LOCATION,NOTES` — all 10 extended fields used for filtering, sorting, charting, and CopilotKit readable
- `queryFeatureAttributes` for `constructionPermits` with outFields: `Address,PermitType,IssueDate,Status` — **3 NEW fields: `Address`, `PermitType`, `IssueDate`** — nearby permit activity for selected properties
- `queryFeatureAttributes` for `codeViolations` with outFields: `Address1,ViolationType,DateOpened,Status` — **2 NEW fields: `ViolationType`, `DateOpened`** — nearby violation activity

**Impact:** The NearbyActivity sub-component cross-references properties against permit and violation data by street name matching, introducing 5 new field references across 2 endpoints. This is the first time `constructionPermits` fields `PermitType` and `IssueDate` are used outside the standard table/map views.

### CivilRightsTimeline.tsx (Researcher Portal)

**Endpoints:** `censusBlock`, `serviceRequests311`, `codeViolations`, `neighborhoods`, `communityCenters`, `libraries`, `educationFacilities`

New usage pattern — analytics panels below the timeline:

- **DemographicsChart:** `queryTotalStats` for `censusBlock` with 9 fields: `P1_003N` through `P1_009N`, `OCC_HH`, `VAC_HH` — **2 NEW fields: `P1_009N` (Two or More Races), `P1_001N` (Total Population)**
- **EquityIndicators:** `queryFeatureStats` for `serviceRequests311` groupBy `District` + `codeViolations` groupBy `CouncilDistrict` — service ratio analysis table
- **MontgomeryToday:** `queryTotalStats` for `censusBlock` field `P1_001N` + `queryFeatureCount` for `neighborhoods`, `communityCenters`, `libraries`, `educationFacilities` — city-at-a-glance metrics

**Impact:** This component now queries **7 different endpoints** (was 0 ArcGIS endpoints in Phase 1 — it only loaded a static GeoJSON). The demographics chart uses the full census race breakdown plus household data, and the equity indicators table introduces a novel cross-endpoint analysis pattern.

---

## 3. Per-Endpoint Detail (Updated)

### serviceRequests311

**Files & references (Phase 3):**

- `lib/hooks/use-map-data.ts` — Resident, City Staff, Researcher maps (outFields: Request_ID, Request_Type, Department, Address, Status, District)
- `lib/hooks/use-table-data.ts` — Resident, City Staff, Researcher tables (outFields vary by portal)
- `lib/hooks/use-chart-data.ts` — crimeTrends, serviceRequests, requestsByStatus, requestsByDistrict, districtComparison
- `lib/hooks/use-homepage-data.ts` — Homepage count + grouped stats
- `app/(resident)/resident/components/IncidentNewsfeed.tsx` — **[NEW]** Full 311 feed with 5-dimension filtering, 3 chart types, resolution time analytics
- `app/(resident)/resident/components/EmergencyContact.tsx` — **[NEW]** District demand bar chart + status donut
- `app/(citystaff)/citystaff/components/StaffingDashboard.tsx` — **[NEW]** Demand vs capacity chart + request type analysis
- `app/(researcher)/researcher/components/CivilRightsTimeline.tsx` — **[NEW]** Equity indicators table

**All fields used:** Request_ID, Request_Type, Department, Address, Status, District, Year, Create_Date, Close_Date, Origin, OBJECTID

**Query patterns:** queryFeaturesAsGeoJSON, queryFeatureAttributes, queryFeatureStats, queryFeatureCount, queryTotalStats

---

### constructionPermits

**Phase 3 additions:**

- `app/(business)/business/components/VacantLandExplorer.tsx` — **[NEW]** NearbyActivity sub-component queries `Address,PermitType,IssueDate,Status` for street-name-matched nearby permits

**All fields used (Phase 3):** PermitNo, PermitDescription, ProjectType, PhysicalAddress, EstimatedCost, Total_Fee, PermitStatus, IssuedDate, Zoning, ContractorName, UseType, Year, DistrictCouncil, OBJECTID, Status, **Address**, **PermitType**, **IssueDate**

---

### codeViolations

**Phase 3 additions:**

- `app/(citystaff)/citystaff/components/StaffingDashboard.tsx` — **[NEW]** groupBy `CouncilDistrict` + `CaseType` for demand analysis
- `app/(business)/business/components/VacantLandExplorer.tsx` — **[NEW]** NearbyActivity queries `Address1,ViolationType,DateOpened,Status`
- `app/(researcher)/researcher/components/CivilRightsTimeline.tsx` — **[NEW]** Equity indicators groupBy `CouncilDistrict`

**All fields used (Phase 3):** OffenceNum, CaseType, CaseStatus, Address1, CouncilDistrict, Year, District, **ViolationType**, **DateOpened**, **Status**

---

### pavingProject

**Phase 3 additions:**

- `app/(citystaff)/citystaff/components/StaffingDashboard.tsx` — **[NEW]** groupBy `DistrictDesc`/`Status`, queryTotalStats for `Length_Miles`, `AsphaltEst`, `EstTons`, `OBJECTID`

**All fields used (Phase 3):** FULLNAME, StreetName, From\_, To\_, DistrictDesc, Status, Year, Length_Miles, Contractor, CompletionDate, Class, OBJECTID, **AsphaltEst**, **EstTons**

---

### healthCare

**Phase 3 additions:**

- `app/(resident)/resident/components/EmergencyContact.tsx` — **[NEW]** Full facility finder with `COMPANY_NA,ADDRESS,PHONE,TYPE_FACIL,EMPLOY,BEDS_UNITS`

**All fields used (Phase 3):** COMPANY_NA, ADDRESS, TYPE_FACIL, **PHONE**, **EMPLOY**, **BEDS_UNITS**

---

### fireStations

**Phase 3 additions:**

- `app/(resident)/resident/components/EmergencyContact.tsx` — **[NEW]** Tabbed facility finder with `Id,Name,Address`

**All fields used (Phase 3):** Name, Address, **Id**

---

### censusBlock

**Phase 3 additions:**

- `app/(researcher)/researcher/components/CivilRightsTimeline.tsx` — **[NEW]** DemographicsChart with `P1_003N-P1_009N, OCC_HH, VAC_HH`; MontgomeryToday with `P1_001N`

**All fields used (Phase 3):** P1_001N (Total Pop), P1_003N (White), P1_004N (Black), P1_005N (Native), P1_006N (Asian), P1_007N (Pacific), P1_008N (Other), **P1_009N (Two or More)**, OCC_HH, VAC_HH

---

### neighborhoods

**Phase 3 additions:**

- `app/(researcher)/researcher/components/CivilRightsTimeline.tsx` — **[NEW]** MontgomeryToday count

**Files using:** 2 (up from 1). Now used in both Researcher map and CivilRightsTimeline.

---

## 4. Unused Endpoints

| Endpoint           | Recommendation                                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `censusBlockGroup` | Add to Researcher portal. Block group is the most common Census geography for demographic analysis. Could power a demographics table/chart showing population, race, income by block group. Currently `censusBlock` is used for totals, but block group would enable geographic drill-down. |

---

## 5. Hardcoded Data Audit (Updated)

### EmergencyContact.tsx

| Data               | Status       | Notes                                                                                                                                                  |
| ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `emergencyNumbers` | Still static | 4 phone numbers (911, MPD, Fire, City). These are stable reference data; no ArcGIS source for phone numbers. **Acceptable as static.**                 |
| `precinctMap`      | **REMOVED**  | Phase 1 had 9 hardcoded district-to-precinct mappings. **Now replaced with live `queryFeatureAttributes` from `policeFacilities`.**                    |
| `responseStats`    | **REMOVED**  | Phase 1 had 3 hardcoded FOP statistics. **Now replaced with live `queryFeatureStats` from `serviceRequests311` (district demand + status breakdown).** |

### StaffingDashboard.tsx

| Data                   | Status       | Notes                                                                                                                                             |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STAFFING` object      | Still static | MPD authorized/current/vacancy numbers from FOP reports. **No ArcGIS source. Acceptable as static.**                                              |
| `districtCoverage`     | Still static | 9 district officer counts. **No ArcGIS source — internal MPD data. Acceptable as static.**                                                        |
| `ACTION_ITEMS`         | Still static | 5 recruiting action items. **Editorial content, not data-driven. Acceptable as static.**                                                          |
| **NEW: Demand charts** | **LIVE**     | 311 requests by district, request type breakdown, code violations by type/district, paving by district/status — **all from live ArcGIS queries.** |

### CivilRightsTimeline.tsx

| Data                  | Status       | Notes                                                                                                       |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Timeline landmarks    | Still static | Loaded from `/data/civil-rights-landmarks.geojson`. **Curated historical content — appropriately static.**  |
| **NEW: Demographics** | **LIVE**     | Racial breakdown + household data from `censusBlock` — **all from live ArcGIS queries.**                    |
| **NEW: Equity table** | **LIVE**     | Cross-referenced 311 requests and code violations by district — **live ArcGIS queries across 2 endpoints.** |
| **NEW: City metrics** | **LIVE**     | Population, neighborhoods, community centers, libraries, schools counts — **live from 5 ArcGIS endpoints.** |

### LandReuseCard.tsx

| Data                    | Status       | Notes                                                                                                       |
| ----------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `ZONING_DESCRIPTIONS`   | Still static | 6 zoning code descriptions. Could be replaced with `zoning` endpoint's `ZoningDesc` field but low priority. |
| Reuse suggestions logic | Still static | Business logic, not data-driven. **Acceptable as static.**                                                  |

---

## 6. Remaining Gaps — Worth Surfacing

### Unused endpoint

- **`censusBlockGroup`** — Still the only endpoint with zero direct UI references. Block groups are the primary Census geography for ACS demographic data (income, education, housing tenure). Adding this to the Researcher portal's DemographicsChart could enable geographic drill-down alongside the existing block-level totals.

### Underused fields on existing endpoints

| Endpoint                 | Unused/Underused Fields                           | Potential Use                                                                            |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `constructionPermits`    | `DistrictCouncil` in tables/maps (only in charts) | Add to Researcher table for district-level permit analysis                               |
| `constructionPermits`    | `Total_Fee` missing from Researcher table         | Add for deeper cost analysis parity with Business table                                  |
| `pavingProject`          | `Contractor` — not used in StaffingDashboard      | Could add contractor breakdown chart for transparency                                    |
| `codeViolations`         | `CaseStatus` not used in StaffingDashboard        | Add status breakdown (Open/Closed) alongside type breakdown                              |
| `policeFacilities`       | No fields beyond Name/Address                     | If `District`, `Phone`, or `Hours` fields exist, they'd enrich the EmergencyContact view |
| `entertainmentDistricts` | Uses `*` (all fields)                             | Specify explicit outFields for performance                                               |
| `cityParks`              | Uses `*` (all fields)                             | Specify explicit outFields for performance                                               |
| `neighborhoods`          | Uses `*` (all fields) or count only               | Specify explicit outFields; could show neighborhood names in MontgomeryToday             |

### Cross-portal opportunities

| Opportunity                                      | Description                                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `pavementAssessment` for Researcher portal       | PCI data would enable infrastructure quality analysis by district. Currently only on City Staff map.     |
| `garbageSchedule` + `curbsideTrash` for Business | Business owners need pickup schedules. Currently Resident-only.                                          |
| `recyclingLocations` for Business                | Useful for businesses needing recycling services. Currently Resident-only.                               |
| `censusBlockGroup` for Researcher                | Enable geographic demographic drill-down beyond the block-level totals currently in CivilRightsTimeline. |

---

## 7. Overall Coverage Metrics

| Metric                                | Phase 1 | Phase 3 | Change        |
| ------------------------------------- | ------- | ------- | ------------- |
| Endpoints with UI references          | 27 / 28 | 27 / 28 | No change     |
| Endpoints at "Heavy" coverage         | 5       | 7       | +2            |
| Endpoints at "Moderate" coverage      | 3       | 9       | +6            |
| Endpoints at "Light" coverage         | 19      | 11      | -8 (upgraded) |
| Endpoints at "None"                   | 1       | 1       | No change     |
| Total unique field references         | ~126    | ~147    | +21 (~17%)    |
| Files referencing ArcGIS              | ~38     | ~58     | +20 (~53%)    |
| Endpoints queried in standalone pages | 2       | 18      | +16           |
| Cross-endpoint analysis patterns      | 2       | 6       | +4            |
| Hardcoded datasets replaced with live | 0       | 3       | +3            |

**Key takeaway:** Phase 3 shifted 8 endpoints from "Light" to "Moderate" or "Heavy" coverage, introduced 21 new field references, and replaced 3 hardcoded datasets with live ArcGIS queries. The five new standalone components collectively reference 18 different endpoints, with EmergencyContact alone querying 10. The most significant coverage gains are in `healthCare` (doubled from 3 to 6 fields), `pavingProject` (3 new aggregate fields), `censusBlock` (2 new demographic fields), and the cross-endpoint analysis patterns in CivilRightsTimeline and StaffingDashboard.

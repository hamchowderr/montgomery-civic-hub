# Montgomery Civic Hub

An AI-native civic dashboard for Montgomery, Alabama. Six portals serve different audiences — residents, business owners, city staff, researchers, executives, and data analysts — each with a Claude-powered AI agent that can **query live city data, search the web, and directly control the dashboard UI** in real time.

The AI isn't a sidebar chatbot. It's an embedded copilot with full awareness of what's on screen — which map layers are visible, what dataset the table shows, the current year filter, layout state — and can manipulate all of it through natural conversation. Ask it to "show me 311 requests on the map and filter to 2024" and it switches the view, toggles the layer, and sets the year range in one response.

![Homepage](screenshots/fresh-full.png)

## Portals

| Portal         | Route         | Audience             | Focus                                             |
| -------------- | ------------- | -------------------- | ------------------------------------------------- |
| **Resident**   | `/resident`   | Citizens             | Public safety, city services, neighborhood info   |
| **Business**   | `/business`   | Business owners      | Permits, licenses, commercial zones               |
| **City Staff** | `/citystaff`  | Government employees | Infrastructure, budgets, operations               |
| **Researcher** | `/researcher` | Academics & analysts | Crime trends, demographics, data exports          |
| **Executive**  | `/executive`  | City leadership      | KPI command center, briefings, cross-portal pulse |
| **Insights**   | `/insights`   | Analysts & planners  | Cross-district equity, trends, data stories       |

### Portal Dashboards (Resident, Business, City Staff, Researcher)

Each portal includes a shared foundation:

- **AI Chat** — Claude-powered agent with tool use (ArcGIS queries + web search) via CopilotKit
- **Interactive Map** — MapLibre GL with toggleable data layers and council district overlays
- **Data Table** — Sortable/filterable tables via TanStack Table with dataset switching
- **Charts** — Recharts visualizations of portal-specific datasets
- **Year Filter** — Global date range filter across all data views

Plus portal-specific features:

**Resident** — City Pulse newsfeed (Bright Data web search across 5 categories: news, government, safety, events, infrastructure), 311 incident newsfeed with live stats and filtering, emergency contact directory with facility counts and community resources.

**Business** — Vacant Land Explorer with interactive map of 900+ city-owned properties, neighborhood-level analytics (acreage, appraisal value, availability %), filterable by status (Available/Holding/Use/Leased) and neighborhood. AI can suggest reuse ideas for specific parcels based on zoning and acreage.

**City Staff** — MPD Staffing Dashboard with officer vacancy tracking (authorized vs. filled positions across ranks), 911 center staffing, district-level service demand (311 requests + code violations per district), paving infrastructure totals, and AI-generated staffing reports.

**Researcher** — Civil Rights Heritage Layer with 10 historically significant landmarks (Rosa Parks Museum, Legacy Museum, Dexter Avenue King Memorial Baptist Church, etc.) and 2 march routes (1955 Bus Boycott, 1965 Selma-to-Montgomery) overlaid on the map. AI can fly the map to any landmark. Demographics dashboard with 2020 Census racial breakdown and per-district equity indicators (311 requests, code violations, service ratios). CivilRightsTimeline component for temporal analysis.

### Analytical Dashboards (Executive, Insights)

AI-powered analytical dashboards focused on cross-cutting analysis:

**Executive** (`/executive`) — Scrollable command center for city leadership:

- Morning briefing generator (AI-powered, quick or detailed format)
- KPI grid with sparkline trends (311 requests, violations, MPD vacancy, permits)
- Alert priority queue with severity-coded items and "Discuss with AI" buttons
- Cross-portal pulse cards (safety, business, infrastructure, public safety)
- Service performance charts (311 resolution rates, permit investment by district)
- Infrastructure status (paving projects, MPD staffing)

**Insights** (`/insights`) — 5-tab analytics workbench:

- **Overview** — Radar chart and heat matrix across 9 districts and 6 metrics, with anomaly detection
- **Equity** — Composite equity scoring (demand vs investment z-scores), ranked by district
- **Trends** — Multi-metric time series with toggleable metric overlays
- **Districts** — Deep dive into any district with rankings and city-average comparisons
- **Stories** — AI-generated narrative analysis from computed data

## How the AI Works

### Two-Way Communication

The AI integration uses CopilotKit's action/readable pattern to create a bidirectional link between the AI agent and the UI:

**Readables** (UI → AI) — The AI continuously sees:

- Which portal it's in and what views are available
- Active data tab (Map/Table/Chart/Land), year range, available years
- Which map layers are visible and which are available
- Selected table dataset and available datasets
- Chat panel position (left/right), open/closed state, mobile/desktop mode
- Council district overlay visibility and selected district
- Portal-specific state: insights tab, selected metrics, staffing levels, vacancy rates, service demand by district, paving totals, violation breakdowns, 311 stats, emergency contacts, news summaries, civil rights landmarks, demographics data, land explorer filters and neighborhood summaries

**Actions** (AI → UI) — The AI can trigger:

| Action                         | Portal(s)     | What the AI can do                                          |
| ------------------------------ | ------------- | ----------------------------------------------------------- |
| `switch_data_tab`              | All 4 portals | Switch between Map, Table, Chart, and Land views            |
| `set_year_range`               | All 4 portals | Adjust the global year filter across all data views         |
| `set_map_layer_visibility`     | All 4 portals | Show/hide individual data layers on the map                 |
| `select_table_dataset`         | All 4 portals | Switch which dataset the data table displays                |
| `set_chat_position`            | All 6         | Move the chat panel to left or right side (desktop)         |
| `toggle_chat_panel`            | All 6         | Open/close the mobile chat sheet                            |
| `toggle_council_districts`     | All 4 portals | Show/hide the 9-district council boundary overlay on maps   |
| `refresh_news_category`        | Resident      | Refresh City Pulse news for a specific category             |
| `filter_land_by_neighborhood`  | Business      | Filter the Vacant Land Explorer to specific neighborhoods   |
| `filter_land_by_status`        | Business      | Filter properties by disposition status                     |
| `suggest_land_reuse`           | Business      | Generate AI reuse ideas for a specific city-owned parcel    |
| `generate_staffing_report`     | City Staff    | Generate a formatted markdown staffing report for MPD       |
| `fly_to_civil_rights_landmark` | Researcher    | Pan the map to a named civil rights landmark                |
| `generate_briefing`            | Executive     | Generate a quick or detailed morning briefing               |
| `highlight_alert`              | Executive     | Scroll to and highlight a specific priority alert           |
| `switch_executive_view`        | Executive     | Navigate to a dashboard section                             |
| `switch_insight_tab`           | Insights      | Switch between Overview, Equity, Trends, Districts, Stories |
| `select_district`              | Insights      | Focus on a specific district (D1-D9) for deep analysis      |
| `toggle_metric`                | Insights      | Show/hide metrics on the trends chart                       |
| `generate_data_story`          | Insights      | Generate a narrative data story on a chosen topic           |

### Server-Side Tools

Each AI agent also has two server-side tools for fetching data:

- **`arcgis_query`** — Queries Montgomery's ArcGIS FeatureServer with SQL-style WHERE clauses. Covers 30+ datasets: 311 requests, permits, violations, facilities, census data, boundaries, and more. Results are geometry-stripped and cached in Convex (15-min TTL).
- **`brightdata_search`** — Web search via Bright Data for current events, news, council agendas, and information beyond structured city data. Cached in Convex (1-hour TTL).

### Per-Portal AI Personas

Each portal gets a tailored system prompt with Montgomery-specific context (population, demographics, economy, civil rights heritage, public safety stats) plus a persona matched to the audience:

- **Resident** — Friendly, plain language, neighborhood-focused. Suggests practical next steps.
- **Business** — Professional, data-forward, opportunity-minded. Highlights growth areas and development sites.
- **City Staff** — Analytical, report-oriented. Structures responses for presentations. Cross-references datasets.
- **Researcher** — Methodologically transparent. Cites dataset names, field names, record counts. Suggests interdisciplinary analyses. Includes civil rights spatial overlay analysis.
- **Executive** — AI chief of staff. Leads with headline findings, closes with actionable recommendations. Generates briefings.
- **Insights** — Civic data analyst. Speaks in comparative statistics and z-scores. Generates narrative data stories.

![Chat Demo](screenshots/fresh-chat-demo.png)

## Tech Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Framework    | Next.js 14 (App Router)                                 |
| Language     | TypeScript                                              |
| UI           | shadcn/ui (new-york), Tailwind CSS, Lucide icons        |
| AI Agent     | CopilotKit + AG-UI (CivicAgent extending AbstractAgent) |
| AI Model     | Anthropic Claude (tool use loop with streaming)         |
| Database     | Convex (real-time backend)                              |
| Maps         | MapLibre GL                                             |
| Charts       | Recharts                                                |
| Tables       | TanStack React Table                                    |
| Data Sources | Montgomery ArcGIS FeatureServer, Bright Data web search |
| Animations   | motion/react (homepage only)                            |
| Streaming    | RxJS Observables (AG-UI event streams)                  |
| Testing      | Vitest, Testing Library, Playwright, Supertest          |

## Architecture

### AI Backend

```
Portal UI → CopilotProvider(agent="portal") → POST /api/copilotkit
              → CopilotRuntime (6 CivicAgent instances)
                → CivicAgent (AG-UI AbstractAgent, RxJS Observable streams)
                  ├→ arcgis_query → ArcGIS FeatureServer (30+ datasets)
                  └→ brightdata_search → Bright Data web search
                → Convex (cache query results)
```

CivicAgent (`lib/ai/civic-agent.ts`) extends AG-UI's `AbstractAgent` and implements a Claude tool-use loop with up to 5 iterations per request. It emits AG-UI events (RUN_STARTED, TOOL_CALL_START, TEXT_MESSAGE_CONTENT, etc.) as RxJS Observables that CopilotKit consumes on the client. Token limits scale by portal complexity: 4096 for resident/business, 8192 for citystaff/researcher/executive/insights.

A legacy streaming endpoint (`/api/chat/[portal]`) also exists, using the same tools and prompts.

### Data Flow

- **AI chat data**: Server-side via CivicAgent tool calls → ArcGIS / Bright Data → geometry-stripped, truncated, cached in Convex.
- **Map/Table/Chart data**: Client-side via `lib/arcgis-client.ts` (Montgomery's GIS server blocks cloud IPs, so browser-direct requests are required). 5-minute in-memory cache.
- **Year filtering**: Global `YearFilterProvider` context generates ArcGIS SQL WHERE clauses for date-scoped queries across all portal data views.

### Project Structure

```
app/
  (resident)/resident/       # Resident portal + colocated components
    components/
      ResidentMap.tsx         #   Map with safety/facility layers
      ResidentTable.tsx       #   Multi-dataset data table
      ResidentChart.tsx       #   Portal-specific charts
      city-pulse/             #   City Pulse newsfeed (Bright Data)
      newsfeed/               #   311 incident newsfeed
      emergency/              #   Emergency contacts + community resources
  (business)/business/       # Business portal + colocated components
    components/
      BusinessMap.tsx         #   Map with permit/license/zoning layers
      BusinessTable.tsx       #   Multi-dataset data table
      BusinessChart.tsx       #   Portal-specific charts
      vacant-land/            #   Vacant Land Explorer (900+ properties)
  (citystaff)/citystaff/     # City Staff portal + colocated components
    components/
      CityStaffMap.tsx        #   Map with infrastructure layers
      CityStaffTable.tsx      #   Multi-dataset data table
      CityStaffChart.tsx      #   Portal-specific charts
      staffing/               #   MPD Staffing Dashboard
  (researcher)/researcher/   # Researcher portal + colocated components
    components/
      ResearcherMap.tsx       #   Map with all data layers
      ResearcherTable.tsx     #   Multi-dataset data table
      ResearcherChart.tsx     #   Portal-specific charts
      CivilRightsLayer.tsx    #   Heritage landmarks + march routes
      CivilRightsTimeline.tsx #   Demographics + equity indicators
      demographics/           #   Demographics dashboard
      civil-rights/           #   Equity indicators, demographics charts
  executive/                 # Executive KPI command center
  insights/                  # Cross-district analytics workbench
  api/
    chat/[portal]/           # Legacy streaming chat endpoint
    copilotkit/              # CopilotKit runtime (6 CivicAgent instances)
  privacy/, terms/           # Legal pages
  page.tsx                   # Animated landing page

components/
  Homepage.tsx               # Landing page with motion/react animations
  homepage/                  # LiveDataShowcase, PortalPreview
  CopilotProvider.tsx        # CopilotKit wrapper (per-portal agent routing)
  PortalLayout.tsx           # Resizable two-panel layout (chat + data)
  ChatPanel.tsx              # Floating chat panel
  DataPanel.tsx              # Tabbed Map/Table/Chart/Land interface
  CouncilDistrictsLayer.tsx  # 9-district map overlay (all portals)
  YearFilterBar.tsx          # Year range filter UI
  StatusLegend.tsx           # Semantic status color system
  chart-helpers.tsx          # Chart loading/error states
  map-helpers.tsx            # Reusable MapLibre circle layers
  ui/                        # shadcn/ui primitives
  ai-elements/               # AI chat UI components

lib/
  ai/civic-agent.ts          # CivicAgent (AG-UI AbstractAgent, RxJS)
  ai/client.ts               # Legacy Claude tool-use loop
  ai/prompts.ts              # 6 portal-specific system prompts
  ai/tools.ts                # Tool definitions (arcgis_query, brightdata_search)
  arcgis-client.ts           # Client-side ArcGIS (40+ dataset URLs)
  arcgis-helpers.ts          # yearWhere(), formatCurrency()
  contexts/year-filter.tsx   # YearRange context + buildWhereClause()
  hooks/                     # Shared data hooks
  tours.ts                   # Portal-specific onboarding tours

convex/
  schema.ts                  # Tables: caches, registry, users
  queries.ts, mutations.ts   # Backend logic
  actions.ts                 # Convex actions
  datasetRegistry.ts         # Dataset registry queries
  chartData.ts, mapData.ts   # Data caching modules
  portalStats.ts             # Portal statistics

tests/
  unit/                      # Vitest: tools, prompts, components, tours
  api/                       # Chat endpoint tests
  e2e/                       # Playwright: smoke, homepage, showcase
```

### Page Hierarchy

**Portal dashboards** (resident, business, citystaff, researcher):

```
CopilotProvider(agent="portal")
  └→ YearFilterProvider
       └→ PortalLayout (resizable two-panel: chat + content)
            └→ DataPanel (tabbed Map/Table/Chart + portal-specific tabs)
                 ├→ [Portal]Map.tsx        ← AI can toggle layers, districts
                 ├→ [Portal]Table.tsx      ← AI can switch datasets
                 ├→ [Portal]Chart.tsx
                 └→ [Portal-specific views] ← AI can filter, generate reports
```

**Analytical dashboards** (executive, insights):

```
CopilotProvider(agent="executive|insights")
  └→ YearFilterProvider
       └→ PortalLayout (resizable two-panel: chat + content)
            └→ ExecutiveDashboard | InsightsDashboard
```

### Hooks

| Hook                 | Purpose                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| useCopilotChatStream | CopilotKit-based chat (wraps useCopilotChat)                                                           |
| useChatStream        | Original streaming chat (legacy)                                                                       |
| usePortalData        | Client-side ArcGIS portal stats                                                                        |
| useMapData           | Client-side map feature data                                                                           |
| useChartData         | Client-side chart data (20+ chart IDs including KPI trends, multi-metric trends, cross-portal summary) |
| useTableData         | Client-side table data                                                                                 |
| useLayerVisibility   | Map layer toggle state                                                                                 |
| useHomepageData      | Fetch and animate homepage stats                                                                       |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account (free tier works)

### Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd montgomery-civic-hub
   npm install
   ```

2. **Configure environment**

   Create `.env.local`:

   ```env
   CONVEX_DEPLOYMENT=your-convex-deployment
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   ANTHROPIC_API_KEY=your-anthropic-key
   BRIGHTDATA_API_TOKEN=your-brightdata-token
   ```

3. **Start development servers**

   You need both the Next.js dev server and the Convex backend running:

   ```bash
   # Terminal 1
   npx convex dev

   # Terminal 2
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

   > **Note:** The app gracefully degrades without Convex — the UI renders but chat and data persistence are disabled.

## Scripts

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run test:e2e     # Playwright E2E tests
npx convex dev       # Start Convex backend
```

## Data Sources

All map, table, and chart data comes from **Montgomery, AL's public ArcGIS FeatureServer** — no API keys required. Data is fetched client-side (Montgomery's GIS server blocks cloud IPs) with a 5-minute in-memory cache.

### Live Operational Data

These datasets are actively updated by city systems and reflect current or recent activity:

| Dataset                         | Key                   | What's Tracked                                                | Update Frequency                       |
| ------------------------------- | --------------------- | ------------------------------------------------------------- | -------------------------------------- |
| **311 Service Requests**        | `serviceRequests311`  | Citizen-reported issues (potholes, streetlights, trash, etc.) | Real-time as requests are filed        |
| **Business Licenses**           | `businessLicense`     | Active business registrations, license types, locations       | Updated as licenses are issued/renewed |
| **Construction Permits**        | `constructionPermits` | Building permits — type, status, location, year               | Updated as permits are issued          |
| **Code Violations**             | `codeViolations`      | Property code violations — type, status, year                 | Updated as violations are recorded     |
| **Paving Projects**             | `pavingProject`       | Road paving/resurfacing projects — status, location           | Updated as projects progress           |
| **Nuisance Reports**            | `nuisance`            | Nuisance property complaints and enforcement                  | Updated as cases are filed             |
| **Garbage Collection Schedule** | `garbageSchedule`     | Trash pickup zones and schedules                              | Seasonal updates                       |
| **Curbside Trash**              | `curbsideTrash`       | Curbside pickup routes and service areas                      | Seasonal updates                       |

### Facility & Infrastructure Data

Relatively static datasets representing physical locations:

| Dataset                     | Key                      | What's Tracked                           |
| --------------------------- | ------------------------ | ---------------------------------------- |
| **Police Facilities**       | `policeFacilities`       | Police stations and substations          |
| **Fire Stations**           | `fireStations`           | Fire department locations                |
| **Community Centers**       | `communityCenters`       | Public community center locations        |
| **Libraries**               | `libraries`              | Public library branches                  |
| **Education Facilities**    | `educationFacilities`    | Schools and educational institutions     |
| **Daycare Centers**         | `daycareCenters`         | Licensed daycare facilities              |
| **Health Care Facilities**  | `healthCare`             | Hospitals, clinics, health centers       |
| **City Parks**              | `cityParks`              | Public parks and recreation areas        |
| **Recycling Locations**     | `recyclingLocations`     | Drop-off recycling sites                 |
| **Tornado Sirens**          | `tornadoSirens`          | Emergency siren locations                |
| **City-Owned Properties**   | `cityOwnedProperties`    | Municipal property inventory             |
| **Entertainment Districts** | `entertainmentDistricts` | Designated entertainment zone boundaries |

### Boundary & Planning Layers

Geographic boundary datasets used as map overlays:

| Dataset                | Key                | What's Tracked                                          |
| ---------------------- | ------------------ | ------------------------------------------------------- |
| **Council Districts**  | `councilDistricts` | 9 city council district boundaries (toggleable overlay) |
| **Neighborhoods**      | `neighborhoods`    | Named neighborhood boundaries                           |
| **Zoning**             | `zoning`           | Land use zoning classifications                         |
| **Flood Hazard Areas** | `floodHazardAreas` | FEMA flood zone boundaries                              |

### Census & Demographics (2020 Census)

Three levels of geographic granularity for demographic analysis:

| Dataset                 | Key                | Granularity                     |
| ----------------------- | ------------------ | ------------------------------- |
| **Census Tracts**       | `censusTract`      | Largest — ~4,000 people each    |
| **Census Block Groups** | `censusBlockGroup` | Medium — ~600-3,000 people each |
| **Census Blocks**       | `censusBlock`      | Smallest — individual blocks    |

### Infrastructure Assessment

| Dataset                      | Key                  | What's Tracked                                     |
| ---------------------------- | -------------------- | -------------------------------------------------- |
| **Pavement Assessment 2025** | `pavementAssessment` | Road condition ratings and pavement quality scores |

### Portal to Dataset Mapping

Each portal surfaces different datasets in its stats, maps, tables, and charts:

| Portal         | Primary Datasets                                                                                     | Stats Displayed                                      |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Resident**   | 311 requests, health facilities, recycling locations, garbage schedule, community centers, libraries | 311 count, health facilities, recycling locations    |
| **Business**   | Business licenses, construction permits, entertainment districts, zoning, city-owned properties      | License count, permit count, entertainment districts |
| **City Staff** | Paving projects, code violations, 311 requests, pavement assessment, city-owned properties           | Paving projects, violations, 311 count               |
| **Researcher** | 311 requests, business licenses, code violations, census data, all boundary layers                   | 311 count, license count, violation count            |

### Additional Data Sources

| Source                     | Used For                                                                                 | Integration                                      |
| -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Bright Data Web Search** | AI chat — real-time web search for questions beyond ArcGIS data                          | Server-side via CopilotKit runtime + legacy chat |
| **Convex**                 | Chat message persistence, ArcGIS query cache (15-min TTL), web scrape cache (1-hour TTL) | Real-time backend with `npx convex dev`          |

### Caching Strategy

| Layer                  | TTL    | Scope                                               |
| ---------------------- | ------ | --------------------------------------------------- |
| Browser in-memory      | 5 min  | Client-side ArcGIS queries (`lib/arcgis-client.ts`) |
| Convex `arcgis_cache`  | 15 min | Server-side AI chat ArcGIS tool calls               |
| Convex `scraped_cache` | 1 hour | Bright Data web search results                      |

## License

Private project — not licensed for redistribution.

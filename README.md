# Montgomery Civic Hub

A four-portal civic dashboard for Montgomery, Alabama — powered by AI agents (CopilotKit + AG-UI), live ArcGIS data, interactive maps, and real-time analytics. Each portal is tailored for a specific audience: residents, business owners, city staff, and researchers.

![Homepage](screenshots/fresh-full.png)

## Portals

| Portal         | Route         | Audience             | Focus                                           |
| -------------- | ------------- | -------------------- | ----------------------------------------------- |
| **Resident**   | `/resident`   | Citizens             | Public safety, city services, neighborhood info |
| **Business**   | `/business`   | Business owners      | Permits, licenses, commercial zones             |
| **City Staff** | `/citystaff`  | Government employees | Infrastructure, budgets, operations             |
| **Researcher** | `/researcher` | Academics & analysts | Crime trends, demographics, data exports        |

Each portal includes:

- **AI Chat** — Claude-powered agent with tool use (ArcGIS queries + web search) via CopilotKit
- **Interactive Map** — MapLibre GL with toggleable council district overlays
- **Data Table** — Sortable/filterable tables via TanStack Table
- **Charts** — Recharts visualizations of portal-specific datasets
- **Year Filter** — Global date range filter across all data views

### AI-Controlled Interactivity

The AI agent can control all interactive UI elements through CopilotKit actions:

| Action                     | What the AI can do                                        |
| -------------------------- | --------------------------------------------------------- |
| `switch_data_tab`          | Switch between Map, Table, and Chart views                |
| `set_year_range`           | Adjust the global year filter across all data views       |
| `set_map_layer_visibility` | Show/hide individual data layers on the map               |
| `select_table_dataset`     | Switch which dataset the data table displays              |
| `set_chat_position`        | Move the chat panel to left or right side (desktop)       |
| `toggle_chat_panel`        | Open/close the mobile chat sheet                          |
| `toggle_council_districts` | Show/hide the 9-district council boundary overlay on maps |

The AI is also aware of all current UI state (active tab, visible layers, selected dataset, year range, layout mode, district overlay status) via CopilotKit readables.

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

### Dual AI Backend

Two parallel AI systems coexist, both using the same tools and prompts:

**CopilotKit + AG-UI (primary):**

```
Portal UI → CopilotProvider(agent) → POST /api/copilotkit
              → CivicAgent (AG-UI AbstractAgent, RxJS Observable streams)
                ├→ arcgis_query → ArcGIS FeatureServer
                └→ brightdata_search → Bright Data web search
              → Convex (persist messages + cache results)
```

**Original streaming endpoint (legacy):**

```
Portal UI → POST /api/chat/[portal] → Claude tool-use loop (max 5 iterations)
              → streamed ReadableStream response
```

- **Chat**: CivicAgent emits AG-UI events (RUN_STARTED, TOOL_CALL_START, TEXT_MESSAGE_CONTENT, etc.) as RxJS Observables. CopilotKit runtime consumes these on the client.
- **Map/Table/Chart data**: Fetched client-side via `lib/arcgis-client.ts` (Montgomery's GIS server blocks cloud IPs, so browser-direct requests are required).
- **Year filtering**: Global `YearFilterProvider` context generates ArcGIS SQL WHERE clauses for date-scoped queries across all portal data views.
- **Caching**: ArcGIS results cached in Convex with 15-min TTL; web scrape results cached with 1-hour TTL.

### Project Structure

```
app/
  (resident)/resident/       # Resident portal + colocated components
  (business)/business/       # Business portal + colocated components
  (citystaff)/citystaff/     # City Staff portal + colocated components
  (researcher)/researcher/   # Researcher portal + colocated components
  api/
    chat/[portal]/           # Legacy streaming chat endpoint
    copilotkit/              # CopilotKit runtime endpoint (4 portal agents)
  privacy/, terms/           # Legal pages
  page.tsx                   # Landing page

components/
  Homepage.tsx               # Animated landing page
  homepage/                  # Homepage subcomponents (LiveDataShowcase, PortalPreview)
  CopilotProvider.tsx        # CopilotKit provider wrapper (per-portal agent config)
  PortalLayout.tsx           # Resizable two-panel layout (chat + data, side toggle)
  ChatPanel.tsx              # Floating chat panel (compact)
  ChatWidget.tsx             # Portal-agnostic chat panel (legacy)
  DataPanel.tsx              # Tabbed Map/Table/Chart interface
  YearFilterBar.tsx          # Year range filter UI selector
  CouncilDistrictsLayer.tsx  # Council districts map overlay
  StatusLegend.tsx           # Semantic status color system
  chart-helpers.tsx          # Chart loading/error states
  map-helpers.tsx            # Reusable MapLibre circle layers
  ui/                        # shadcn/ui primitives
  ai-elements/               # AI chat UI components (from ai-sdk.dev registry)

lib/
  ai/client.ts               # Original Claude tool-use loop
  ai/civic-agent.ts          # CivicAgent (AG-UI AbstractAgent, RxJS Observable streams)
  ai/prompts.ts              # Portal-specific system prompts
  ai/tools.ts                # Tool definitions (arcgis_query, brightdata_search)
  arcgis-client.ts           # Client-side ArcGIS utility (40+ dataset URLs)
  arcgis-helpers.ts          # yearWhere(), formatCurrency() utilities
  contexts/year-filter.tsx   # YearRange context provider + buildWhereClause()
  hooks/                     # Shared hooks (see below)
  tours.ts                   # Portal-specific onboarding tours

convex/
  schema.ts                  # 7 tables (chat_messages, caches, registry)
  queries.ts, mutations.ts   # Backend logic
  actions.ts                 # Convex actions
  datasetRegistry.ts         # Dataset registry queries
  chartData.ts, mapData.ts   # Data caching modules
  portalStats.ts             # Portal statistics

tests/
  unit/                      # Vitest component & logic tests
  api/                       # Chat endpoint tests
  e2e/                       # Playwright smoke & visual tests
```

### Portal Page Structure

Each portal page follows this provider/layout hierarchy:

```
CopilotProvider(agent="portal")
  └→ YearFilterProvider
       └→ PortalLayout (resizable two-panel)
            ├→ ChatPanel (CopilotKit chat)
            └→ DataPanel (tabbed Map/Table/Chart)
                 ├→ [Portal]Map.tsx
                 ├→ [Portal]Table.tsx
                 └→ [Portal]Chart.tsx
```

### Hooks

| Hook                 | Purpose                                      |
| -------------------- | -------------------------------------------- |
| useCopilotChatStream | CopilotKit-based chat (wraps useCopilotChat) |
| useChatStream        | Original streaming chat (legacy)             |
| usePortalData        | Client-side ArcGIS portal stats              |
| useMapData           | Client-side map feature data                 |
| useChartData         | Client-side chart data                       |
| useTableData         | Client-side table data                       |
| useLayerVisibility   | Map layer toggle state                       |
| useHomepageData      | Fetch and animate homepage stats             |

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
| **Census Block Groups** | `censusBlockGroup` | Medium — ~600–3,000 people each |
| **Census Blocks**       | `censusBlock`      | Smallest — individual blocks    |

### Infrastructure Assessment

| Dataset                      | Key                  | What's Tracked                                     |
| ---------------------------- | -------------------- | -------------------------------------------------- |
| **Pavement Assessment 2025** | `pavementAssessment` | Road condition ratings and pavement quality scores |

### Portal → Dataset Mapping

Each portal surfaces different datasets in its stats, maps, tables, and charts:

| Portal         | Primary Datasets                                                                                     | Stats Displayed                                      |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Resident**   | 311 requests, health facilities, recycling locations, garbage schedule, community centers, libraries | 311 count, health facilities, recycling locations    |
| **Business**   | Business licenses, construction permits, entertainment districts, zoning                             | License count, permit count, entertainment districts |
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

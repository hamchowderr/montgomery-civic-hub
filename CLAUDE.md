# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run test:e2e     # Playwright E2E tests
npx convex dev       # Start Convex dev backend (required alongside next dev)
```

To run a single test file: `npx vitest run tests/unit/foo.test.ts`

## Architecture

Four-portal civic dashboard for Montgomery, AL. Each portal targets a different audience with tailored AI chat, map visualization, data tables, and charts.

### Portals

| Portal     | Route         | Audience                                   |
| ---------- | ------------- | ------------------------------------------ |
| Resident   | `/resident`   | Citizens — safety, services                |
| Business   | `/business`   | Business owners — permits, licenses        |
| City Staff | `/citystaff`  | Government staff — infrastructure, budgets |
| Researcher | `/researcher` | Academics — crime trends, demographics     |

Root `/` renders a full animated landing page (`components/Homepage.tsx` + `components/homepage/`) with hero, stats, portal showcase, live data, how-it-works, and CTA sections.

### Dual AI Backend

Two parallel AI systems coexist:

1. **Original streaming endpoint** — `POST /api/chat/[portal]` → `lib/ai/client.ts` → Claude tool-use loop (max 5 iterations) → streamed response
2. **CopilotKit + AG-UI agent** — `POST /api/copilotkit` → `lib/ai/civic-agent.ts` → CivicAgent (extends @ag-ui/client AbstractAgent) → RxJS Observable event stream

Both use the same tools (`arcgis_query`, `brightdata_search`), system prompts (`lib/ai/prompts.ts`), and Convex persistence.

```
Portal UI → CopilotProvider(agent) → CopilotKit Runtime (/api/copilotkit)
                                      → CivicAgent (AG-UI AbstractAgent)
                                        ├→ arcgis_query → ArcGIS FeatureServer
                                        └→ brightdata_search → Bright Data MCP
                                      → Convex (persist messages + cache results)
```

ArcGIS data queries for maps/tables/charts happen **client-side** via `lib/arcgis-client.ts` (Montgomery's GIS server blocks Convex cloud IPs). Server-side tool use handles chat-initiated queries only.

### Key Directories

- `app/(resident|business|citystaff|researcher)/` — Portal pages with colocated components (Chat, Map, Table, Chart)
- `app/api/chat/[portal]/route.ts` — Original streaming chat endpoint
- `app/api/copilotkit/route.ts` — CopilotKit runtime endpoint (handles 4 portal agents)
- `app/privacy/`, `app/terms/` — Legal/compliance pages
- `lib/ai/client.ts` — Original Claude tool-use loop
- `lib/ai/civic-agent.ts` — CivicAgent class (AG-UI AbstractAgent with RxJS Observable streams)
- `lib/ai/prompts.ts` — Portal-specific system prompts (tone, focus, formatting differ per portal)
- `lib/ai/tools.ts` — Tool definitions (arcgis_query, brightdata_search)
- `lib/arcgis-client.ts` — Client-side ArcGIS utility (40+ dataset URLs, browser-safe, no API keys)
- `lib/arcgis-helpers.ts` — Utilities: yearWhere(), formatCurrency()
- `lib/contexts/year-filter.tsx` — YearRange context provider with buildWhereClause()
- `lib/hooks/` — Shared hooks (see Hooks section below)
- `lib/tours.ts` — Tour definitions (4 portal-specific onboarding tours, 6-7 steps each)
- `convex/` — Backend schema, queries, mutations, actions
- `components/ui/` — shadcn/ui primitives (new-york style)
- `components/ai-elements/` — AI chat UI components (message, conversation, prompt-input, reasoning, suggestion, shimmer) from ai-sdk.dev registry
- `components/homepage/` — Homepage subcomponents (LiveDataShowcase, PortalPreview)

### Portal Components Pattern

Each portal has 4 colocated components under its route group:

```
app/(portal)/portal/components/
  ├── [Portal]Chat.tsx   — Chat interface
  ├── [Portal]Map.tsx    — MapLibre map visualization
  ├── [Portal]Table.tsx  — Data table (@tanstack/react-table)
  └── [Portal]Chart.tsx  — Recharts visualizations
```

These are composed by `components/DataPanel.tsx` into a tabbed Map/Table/Chart interface.

Portal pages wrap components with:

```
CopilotProvider(agent) → YearFilterProvider → PortalLayout → DataPanel + ChatPanel
```

### Shared Components

- `components/Homepage.tsx` — Landing page with motion/react scroll animations
- `components/homepage/LiveDataShowcase.tsx` — Live data visualization with animations
- `components/homepage/PortalPreview.tsx` — Portal feature cards
- `components/CopilotProvider.tsx` — CopilotKit provider wrapper (per-portal agent config)
- `components/PortalLayout.tsx` — Resizable two-panel layout (chat + data) with side toggle
- `components/ChatPanel.tsx` — Floating chat panel (compact, non-resizable)
- `components/ChatWidget.tsx` — Portal-agnostic floating chat panel (legacy)
- `components/DataPanel.tsx` — Tabbed interface (Map/Table/Chart) with tour integration
- `components/YearFilterBar.tsx` — Year range filter UI selector
- `components/StatusLegend.tsx` — Semantic status colors (green/blue/amber/red/gray) + MapLibre expressions
- `components/CouncilDistrictsLayer.tsx` — Toggleable council districts map overlay (9 districts, ArcGIS source)
- `components/Footer.tsx` — Footer with privacy/terms links
- `components/TourWrapper.tsx` — Global tour provider
- `components/chart-helpers.tsx` — SkeletonBars + ChartErrorState loading/error states
- `components/map-helpers.tsx` — PointCircleLayer helper for reusable MapLibre circle layers

### Hooks

| Hook                 | File                         | Purpose                                      |
| -------------------- | ---------------------------- | -------------------------------------------- |
| useCopilotChatStream | `use-copilot-chat-stream.ts` | CopilotKit-based chat (wraps useCopilotChat) |
| useChatStream        | `use-chat-stream.ts`         | Original streaming chat hook                 |
| usePortalData        | `use-portal-data.ts`         | Client-side ArcGIS portal stats              |
| useMapData           | `use-map-data.ts`            | Client-side map feature data                 |
| useChartData         | `use-chart-data.ts`          | Client-side chart data                       |
| useTableData         | `use-table-data.ts`          | Client-side table data                       |
| useLayerVisibility   | `use-layer-visibility.ts`    | Map layer toggle state                       |
| useHomepageData      | `use-homepage-data.ts`       | Fetch and animate homepage stats             |

### Data Layer (Convex)

Seven tables defined in `convex/schema.ts`:

| Table                | Purpose            | Notes                                   |
| -------------------- | ------------------ | --------------------------------------- |
| `chat_messages`      | Chat conversations | Indexed by sessionId+createdAt          |
| `arcgis_cache`       | ArcGIS query cache | 15-min TTL, cache-aside                 |
| `scraped_cache`      | Web scrape cache   | 1-hour TTL, cache-aside                 |
| `dataset_registry`   | Dataset metadata   | Name, featureServerUrl, portals, fields |
| `portal_stats_cache` | Portal stats       | Deprecated — now client-side            |
| `map_features_cache` | Map GeoJSON        | Deprecated — now client-side            |
| `chart_data_cache`   | Chart data         | Deprecated — now client-side            |

Additional Convex modules: `datasetRegistry.ts`, `chartData.ts`, `mapData.ts`, `portalStats.ts`, `actions.ts`.

Run `npx convex dev` alongside `npm run dev` — the app needs both servers.

### Maps

MapLibre GL with a custom wrapper component per portal. Auto-syncs with dark/light theme via `next-themes`. Council districts layer available as toggleable overlay. Shared `PointCircleLayer` helper in `components/map-helpers.tsx`.

### Tours

Onboarding tour system using `components/ui/tour.tsx` (popover-based). Four portal-specific tours defined in `lib/tours.ts`. Tours target elements via `data-tour-step-id` attributes and are triggered by "Take a Tour" buttons on each portal page. Global `TourProvider` wraps the app via `components/TourWrapper.tsx`.

### Year Filtering

Global year range filter via `lib/contexts/year-filter.tsx`. Provides `YearFilterProvider` and `useYearFilter` hook. `buildWhereClause()` generates ArcGIS SQL WHERE clauses for date-filtered queries. `YearFilterBar` component displays the filter UI. Default range: 2018–current year.

## Environment Variables

Required in `.env.local`:

```
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
ANTHROPIC_API_KEY=
BRIGHTDATA_API_TOKEN=
```

`ConvexClientProvider` gracefully disables when URLs start with `YOUR_` (allows UI dev without Convex).

## Tests

```
tests/
  setup.ts                              — Vitest config
  unit/
    tools.test.ts                       — Tool definitions & execution
    prompts.test.ts                     — Portal prompt generation
    civic-agent.test.ts                 — CivicAgent class
    copilot-integration.test.tsx        — CopilotKit integration
    use-copilot-chat-stream.test.tsx    — CopilotKit chat hook
    ResidentChat.test.tsx               — ResidentChat component
    DataTable.test.tsx                  — DataTable component
    DataPanel.test.tsx                  — DataPanel component
    tours.test.ts                       — Tour definitions & logic
  api/
    chat.test.ts                        — Chat endpoint (portal validation, tool execution, errors)
  e2e/
    smoke.spec.ts                       — Playwright smoke (portal navigation, map, chat)
    homepage-visual.spec.ts             — Homepage visual tests
    debug-homepage.spec.ts              — Homepage debug tests
    showcase-demos.spec.ts              — Showcase demo tests
```

## Conventions

- **Database**: Convex (not Supabase). Use Convex queries/mutations/actions patterns.
- **AI model**: `claude-sonnet-4-20250514` with tool use. Tool-call iterations run non-streaming server-side; final text response streams to client.
- **AI agent**: CivicAgent class (`lib/ai/civic-agent.ts`) extends @ag-ui/client AbstractAgent with RxJS Observable event streaming.
- **Chat hooks**: Two coexist — `use-copilot-chat-stream.ts` (CopilotKit, primary) and `use-chat-stream.ts` (original streaming).
- **CopilotKit**: Provider wraps each portal page individually (not global). Runtime at `/api/copilotkit`. Uses `useCopilotReadable()` for portal context visibility.
- **Data hooks**: `use-portal-data.ts`, `use-map-data.ts`, `use-chart-data.ts`, `use-table-data.ts` — client-side ArcGIS fetching per portal.
- **Year filtering**: `YearFilterProvider` context wraps portal content. `useYearFilter()` for current range. `buildWhereClause()` for ArcGIS queries.
- **Portal isolation**: Each portal has its own Chat, Map, Table, and Chart components colocated under its route group. System prompts centralized in `lib/ai/prompts.ts`.
- **Portal layout**: `PortalLayout` provides resizable two-panel (chat + data) with side toggle. `DataPanel` provides tabbed Map/Table/Chart.
- **Path alias**: `@/*` maps to project root.
- **Styling**: Tailwind CSS with CSS variable-based theming. Dark mode via class strategy.
- **Animations**: `motion/react` for scroll-driven animations (homepage only). No animations in portal dashboards.
- **shadcn/ui**: new-york style. AI elements from `@ai-elements` registry (ai-sdk.dev).
- **Icons**: Lucide React.

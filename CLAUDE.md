# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
For detailed docs, see `.claude/docs/`.

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

Single test: `npx vitest run tests/unit/foo.test.ts`

## Architecture Overview

Six-portal AI-native civic dashboard for Montgomery, AL. Each portal has a Claude-powered AI agent that can query live city data, search the web, and directly control the dashboard UI.

| Portal     | Route         | Audience                    |
| ---------- | ------------- | --------------------------- |
| Resident   | `/resident`   | Citizens — safety, services |
| Business   | `/business`   | Permits, licenses           |
| City Staff | `/citystaff`  | Infrastructure, budgets     |
| Researcher | `/researcher` | Crime trends, demographics  |
| Executive  | `/executive`  | KPI command center          |
| Insights   | `/insights`   | Cross-district analytics    |

Root `/` renders an animated landing page.

**AI**: CivicAgent (AG-UI AbstractAgent + Claude tool-use loop) via CopilotKit. 6 agents with portal-specific personas. AI sees all UI state (readables) and can control UI elements (actions). Server-side tools: `arcgis_query`, `brightdata_search`. See `.claude/docs/copilotkit.md`.

**Data**: Client-side ArcGIS fetching (Montgomery GIS blocks cloud IPs). Convex for persistence/caching. See `.claude/docs/architecture.md`.

**Portal page hierarchy**:

```
CopilotProvider(agent) → YearFilterProvider → PortalLayout → DataPanel + ChatPanel
```

Portal-specific features: City Pulse + 311 Newsfeed + Emergency (Resident), Vacant Land Explorer (Business), MPD Staffing Dashboard (City Staff), Civil Rights Layer + Demographics (Researcher).

## Environment Variables

Required in `.env.local`:

```
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
ANTHROPIC_API_KEY=
BRIGHTDATA_API_TOKEN=
```

`ConvexClientProvider` gracefully disables when URLs start with `YOUR_`.

Run `npx convex dev` alongside `npm run dev` — the app needs both servers.

## Conventions

- **Database**: Convex (not Supabase). Use Convex queries/mutations/actions.
- **AI model**: `claude-sonnet-4-20250514` with tool use.
- **CopilotKit**: Provider wraps each portal page individually (not global). Runtime at `/api/copilotkit`. 6 CivicAgent instances (one per portal). See `.claude/docs/copilotkit.md`.
- **Data hooks**: `use-portal-data`, `use-map-data`, `use-chart-data`, `use-table-data` — all client-side ArcGIS.
- **Year filtering**: `YearFilterProvider` + `useYearFilter()` + `buildWhereClause()`.
- **Portal isolation**: Each portal has colocated Chat, Map, Table, Chart components. Prompts in `lib/ai/prompts.ts`.
- **Path alias**: `@/*` maps to project root.
- **Styling**: Tailwind CSS, CSS variable theming, dark mode via class strategy.
- **shadcn/ui**: new-york style. AI elements from `@ai-elements` registry.
- **Icons**: Lucide React.
- **Animations**: `motion/react` on homepage only. No animations in portal dashboards.

## Tests

```
tests/
  unit/     — Vitest: tools, prompts, civic-agent, copilot, components, tours
  api/      — Chat endpoint tests
  e2e/      — Playwright: smoke, homepage visual, showcase demos
```

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

Four-portal civic dashboard for Montgomery, AL. Each portal targets a different audience with AI chat, map visualization, data tables, and charts.

| Portal     | Route         | Audience                    |
| ---------- | ------------- | --------------------------- |
| Resident   | `/resident`   | Citizens — safety, services |
| Business   | `/business`   | Permits, licenses           |
| City Staff | `/citystaff`  | Infrastructure, budgets     |
| Researcher | `/researcher` | Crime trends, demographics  |

Root `/` renders an animated landing page.

**AI**: CopilotKit + AG-UI agent (primary) and original streaming endpoint (legacy). Both use `arcgis_query` and `brightdata_search` tools. See `.claude/docs/copilotkit.md`.

**Data**: Client-side ArcGIS fetching (Montgomery GIS blocks cloud IPs). Convex for persistence/caching. See `.claude/docs/architecture.md`.

**Portal page hierarchy**:

```
CopilotProvider(agent) → YearFilterProvider → PortalLayout → DataPanel + ChatPanel
```

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
- **CopilotKit**: Provider wraps each portal page individually (not global). Runtime at `/api/copilotkit`. 4 agents (one per portal). See `.claude/docs/copilotkit.md`.
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

# Implementation Plan: Location Weather Lookup

**Branch**: `001-location-weather-lookup` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-location-weather-lookup/spec.md`

## Summary

A responsive, modern web app where a user types a location (or uses their device location)
and sees current weather facts for it: temperature, feels-like, condition, humidity, wind,
today's high/low, sunrise/sunset, UV index, pressure, visibility, chance of rain, and the
last-updated time. The background adapts to the condition and day/night at the location,
light/dark mode follows the device, units default from the browser region, and the last 5
locations are remembered on the device.

Technical approach: a React + Vite single-page frontend talks only to a thin Fastify API
(TypeScript, Node 24). The API validates input, proxies Open-Meteo (geocoding + forecast,
no API key) and OpenStreetMap Nominatim (reverse geocoding for "use my location"),
normalizes responses into one stable JSON shape, and caches weather per location for
90 seconds in memory. All values are returned in metric; the frontend converts units so the
unit toggle is instant (see [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24 LTS (backend) and modern evergreen
browsers (frontend)

**Primary Dependencies**: Backend — Fastify 5 (built-in JSON-schema validation and pino
structured logging). Frontend — React 19, Vite 7. No UI component library; styling with CSS
Modules + CSS custom properties.

**Storage**: No server database. In-memory TTL cache (90 s) for weather on the API. Browser
`localStorage` for unit preference and up to 5 recent locations.

**Testing**: Vitest (backend unit + contract tests via `fastify.inject`, frontend unit/
component tests with React Testing Library + jsdom); Playwright + `@axe-core/playwright`
for end-to-end, responsive (320/768/1440 px), and accessibility checks.

**Target Platform**: Linux/macOS/Windows dev machines; any Node 24 host for the API; current
Chrome, Edge, Firefox, Safari for the UI.

**Project Type**: Web application (frontend + backend API)

**Performance Goals**: 95% of valid lookups render results ≤ 3 s end to end (SC-002); API
adds ≤ 100 ms over upstream latency; cache hits answer in ≤ 20 ms.

**Constraints**: Upstream calls time out at 5 s; weather reuse window ≤ 90 s (FR-015); no
secrets required; no searched locations persisted server-side (FR-014); raw device
coordinates rounded to 2 decimals (~1 km) before leaving the API and never logged;
WCAG 2.1 AA; layouts from 320 px wide.

**Scale/Scope**: Course demo — tens of concurrent users, 1 screen, 3 API data endpoints
plus health, ~25 frontend components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies | Status |
|---|-----------|------------------------|--------|
| I | Spec-First | Plan derives from clarified spec; every endpoint/component maps to FRs; tasks will trace to stories. | ✅ Pass |
| II | Test-First | Contract tests from [contracts/openapi.yaml](./contracts/openapi.yaml) and component tests from acceptance scenarios written before implementation; Playwright covers each user story. | ✅ Pass |
| III | Simplicity | Two packages only; no database, no state library, no UI kit, no auth; in-memory cache; keyless providers. Each dependency justified in research. | ✅ Pass |
| IV | Code Quality | ESLint (typescript-eslint) + Prettier enforced in CI scripts; strict TypeScript. | ✅ Pass |
| V | UX Consistency | One shared design-token stylesheet and component set; one API error shape `{ error: { code, message } }`; WCAG 2.1 AA verified by axe. | ✅ Pass |
| VI | Security & Privacy | No secrets; Fastify JSON-schema validation on every input; query strings and coordinates excluded from logs; coordinates rounded; recent locations stay in the browser; `npm audit` gate. | ✅ Pass |
| VII | Observability | pino JSON logs with timestamp, level, request ID (`x-request-id`), upstream timing and errors; `GET /api/health`. | ✅ Pass |

**Post-design re-check (after Phase 1)**: ✅ All gates still pass. The design added one
external dependency (Nominatim for reverse geocoding), justified in research §3; no new
packages or layers beyond those above.

## Project Structure

### Documentation (this feature)

```text
specs/001-location-weather-lookup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── openapi.yaml     # HTTP API contract (frontend ↔ backend)
│   └── client-storage.md# Browser localStorage contract
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
package.json                 # npm workspaces root: lint, test, dev scripts
eslint.config.js
.prettierrc

backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts            # Fastify bootstrap, logging, request IDs, error handler
│   ├── app.ts               # buildApp() for tests (fastify.inject)
│   ├── routes/
│   │   ├── health.ts        # GET /api/health
│   │   ├── locations.ts     # GET /api/locations/search, /api/locations/reverse
│   │   └── weather.ts       # GET /api/weather
│   ├── services/
│   │   ├── geocoding.ts     # Open-Meteo geocoding + Nominatim reverse
│   │   ├── forecast.ts      # Open-Meteo forecast → WeatherReport
│   │   ├── conditions.ts    # WMO weather code → description, icon, category
│   │   └── cache.ts         # 90 s in-memory TTL cache
│   └── schemas.ts           # JSON schemas shared by routes (mirror openapi.yaml)
└── tests/
    ├── contract/            # One file per endpoint, asserts openapi.yaml shapes
    └── unit/                # conditions, cache, normalization

frontend/
├── package.json
├── vite.config.ts           # dev proxy /api → backend
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/client.ts        # fetch wrapper with AbortController (latest-only)
│   ├── components/          # SearchBar, CandidateList, WeatherCard, FactTile,
│   │                        # RecentLocations, UnitToggle, LocateButton,
│   │                        # StatusMessage, Spinner, ConditionBackground
│   ├── hooks/               # useWeatherLookup, useRecentLocations, useUnits
│   ├── lib/                 # units.ts (conversion/formatting), storage.ts, locale.ts
│   └── styles/              # tokens.css (colors, spacing, type), themes.css
└── tests/
    ├── unit/                # units, storage, locale, hooks
    ├── component/           # one file per component / user-story scenario
    └── e2e/                 # Playwright specs per user story + a11y + responsive
```

**Structure Decision**: Web application layout with `backend/` and `frontend/` as npm
workspaces, matching the constitution's frontend/API separation. The frontend never calls
third-party services directly; all data flows through `/api`.

## Complexity Tracking

No constitution violations — section intentionally empty.

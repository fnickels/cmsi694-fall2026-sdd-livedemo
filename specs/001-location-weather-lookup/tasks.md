---

description: "Task list for Location Weather Lookup"
---

# Tasks: Location Weather Lookup

**Input**: Design documents from `/specs/001-location-weather-lookup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml,
contracts/client-storage.md, quickstart.md

**Tests**: REQUIRED. Constitution Principle II (Test-First, NON-NEGOTIABLE) mandates tests
written from acceptance criteria that fail before implementation, plus contract tests for
every API endpoint.

**Organization**: Tasks are grouped by user story so each story can be implemented and
tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (US1–US4)
- Field constraints are cited as `data-model.md` `Entity.field`; that document is canonical.

## Path Conventions

Web app (npm workspaces): `backend/src/`, `backend/tests/`, `frontend/src/`,
`frontend/tests/`, root config at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [ ] T001 Create root `package.json` as npm workspaces (`backend`, `frontend`) with scripts `dev` (runs both), `lint`, `format`, `test`, `test:e2e`, `audit` (`npm audit --audit-level=high`), and `.gitignore` for `node_modules/`, `dist/`, `playwright-report/`, `test-results/`
- [ ] T002 Initialize backend workspace: `backend/package.json` (Fastify 5, TypeScript 5, tsx, Vitest), `backend/tsconfig.json` (strict, ES2023, NodeNext), scripts `dev`, `build`, `start`, `test`
- [ ] T003 [P] Initialize frontend workspace with Vite 7 + React 19 + TypeScript: `frontend/package.json`, `frontend/tsconfig.json` (strict), `frontend/index.html`, `frontend/vite.config.ts` with dev proxy `/api` → `http://localhost:3000` and Vitest (jsdom) config; add `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- [ ] T004 [P] Configure ESLint 9 flat config with typescript-eslint and React hooks rules in `eslint.config.js`, and Prettier in `.prettierrc`; ensure `npm run lint` passes on the empty scaffold
- [ ] T005 [P] Add Playwright + `@axe-core/playwright` in `frontend/playwright.config.ts` with projects at viewport widths 320, 768, 1440 and `webServer` entries that start backend (port 3000) and frontend (port 5173)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by every user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundation (write first, must fail)

- [ ] T006 [P] Contract test for `GET /api/health` (200 `{status:"ok"}`, `x-request-id` header present and echoed when supplied) in `backend/tests/contract/health.test.ts`
- [ ] T007 [P] Unit tests for WMO code mapping (each category range in research §7, unknown code → `neutral`, description and icon key per day/night) in `backend/tests/unit/conditions.test.ts`
- [ ] T008 [P] Unit tests for unit conversion and formatting (°C↔°F, km/h↔mph, hPa→inHg, m→km/mi, degrees→16-point compass, `null` → "Not available") in `frontend/tests/unit/units.test.ts`
- [ ] T009 [P] Unit tests for default unit derivation (`en-US` → imperial, `en-GB`/`fr-FR` → metric, missing/invalid → imperial) per `data-model.md` UnitPreference in `frontend/tests/unit/locale.test.ts`
- [ ] T010 [P] Unit tests for safe storage helpers (invalid JSON or wrong type returns `null` and never throws) per `contracts/client-storage.md` in `frontend/tests/unit/storage.test.ts`

### Implementation for Foundation

- [ ] T011 Define shared JSON schemas and TypeScript types mirroring `contracts/openapi.yaml` (`Location`, `WeatherReport`, `Error`) in `backend/src/schemas.ts`, enforcing `data-model.md` Location.name, Location.latitude, Location.longitude, WeatherReport.condition.category, WeatherReport.humidityPct and WeatherReport.precipitationChancePct ranges, and nullable numbers for all WeatherReport measurement fields
- [ ] T012 Implement `buildApp()` in `backend/src/app.ts`: Fastify with pino JSON logging, `genReqId` honoring incoming `x-request-id` and echoing it in a response header, a request serializer that logs method, route pattern, status, duration and request ID but never the query string or coordinates (research §10), and a global error handler mapping to the `Error` schema (`VALIDATION_ERROR` 400, `INTERNAL_ERROR` 500)
- [ ] T013 Implement `GET /api/health` in `backend/src/routes/health.ts` and register it in `backend/src/app.ts`; create `backend/src/server.ts` that listens on `PORT` (default 3000)
- [ ] T014 [P] Implement an upstream fetch helper with `AbortSignal.timeout(5000)` that throws a typed `UpstreamUnavailableError` (provider name, status, duration logged) in `backend/src/services/http.ts`, and map that error to 503 `UPSTREAM_UNAVAILABLE` in the error handler in `backend/src/app.ts`
- [ ] T015 [P] Implement WMO weather-code mapping to description, icon key, and `data-model.md` WeatherReport.condition.category in `backend/src/services/conditions.ts`
- [ ] T016 [P] Define frontend types for `Location` and `WeatherReport` matching `contracts/openapi.yaml` in `frontend/src/api/types.ts`
- [ ] T017 [P] Implement conversion and formatting helpers (temperature, wind, pressure, visibility, compass direction, local time formatting in the location's timezone, `null` → "Not available") in `frontend/src/lib/units.ts`
- [ ] T018 [P] Implement default unit derivation from `navigator.language` via `Intl.Locale(...).maximize().region` in `frontend/src/lib/locale.ts` per `data-model.md` UnitPreference
- [ ] T019 [P] Implement typed `localStorage` read/write/remove helpers that discard invalid values in `frontend/src/lib/storage.ts` per `contracts/client-storage.md`
- [ ] T020 [P] Create design tokens (color, spacing, radius, type scale, shadows) in `frontend/src/styles/tokens.css` and light/dark themes via `prefers-color-scheme` meeting WCAG 2.1 AA contrast in `frontend/src/styles/themes.css` (FR-012, FR-012b, FR-013)
- [ ] T021 Implement API client `fetchJson` that parses the `Error` shape into a typed `ApiError` (`code`, `message`) and accepts an `AbortSignal` in `frontend/src/api/client.ts`
- [ ] T022 Create app shell: `frontend/src/main.tsx` importing global styles and `frontend/src/App.tsx` with page header, a main landmark, and an empty results region with `aria-live="polite"`

**Checkpoint**: `npm test` and `npm run lint` pass; `npm run dev` serves the shell and `/api/health`

---

## Phase 3: User Story 1 - Look up current weather by location name (Priority: P1) 🎯 MVP

**Goal**: Type a city or postal code, see the resolved place and all FR-005 facts with an
adaptive background; the last 5 locations are remembered and the most recent auto-loads.

**Independent Test**: Search "Los Angeles" and "90045"; confirm name plus all facts render;
reload and confirm the most recent location auto-loads and the recent list shows ≤ 5 entries.

### Tests for User Story 1 (write first, must fail) ⚠️

- [ ] T023 [P] [US1] Record Open-Meteo fixtures (geocoding for "Los Angeles", "90045"; forecast for Los Angeles incl. a variant with missing fields) as JSON in `backend/tests/fixtures/open-meteo/`
- [ ] T024 [P] [US1] Contract test for `GET /api/locations/search` 200 responses (1–5 `Location` items, rounded coordinates, `id` present) with `fetch` stubbed by fixtures in `backend/tests/contract/locations-search.test.ts`
- [ ] T025 [P] [US1] Contract test for `GET /api/weather` 200 response matching `WeatherReport` (all fields present, missing upstream fields → `null`, `name` query echoed) in `backend/tests/contract/weather.test.ts`
- [ ] T026 [P] [US1] Unit tests for weather cache (hit within 90 s returns same `fetchedAt`, miss after 90 s, key rounding to 2 decimals, 500-entry eviction, concurrent requests share one in-flight fetch) using fake timers in `backend/tests/unit/cache.test.ts`
- [ ] T027 [P] [US1] Unit tests for recent-locations logic (insert at top, de-duplicate by id, cap at 5, remove one, clear all) in `frontend/tests/unit/recentLocations.test.ts`
- [ ] T028 [P] [US1] Component tests for search → results flow (Enter and button submit, spinner and disabled submit while loading, every FR-005 fact rendered, "Not available" for null facts, new search replaces results, only latest of two rapid searches shown) in `frontend/tests/component/WeatherLookup.test.tsx`
- [ ] T029 [P] [US1] Component tests for recent locations (list renders ≤ 5, selecting an entry loads its weather, auto-load of the most recent entry on mount, remove and clear actions) in `frontend/tests/component/RecentLocations.test.tsx`
- [ ] T030 [P] [US1] Component test for `ConditionBackground` setting `data-condition` and `data-daynight` from a report in `frontend/tests/component/ConditionBackground.test.tsx`
- [ ] T031 [P] [US1] Playwright E2E for US1 acceptance scenarios 1–6 with `/api/*` upstream responses served from fixtures in `frontend/tests/e2e/us1-lookup.spec.ts`

### Implementation for User Story 1

- [ ] T032 [US1] Implement weather cache in `backend/src/services/cache.ts` per `data-model.md` WeatherCacheEntry.key and WeatherCacheEntry.expiresAt (500-entry cap, oldest-first eviction, shared in-flight promises)
- [ ] T033 [US1] Implement forward geocoding in `backend/src/services/geocoding.ts`: trim input, call Open-Meteo geocoding (`count=5`, `language=en`), split "city, region" on the first comma and rank candidates whose admin1/country starts with the remainder (accent- and case-insensitive, research §2), and map results to `Location` populating `data-model.md` Location.id, Location.name, Location.region, Location.country, Location.latitude, Location.longitude (rounded to 2 decimals) and Location.timezone
- [ ] T034 [US1] Implement forecast normalization in `backend/src/services/forecast.ts`: request the `current` and `daily` variables listed in research §1 with `timezone=auto`, `forecast_days=1`, map to `WeatherReport` (`data-model.md` WeatherReport.observedAt, WeatherReport.fetchedAt, WeatherReport.isDay, WeatherReport.condition, WeatherReport.windDirectionDeg, WeatherReport.sunrise, WeatherReport.sunset, WeatherReport.visibilityM and all other measurement fields), converting non-finite or missing values to `null`, and wrap with the cache from T032
- [ ] T035 [US1] Implement `GET /api/locations/search` (query schema `q` 1–100 chars) in `backend/src/routes/locations.ts` and register it in `backend/src/app.ts`
- [ ] T036 [US1] Implement `GET /api/weather` (query schema `lat`, `lon`, optional `name` ≤ 100 chars) in `backend/src/routes/weather.ts` and register it in `backend/src/app.ts`
- [ ] T037 [P] [US1] Implement API calls `searchLocations(q, signal)` and `getWeather(location, signal)` in `frontend/src/api/weather.ts`
- [ ] T038 [P] [US1] Implement recent-locations logic and `useRecentLocations` hook persisting to `wx.recent` in `frontend/src/hooks/useRecentLocations.ts` per `data-model.md` RecentLocations
- [ ] T039 [US1] Implement `useWeatherLookup` hook (states idle/loading/success/error, one `AbortController` so only the latest search wins, adds the displayed Location to recents on success) in `frontend/src/hooks/useWeatherLookup.ts`
- [ ] T040 [P] [US1] Implement `SearchBar` (labeled input, submit button, Enter submits, disabled while loading) in `frontend/src/components/SearchBar.tsx` with `SearchBar.module.css`
- [ ] T041 [P] [US1] Implement `Spinner` with accessible status text in `frontend/src/components/Spinner.tsx`
- [ ] T042 [P] [US1] Implement `FactTile` (label, formatted value, "Not available" for null) in `frontend/src/components/FactTile.tsx` with `FactTile.module.css`
- [ ] T043 [US1] Implement `WeatherCard` showing location heading (name, region, country), condition icon and description, all FR-005 facts via `FactTile`, and "Last updated" in location-local time in `frontend/src/components/WeatherCard.tsx` with `WeatherCard.module.css` (responsive grid from 320 px)
- [ ] T044 [P] [US1] Implement `ConditionBackground` with CSS gradients for each category × day/night plus `neutral`, keeping card text AA-contrast over all variants, in `frontend/src/components/ConditionBackground.tsx` with `ConditionBackground.module.css` (FR-012a)
- [ ] T045 [P] [US1] Implement `RecentLocations` list (select, remove one, clear all; keyboard accessible) in `frontend/src/components/RecentLocations.tsx` with `RecentLocations.module.css`
- [ ] T046 [US1] Wire US1 into `frontend/src/App.tsx`: SearchBar → search → if one or more candidates use the first → weather; render Spinner, WeatherCard inside ConditionBackground, RecentLocations; auto-load the most recent location on mount; default units from `frontend/src/lib/locale.ts`

**Checkpoint**: US1 tests pass; MVP is demoable

---

## Phase 4: User Story 2 - Clear feedback for invalid, ambiguous, or failed lookups (Priority: P2)

**Goal**: Empty, overlong, unmatched, ambiguous, and failed lookups each produce a specific,
actionable message or pick-list — never a blank screen.

**Independent Test**: Submit empty input, "zzzzqqq", and "Springfield"; confirm prompt,
not-found message, and ≤ 5-item pick-list; simulate provider failure and confirm the
"temporarily unavailable" message with a working Retry.

### Tests for User Story 2 (write first, must fail) ⚠️

- [ ] T047 [P] [US2] Add fixtures for "Springfield" (multiple results), "zzzzqqq" (no `results`), and an upstream timeout in `backend/tests/fixtures/open-meteo/`
- [ ] T048 [P] [US2] Contract tests for error responses: search `q` missing/whitespace/over 100 chars → 400 `VALIDATION_ERROR`; no match → 404 `NOT_FOUND`; upstream failure or timeout → 503 `UPSTREAM_UNAVAILABLE`; weather out-of-range `lat`/`lon` → 400; all bodies match `Error` schema, in `backend/tests/contract/errors.test.ts`
- [ ] T049 [P] [US2] Component tests for empty-input prompt (no request sent), over-100-character rejection before lookup, not-found message with suggestion, ambiguous pick-list (≤ 5, shows name/region/country, selection loads weather), unavailable message with Retry that re-runs the last request, and failed auto-load of a recent location falling back to the empty search state, in `frontend/tests/component/LookupFeedback.test.tsx`
- [ ] T050 [P] [US2] Playwright E2E for US2 acceptance scenarios 1–4 and input-normalization edge case ("  são paulo ") in `frontend/tests/e2e/us2-feedback.spec.ts`

### Implementation for User Story 2

- [ ] T051 [US2] Return 404 `NOT_FOUND` with user-safe message when geocoding yields no results, and trim/reject whitespace-only `q` with 400, in `backend/src/routes/locations.ts`
- [ ] T052 [US2] Ensure geocoding and forecast services throw `UpstreamUnavailableError` on non-2xx, invalid JSON, or timeout in `backend/src/services/geocoding.ts` and `backend/src/services/forecast.ts`
- [ ] T053 [P] [US2] Implement `StatusMessage` (variants: prompt, not-found, unavailable with Retry button, permission-denied; consistent tone; `role="alert"` for errors) in `frontend/src/components/StatusMessage.tsx` with `StatusMessage.module.css`
- [ ] T054 [P] [US2] Implement `CandidateList` (pick-list of `data-model.md` LocationCandidate items showing Location.name, Location.region, Location.country; keyboard selectable) in `frontend/src/components/CandidateList.tsx` with `CandidateList.module.css`
- [ ] T055 [US2] Extend `useWeatherLookup` with client-side validation (empty, > 100 chars), states `candidates` and `error` (mapped from `ApiError.code`), and `retry()` replaying the last request in `frontend/src/hooks/useWeatherLookup.ts`
- [ ] T056 [US2] Wire `StatusMessage` and `CandidateList` into `frontend/src/App.tsx`: show the pick-list when more than one candidate is returned (replacing US1's first-candidate behavior), errors in place of results

**Checkpoint**: US1 and US2 tests pass independently

---

## Phase 5: User Story 3 - Choose preferred units (Priority: P3)

**Goal**: Toggle imperial/metric instantly; the choice persists on the device; first-visit
default follows the browser region.

**Independent Test**: Toggle to metric, confirm all values convert without a new request,
reload, confirm metric persists; with a fresh profile in `en-GB`, confirm metric default.

### Tests for User Story 3 (write first, must fail) ⚠️

- [ ] T057 [P] [US3] Unit tests for `useUnits` (saved `wx.units` wins over region default, toggle persists, invalid stored value ignored) in `frontend/tests/unit/useUnits.test.ts`
- [ ] T058 [P] [US3] Component test: toggling converts temperature, feels-like, high/low, wind, pressure, and visibility with no new network request, in `frontend/tests/component/UnitToggle.test.tsx`
- [ ] T059 [P] [US3] Playwright E2E for US3 acceptance scenarios 1–3 (including `locale: 'en-GB'` context) in `frontend/tests/e2e/us3-units.spec.ts`

### Implementation for User Story 3

- [ ] T060 [US3] Implement `useUnits` hook reading/writing `wx.units` and falling back to `frontend/src/lib/locale.ts` in `frontend/src/hooks/useUnits.ts` per `data-model.md` UnitPreference
- [ ] T061 [P] [US3] Implement `UnitToggle` (accessible two-option switch, `aria-pressed`, labels "°F" / "°C") in `frontend/src/components/UnitToggle.tsx` with `UnitToggle.module.css`
- [ ] T062 [US3] Wire `useUnits` and `UnitToggle` into `frontend/src/App.tsx` and pass the unit system to `WeatherCard` in `frontend/src/components/WeatherCard.tsx`

**Checkpoint**: US1–US3 tests pass independently

---

## Phase 6: User Story 4 - Use my current location (Priority: P4)

**Goal**: One click (with permission) shows weather for the user's approximate location;
denial or failure is explained.

**Independent Test**: Click "Use my location", grant permission, confirm weather for a nearby
place; deny permission and confirm the explanatory message.

### Tests for User Story 4 (write first, must fail) ⚠️

- [ ] T063 [P] [US4] Add Nominatim reverse-geocoding fixtures (success and failure) in `backend/tests/fixtures/nominatim/`
- [ ] T064 [P] [US4] Contract test for `GET /api/locations/reverse`: 200 with rounded coordinates; Nominatim failure → 200 with name "Current location" and null region/country; out-of-range → 400; outgoing request uses rounded coordinates and a `User-Agent` header; two identical requests both reach Nominatim (no server-side retention, FR-014), in `backend/tests/contract/locations-reverse.test.ts`
- [ ] T065 [P] [US4] Component tests for `LocateButton` (granted → weather shown and recent entry saved without raw coordinates; denied/unavailable → permission message inviting typed search) with mocked `navigator.geolocation` in `frontend/tests/component/LocateButton.test.tsx`
- [ ] T066 [P] [US4] Playwright E2E for US4 acceptance scenarios 1–2 using context geolocation and permissions in `frontend/tests/e2e/us4-geolocation.spec.ts`

### Implementation for User Story 4

- [ ] T067 [US4] Implement reverse geocoding via Nominatim (`format=jsonv2`, `zoom=10`, identifying `User-Agent`, coordinates rounded to 2 decimals before sending, no server-side caching or retention of coordinates or results (FR-014), fallback Location named "Current location" per `data-model.md` Location.name, Location.region, Location.country, Location.timezone from the forecast response) in `backend/src/services/geocoding.ts`
- [ ] T068 [US4] Implement `GET /api/locations/reverse` (query schema `lat`, `lon`) in `backend/src/routes/locations.ts`
- [ ] T069 [P] [US4] Implement `reverseGeocode(lat, lon, signal)` in `frontend/src/api/weather.ts`
- [ ] T070 [P] [US4] Implement `useGeolocation` hook (low-accuracy request, 10 s timeout, maps denied/unavailable/timeout to a permission error, discards raw coordinates after reverse lookup) in `frontend/src/hooks/useGeolocation.ts`
- [ ] T071 [P] [US4] Implement `LocateButton` (labeled button, hidden when the Geolocation API is unsupported) in `frontend/src/components/LocateButton.tsx` with `LocateButton.module.css`
- [ ] T072 [US4] Wire `LocateButton` into `frontend/src/App.tsx` so a resolved location flows through `useWeatherLookup` and recents, and permission errors use `StatusMessage`

**Checkpoint**: All four user stories pass independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Constitution gates and success-criteria verification across stories

- [ ] T073 [P] Playwright accessibility suite: axe scan with zero critical/serious violations at 320/768/1440 px in light and dark color schemes and across every condition background, plus keyboard-only search flow, in `frontend/tests/e2e/a11y-responsive.spec.ts` (FR-013, SC-005)
- [ ] T074 [P] Backend logging privacy test asserting log lines include `reqId`, route, status, duration and never contain query strings, search text, or coordinates, in `backend/tests/unit/logging.test.ts` (FR-014, Principle VI/VII)
- [ ] T075 [P] Performance check: Playwright test asserting results render within 3 s of submit with fixture-backed API, and cache-hit API response under 20 ms via `fastify.inject`, in `frontend/tests/e2e/performance.spec.ts` and `backend/tests/unit/cache-perf.test.ts` (SC-002)
- [ ] T076 [P] Update `README.md` with project overview, prerequisites, `npm install`, `npm run dev`, test/lint commands, data-provider attribution (Open-Meteo, OpenStreetMap Nominatim), and a link to `specs/001-location-weather-lookup/quickstart.md`
- [ ] T077 Visual polish pass for a consistent modern look (spacing, typography, transitions respecting `prefers-reduced-motion`, focus styles) using only tokens in `frontend/src/styles/tokens.css` and component CSS modules
- [ ] T078 Run `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run audit`; fix all failures and high/critical vulnerabilities
- [ ] T079 Execute every step in `specs/001-location-weather-lookup/quickstart.md` (API smoke checks, 90 s cache check, manual UI table, observability check) and record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–6)**: Depend on Foundational
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories.
- **US2 (P2)**: After Foundational. Builds on US1's search route, lookup hook, and `App.tsx`
  (T035, T039, T046), but its tests target only feedback behavior.
- **US3 (P3)**: After Foundational. Needs `WeatherCard` (T043) to display converted values.
- **US4 (P4)**: After Foundational. Uses `useWeatherLookup` (T039) and `StatusMessage` (T053)
  for the permission message.

Recommended order: US1 → US2 → US3 → US4 (US3 and US4 may run in parallel after US2).

### Within Each User Story

- Tests written and failing before implementation (Principle II)
- Backend services → routes; frontend api/hooks → components → `App.tsx` wiring
- Story checkpoint passes before moving on

### Parallel Opportunities

- Setup: T003, T004, T005
- Foundational tests: T006–T010; implementation: T014–T020
- US1 tests: T023–T031; implementation: T037, T038, T040–T042, T044, T045
- US2: T047–T050, then T053, T054
- US3: T057–T059, then T061
- US4: T063–T066, then T069–T071
- Polish: T073–T076

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests together (they must fail first):
Task: "Contract test for GET /api/locations/search in backend/tests/contract/locations-search.test.ts"
Task: "Contract test for GET /api/weather in backend/tests/contract/weather.test.ts"
Task: "Unit tests for weather cache in backend/tests/unit/cache.test.ts"
Task: "Unit tests for recent-locations logic in frontend/tests/unit/recentLocations.test.ts"
Task: "Component tests for search → results flow in frontend/tests/component/WeatherLookup.test.tsx"

# Then build independent UI pieces together:
Task: "Implement SearchBar in frontend/src/components/SearchBar.tsx"
Task: "Implement FactTile in frontend/src/components/FactTile.tsx"
Task: "Implement ConditionBackground in frontend/src/components/ConditionBackground.tsx"
Task: "Implement RecentLocations in frontend/src/components/RecentLocations.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US1
4. **STOP and VALIDATE** with the US1 independent test, then demo

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate → demo (MVP)
3. US2 → validate → demo (robust error handling)
4. US3 → validate → demo (units)
5. US4 → validate → demo (geolocation)
6. Polish → all constitution gates and success criteria verified

---

## Notes

- [P] tasks touch different files and have no incomplete dependencies
- Verify each test fails before implementing (Red → Green → Refactor)
- Commit after each task or logical group using Conventional Commits
- `contracts/openapi.yaml` and `data-model.md` are canonical; update them first if behavior changes

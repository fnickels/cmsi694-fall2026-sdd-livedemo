# Quickstart & Validation: Location Weather Lookup

Validates the feature end to end. Contracts: [contracts/openapi.yaml](./contracts/openapi.yaml),
[contracts/client-storage.md](./contracts/client-storage.md). Entities: [data-model.md](./data-model.md).

## Prerequisites

- Node.js 24 LTS and npm 10+
- Internet access to `geocoding-api.open-meteo.com`, `api.open-meteo.com`, and
  `nominatim.openstreetmap.org` (only for manual runs; automated tests use fixtures)
- No API keys or secrets are required

## Setup & run

```bash
npm install                 # installs both workspaces
npm run dev                 # API on http://localhost:3000, UI on http://localhost:5173
```

## Automated checks (must all pass before merge)

```bash
npm run lint                # ESLint + Prettier check
npm test                    # Vitest: backend contract/unit + frontend unit/component
npx playwright install      # first time only
npm run test:e2e            # Playwright: user stories, axe a11y, 320/768/1440 px
```

## API smoke checks

```bash
curl -s localhost:3000/api/health                               # {"status":"ok"}
curl -s 'localhost:3000/api/locations/search?q=Los%20Angeles'   # 1+ results
curl -s 'localhost:3000/api/locations/search?q=Springfield'     # several results (≤5)
curl -s 'localhost:3000/api/locations/search?q=zzzzqqq'         # 404 NOT_FOUND
curl -s 'localhost:3000/api/locations/search?q=%20'             # 400 VALIDATION_ERROR
curl -s 'localhost:3000/api/weather?lat=34.05&lon=-118.24'      # WeatherReport, all fields
curl -si 'localhost:3000/api/weather?lat=34.05&lon=-118.24' | grep -i x-request-id
```

Repeat the weather call within 90 s: `fetchedAt` is unchanged. After 90 s: new `fetchedAt`.

## Manual UI validation (maps to spec user stories)

| #   | Steps                                                               | Expected                                                                                    |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US1 | Search "Los Angeles", then "90045"                                  | Resolved name + all FR-005 facts; second search replaces first; spinner shown while loading |
| US1 | Reload the page                                                     | Most recent location loads automatically; recent list shows up to 5                         |
| US1 | Search 6 distinct cities, then re-search the 2nd                    | List keeps 5, oldest dropped; re-searched city moves to top, no duplicate                   |
| US2 | Submit empty; search "zzzzqqq"; search "Springfield"                | Prompt; "not found" with suggestion; pick-list of ≤5, selecting one shows weather          |
| US2 | Stop the API (or block `api.open-meteo.com`) and search           | "Temporarily unavailable" message with Retry                                                |
| US3 | Toggle units, reload                                                | Values convert instantly (°F/°C, mph/km·h, inHg/hPa, mi/km); choice persists             |
| US3 | Fresh profile with browser language `en-GB`                       | Metric by default                                                                           |
| US4 | Click "Use my location", allow                                      | Weather for nearby place; deny ⇒ explanatory message                                       |
| UX  | Toggle OS dark mode; search a rainy and a clear city, day and night | Theme switches; background matches condition/day-night; text stays readable                 |
| UX  | Resize to 320 px, navigate with keyboard only                       | No overflow; every control reachable and labeled                                            |

## Observability check

API console output is JSON lines with `time`, `level`, `reqId`, route, status, and duration.
Confirm no query strings or coordinates appear in logs.

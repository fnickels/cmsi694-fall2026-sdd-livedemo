# Research: Location Weather Lookup

All Technical Context unknowns are resolved below. Stack choices (TypeScript/React/Fastify,
Open-Meteo) were confirmed by the project owner on 2026-11-17.

## 1. Weather data provider

- **Decision**: Open-Meteo Forecast API (`https://api.open-meteo.com/v1/forecast`).
- **Rationale**: Free for non-commercial use, no API key (nothing secret to manage —
  Principle VI), and supplies every FR-005 fact in one call:
  - `current`: `temperature_2m, apparent_temperature, relative_humidity_2m, is_day,
    weather_code, wind_speed_10m, wind_direction_10m, pressure_msl, visibility,
    precipitation_probability, uv_index` (any hourly variable may be requested as current;
    current values are 15-minute model data).
  - `daily` (`forecast_days=1`): `temperature_2m_max, temperature_2m_min, sunrise, sunset`.
  - `timezone=auto` returns local times and the IANA zone; `current.time` is the
    observation (last-updated) time.
  - Request in metric (default °C, km/h, hPa, m) and convert in the client.
- **Alternatives considered**: OpenWeatherMap and WeatherAPI.com — both require API keys and
  secret management; rejected for simplicity.

## 2. Forward geocoding (search by name or postal code)

- **Decision**: Open-Meteo Geocoding API
  (`https://geocoding-api.open-meteo.com/v1/search?name=…&count=5&language=en`).
- **Rationale**: Same provider, no key. Verified on 2026-11-17: `Springfield` returns several
  candidates with `name, admin1, country, latitude, longitude, timezone`; postal code
  `90045` resolves to Los Angeles via its `postcodes` index. Returns ≤ 5 results, matching
  FR-004. No `results` key ⇒ not found.
- **Handling "city, region"**: The API matches on name only. The API splits input on the
  first comma, searches the first part, and ranks/filters candidates whose `admin1` or
  `country` starts with the remainder (case/accent-insensitive).
- **Alternatives considered**: Nominatim forward search — stricter rate limits (1 req/s) and
  noisier results for city lookups.

## 3. Reverse geocoding ("use my location")

- **Decision**: OpenStreetMap Nominatim `/reverse?format=jsonv2&zoom=10&lat=…&lon=…`, called
  only by the API with an identifying `User-Agent` and coordinates rounded to 2 decimals.
  Results are **not cached**: coordinates and resolved places are discarded after the
  response, as FR-014 permits server-side retention only within the 90 s weather window.
- **Rationale**: Open-Meteo has no reverse geocoding. Nominatim is free and keyless; usage
  (rare, user-initiated) is well within its 1 req/s policy without caching. If it fails, the API
  still returns a Location labeled "Current location" so weather can be shown (FR-011 style
  graceful degradation).
- **Alternatives considered**: BigDataCloud client-side endpoint (would send coordinates from
  the browser to a third party, bypassing our API — violates constitution data-flow rule);
  showing only coordinates (poor UX).

## 4. Backend framework

- **Decision**: Fastify 5 on Node 24 with TypeScript; native `fetch` with
  `AbortSignal.timeout(5000)` for upstream calls.
- **Rationale**: Built-in JSON-schema request/response validation (Principle VI), built-in
  pino JSON logging and `genReqId` for correlation IDs (Principle VII), `inject()` for fast
  contract tests without a network (Principle II). No HTTP client dependency needed.
- **Alternatives considered**: Express (needs extra validation/logging libraries);
  serverless functions (more deployment complexity for a demo).

## 5. Caching (FR-015)

- **Decision**: In-process `Map` keyed by `lat,lon` rounded to 2 decimals, storing the
  normalized WeatherReport and `fetchedAt`; entries expire after 90 s; max 500 entries with
  oldest-first eviction. Concurrent requests for the same key share one in-flight promise.
- **Rationale**: Meets the 90 s rule with zero infrastructure; single-instance demo.
- **Alternatives considered**: Redis (unnecessary infrastructure — Principle III); HTTP
  caching only in browser (would not reduce upstream calls across users).

## 6. Frontend framework and styling

- **Decision**: React 19 + Vite 7, plain hooks for state, CSS Modules with a single
  `tokens.css` of design tokens (color, spacing, radius, type scale) and `themes.css` for
  light/dark via `prefers-color-scheme`.
- **Rationale**: Confirmed stack; hooks are sufficient for one screen (no state library);
  shared tokens enforce UX consistency (Principle V).
- **Alternatives considered**: Tailwind or a component kit — extra dependency and learning
  curve without clear benefit at this size.

## 7. Condition backgrounds and day/night (FR-012a)

- **Decision**: Map WMO `weather_code` to categories: clear (0–1), cloudy (2–3), fog
  (45, 48), rain (51–67, 80–82), snow (71–77, 85–86), storm (95–99); anything else →
  `neutral`. Use `current.is_day` for day/night. Backgrounds are CSS gradients (no image
  assets) chosen by `data-condition` and `data-daynight` attributes; text sits on a
  translucent card surface so contrast meets AA over every gradient.
- **Rationale**: Lightweight, themeable, testable via attributes and axe.

## 8. Default units (FR-009)

- **Decision**: `new Intl.Locale(navigator.language).maximize().region === 'US'` ⇒ imperial,
  any other known region ⇒ metric, missing/invalid ⇒ imperial. A saved preference wins.
- **Imperial conversions**: °F, mph, inHg (hPa × 0.02953), miles (m ÷ 1609.344).
  Metric display: °C, km/h, hPa, km (m ÷ 1000).

## 9. Latest-search-wins and loading (FR-006)

- **Decision**: The lookup hook keeps one `AbortController`; each new search aborts the
  previous request, and the submit button is disabled while loading.

## 10. Logging and privacy (FR-014, Principle VI/VII)

- **Decision**: Custom pino request serializer logs method, route pattern (e.g.
  `/api/weather`), status, duration, and request ID — never the query string. Upstream
  errors are logged with provider name, status code, and duration only.

## 11. Testing strategy

- **Decision**: Vitest everywhere; backend contract tests stub `fetch` with recorded
  Open-Meteo/Nominatim fixtures; frontend component tests mock `api/client`; Playwright
  E2E runs against the real frontend + backend with upstream calls intercepted by fixtures
  (deterministic, no network) and runs axe at 320/768/1440 px.
- **Note**: During research the Open-Meteo forecast host timed out from the planning
  machine while geocoding succeeded — reinforcing the need for the 5 s timeout and the
  "temporarily unavailable" path (FR-007), and for fixture-based tests.

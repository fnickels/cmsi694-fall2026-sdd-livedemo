# Data Model: Location Weather Lookup

All server data is transient (no database). Units on the wire are always metric; the
frontend converts for display. Field names below are the canonical JSON names used in
[contracts/openapi.yaml](./contracts/openapi.yaml).

## Location

A resolved place. Returned by search/reverse endpoints; stored in Recent Locations.

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Stable key: provider ID if available, otherwise `"lat,lon"` rounded to 2 decimals. Used for de-duplication. |
| `name` | string | 1–100 chars. `"Current location"` when reverse geocoding fails. |
| `region` | string \| null | State/province (`admin1`); null if unknown. |
| `country` | string \| null | Country name; null if unknown. |
| `latitude` | number | −90…90, rounded to 2 decimals. |
| `longitude` | number | −180…180, rounded to 2 decimals. |
| `timezone` | string | IANA zone, e.g. `America/Los_Angeles`. |

## LocationCandidate

Same shape as Location. A search returns 0–5 candidates (FR-004). Exactly one ⇒ frontend
shows weather immediately; more than one ⇒ frontend shows a pick-list; zero ⇒ `NOT_FOUND`.

## WeatherReport

| Field | Type | Unit | Notes |
|-------|------|------|-------|
| `location` | Location | — | Echoed for display. |
| `observedAt` | string | ISO 8601 with offset, location-local | "Last updated" (FR-005). |
| `fetchedAt` | string | ISO 8601 UTC | When the API got it from upstream; used for 90 s reuse. |
| `isDay` | boolean | — | Drives day/night background. |
| `condition.code` | integer | WMO | Raw code. |
| `condition.description` | string | — | e.g. "Light rain". |
| `condition.icon` | string | — | Icon key, e.g. `rain-day`. |
| `condition.category` | enum | — | `clear` \| `cloudy` \| `fog` \| `rain` \| `snow` \| `storm` \| `neutral`. |
| `temperatureC` | number \| null | °C | |
| `feelsLikeC` | number \| null | °C | |
| `humidityPct` | number \| null | % | 0–100 |
| `windSpeedKmh` | number \| null | km/h | ≥ 0 |
| `windDirectionDeg` | number \| null | degrees | 0–359; UI shows compass point (N, NE, …). |
| `highC` / `lowC` | number \| null | °C | Today's daily max/min. |
| `sunrise` / `sunset` | string \| null | ISO 8601 local | Null in polar day/night. |
| `uvIndex` | number \| null | index | ≥ 0 |
| `pressureHpa` | number \| null | hPa | Sea-level pressure. |
| `visibilityM` | number \| null | meters | ≥ 0 |
| `precipitationChancePct` | number \| null | % | 0–100 |

Validation: any upstream field that is missing or not a finite number becomes `null`; the UI
renders `null` as "Not available" (FR-011).

## UnitPreference (client only)

`"imperial" | "metric"`. Absent ⇒ derived from browser region (FR-009). See
[contracts/client-storage.md](./contracts/client-storage.md).

## RecentLocations (client only)

Ordered array of Location, newest first.

- Max length 5; no two entries share an `id`.
- **On successful weather display** for Location L: remove any entry with `L.id`, insert L
  at index 0, truncate to 5.
- **Remove entry**: delete by `id`. **Clear**: delete the whole key.
- **On app load**: if non-empty, auto-load weather for index 0 (FR-016). If that lookup
  fails, show the error and the normal empty search state; the entry is kept.
- Raw device coordinates are never stored — only the resolved Location (rounded).

## WeatherCacheEntry (server only, in memory)

| Field | Type | Rules |
|-------|------|-------|
| key | string | `"lat,lon"` rounded to 2 decimals |
| report | WeatherReport | normalized |
| expiresAt | number | `fetchedAt + 90 000 ms` |

Lifecycle: miss → fetch upstream → store → hits until `expiresAt` → next request after
expiry refetches (FR-015). Max 500 entries, oldest evicted first.

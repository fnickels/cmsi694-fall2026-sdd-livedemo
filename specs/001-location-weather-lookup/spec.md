# Feature Specification: Location Weather Lookup

**Feature Branch**: `001-location-weather-lookup`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Create a web based application with a modern aesthetic which allows a user to specify a location and then provides basic current weather related facts about the location."

## Clarifications

### Session 2026-11-17

- Q: Which weather facts should the results show? → A: Current conditions plus today's high/low, sunrise/sunset, UV index, air pressure, visibility, and chance of rain
- Q: On a first visit, how should the app choose between °F and °C? → A: Use the browser's region settings (imperial for US, metric elsewhere); imperial if unknown
- Q: How old can the shown weather be before the app must fetch new data? → A: Reuse results for the same location for up to 90 seconds
- Q: Should the look of the app change based on the weather or time of day at the searched location? → A: Yes — background adapts to current condition and day/night at the location, plus light/dark mode following the device setting
- Q: Should the app remember a user's recent searches on their own device? → A: Remember the last 5 distinct locations on the device; show the most recent automatically on the next visit and list all 5 for one-tap re-selection (amended 2026-11-17 from "last location only")

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Look up current weather by location name (Priority: P1)

A visitor opens the web app, types a location (such as a city name, "city, region", or a
postal code) into a search field, and submits it. The app shows the resolved location name
and a summary of basic current weather facts for that place.

**Why this priority**: This is the core value of the product. Without it there is no app;
with only this story the app is already a usable MVP.

**Independent Test**: Enter "Los Angeles" and submit; confirm the app displays the resolved
location name and all required current weather facts.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user enters a valid city name and submits,
   **Then** the app displays the resolved location (city, region/state, country) and its
   full set of current weather facts defined in FR-005.
2. **Given** the app is open, **When** the user enters a valid postal code and submits,
   **Then** the app displays current weather for the matching location.
3. **Given** results for one location are shown, **When** the user searches for a different
   location, **Then** the previous results are replaced with the new location's weather.
4. **Given** the user previously viewed weather for one or more locations on this device,
   **When** they reopen the app, **Then** current weather for the most recently viewed
   location is displayed automatically and up to 5 recent locations are listed.
5. **Given** recent locations are listed, **When** the user selects one, **Then** current
   weather for that location is displayed without retyping it.
6. **Given** a search is in progress, **When** results have not yet arrived, **Then** the app
   shows a visible loading indicator and prevents duplicate submissions.

---

### User Story 2 - Clear feedback for invalid, ambiguous, or failed lookups (Priority: P2)

When a user's input cannot be matched, matches several places, or weather data is
temporarily unavailable, the app explains what happened and how to proceed instead of
showing a blank or broken screen.

**Why this priority**: Location input is free text and frequently ambiguous (e.g.,
"Springfield"). Without clear handling, a large share of searches would fail confusingly.

**Independent Test**: Search for "zzzzqqq" (no match) and "Springfield" (multiple matches)
and confirm the app shows an actionable message and a pick-list respectively.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user submits an empty search, **Then** the app
   prompts the user to enter a location and performs no lookup.
2. **Given** the app is open, **When** the user submits a location that matches nothing,
   **Then** the app shows a "location not found" message with a suggestion to check the
   spelling or try a nearby city.
3. **Given** the app is open, **When** the user submits a name matching multiple places,
   **Then** the app lists up to 5 candidates (name, region, country) and shows weather for
   the one the user selects.
4. **Given** weather data cannot be retrieved, **When** the user searches, **Then** the app
   shows a friendly "weather data temporarily unavailable, please try again" message with a
   retry action.

---

### User Story 3 - Choose preferred units (Priority: P3)

A user switches between imperial (°F, mph, inHg, miles) and metric (°C, km/h, hPa, km) units, and the app
remembers the choice on the same device for future visits.

**Why this priority**: Improves usability for an international audience but the core
lookup works without it.

**Independent Test**: Toggle to metric, confirm displayed values convert, reload the page,
and confirm metric is still selected.

**Acceptance Scenarios**:

1. **Given** weather results are displayed in imperial units, **When** the user toggles to
   metric, **Then** all temperature, wind, pressure, and visibility values are shown in
   metric units without a new search.
2. **Given** the user selected metric previously, **When** they return to the app on the same
   device and browser, **Then** metric units are preselected.
3. **Given** a first-time visitor whose browser region is outside the United States, **When**
   they view results, **Then** metric units are shown by default.

---

### User Story 4 - Use my current location (Priority: P4)

A user clicks a "use my location" action, grants permission, and immediately sees current
weather for where they are without typing.

**Why this priority**: A convenience shortcut; the typed search already covers the need.

**Independent Test**: Click "use my location", allow permission, and confirm weather for the
device's approximate location is displayed.

**Acceptance Scenarios**:

1. **Given** the user clicks "use my location", **When** they grant permission, **Then** the
   app displays current weather for their approximate location.
2. **Given** the user clicks "use my location", **When** they deny permission or the location
   is unavailable, **Then** the app explains that location access was not available and
   invites them to type a location instead.

---

### Edge Cases

- Input with leading/trailing spaces, mixed case, or accented characters (e.g., "  são paulo ")
  is normalized and resolves correctly.
- Extremely long input (over 100 characters) is rejected with a message before any lookup.
- Input containing only symbols or digits that are not a valid postal code returns
  "location not found".
- The user submits several searches rapidly; only the most recent search's results are shown.
- The weather data is stale (last updated more than 3 hours ago); the "last updated" time
  makes this visible to the user.
- The network connection drops mid-search; the user sees the "temporarily unavailable"
  message with a retry action.
- Two searches for the same location within 90 seconds show the same data; a search after
  90 seconds shows freshly retrieved data.
- Weather conditions that do not map to a defined condition category use a neutral default
  background.
- Viewing a location already in the recent list moves it to the top instead of adding a
  duplicate; viewing a 6th distinct location removes the oldest one.
- If a recent location can no longer be resolved or its weather is unavailable on
  return, the app shows the normal error message and the empty search state.
- Locations in remote areas or oceans may have partial data; any missing fact is shown
  as "Not available" rather than blank or zero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to enter a location as free text (city name, "city, region",
  "city, country", or postal code) and submit it via button or the Enter key.
- **FR-002**: System MUST validate input before lookup: reject empty input and input longer
  than 100 characters with an explanatory message.
- **FR-003**: System MUST resolve the input to a specific place and display its name, region
  (when applicable), and country alongside the results.
- **FR-004**: When input matches multiple places, System MUST present up to 5 candidates and
  let the user choose one.
- **FR-005**: System MUST display the following weather facts for the resolved location:
  current temperature, "feels like" temperature, condition description with matching icon,
  humidity (%), wind speed and direction, today's high and low temperatures, sunrise and
  sunset times, UV index, air pressure, visibility, chance of rain (%), and the
  observation's last-updated time. All times MUST be shown in the location's local time.
- **FR-006**: System MUST show a loading indicator while a lookup is in progress and MUST
  display results only for the most recent search.
- **FR-007**: System MUST show distinct, actionable messages for: no match found, weather
  data unavailable, and location permission denied; the unavailable message MUST offer a
  retry action.
- **FR-008**: Users MUST be able to switch between imperial and metric units; the choice
  MUST apply immediately and persist on the same device and browser.
- **FR-009**: For first-time visitors (no saved preference), default units MUST follow the
  browser's region setting: imperial (°F, mph, inHg, miles) for the United States, metric
  for all other regions, and imperial when the region cannot be determined. A saved
  preference always overrides this default.
- **FR-010**: Users MUST be able to request weather for their current location, subject to
  their explicit permission.
- **FR-011**: Any individual weather fact that is unavailable MUST be shown as "Not available".
- **FR-012**: The interface MUST present a modern, clean visual design: a single focused
  search area, a prominent results card, consistent typography and spacing, and a layout
  that adapts to phone, tablet, and desktop screen widths (320px and wider).
- **FR-012a**: The results background MUST visually reflect the current condition category
  (at minimum: clear, cloudy, rain, snow, storm, fog) and whether it is currently day or
  night at the searched location (based on its local sunrise/sunset).
- **FR-012b**: The interface MUST offer light and dark appearances that follow the device's
  light/dark setting; text in both appearances and over every background MUST meet the
  contrast requirement in FR-013.
- **FR-013**: The interface MUST be fully usable by keyboard, label every input, and meet
  WCAG 2.1 AA color-contrast requirements.
- **FR-014**: System MUST NOT require an account or sign-in. Searched locations MUST NOT be
  retained beyond the user's own device (FR-016) and the short-term weather reuse window
  (FR-015), and MUST NOT be linked to any user identity. Raw device coordinates MUST be
  discarded once the place has been resolved.
- **FR-015**: System MAY reuse previously retrieved weather for the same location for at
  most 90 seconds; any request after that window MUST retrieve fresh data.
- **FR-016**: System MUST remember up to the 5 most recently displayed distinct locations on
  the user's device only, ordered newest first. Re-viewing a listed location MUST move it to
  the top without duplication; adding a 6th MUST drop the oldest. On the next visit, System
  MUST automatically display current weather for the most recent location and show the list
  for one-step re-selection. When a lookup used "use my location", the resolved place (not
  raw device coordinates) is remembered. Users MUST be able to remove individual entries and
  clear the whole list.

### Key Entities

- **Location**: A resolved place the user asked about. Attributes: display name, region/state
  (optional), country, geographic coordinates, local time zone.
- **Location Candidate**: One of several possible matches for ambiguous input. Attributes:
  display name, region, country; becomes a Location when selected.
- **Current Weather Report**: The latest weather observation for a Location. Attributes:
  temperature, feels-like temperature, condition description, condition icon, humidity,
  wind speed, wind direction, today's high/low, sunrise time, sunset time, UV index, air
  pressure, visibility, chance of rain, observation time.
- **Unit Preference**: The user's selected measurement system (imperial or metric), stored
  only on the user's device.
- **Recent Locations**: An ordered list (newest first, maximum 5, no duplicates) of
  recently displayed Locations (name, region, country, coordinates of the resolved place),
  stored only on the user's device and removable by the user individually or all at once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can go from opening the app to seeing current weather for a
  typed location in under 15 seconds.
- **SC-002**: 95% of lookups for valid locations display results within 3 seconds of
  submission under normal network conditions.
- **SC-003**: 100% of the defined failure cases (empty input, no match, ambiguous match,
  data unavailable, permission denied) show a specific, actionable message — never a blank
  screen or raw error.
- **SC-004**: At least 90% of test users successfully find the weather for a named city on
  their first attempt without assistance.
- **SC-005**: The app is fully usable and visually intact at 320px, 768px, and 1440px screen
  widths, and passes an automated WCAG 2.1 AA accessibility check with zero critical issues.
- **SC-006**: At least 80% of test users rate the visual design as "modern" or "very modern"
  on a 5-point scale.

## Assumptions

- The app is a public, anonymous web app; no user accounts are needed.
- "Basic current weather facts" means the facts listed in FR-005; multi-day or hourly forecasts, historical data,
  maps, radar, and severe-weather alerts are out of scope for this feature.
- Only one location's weather is shown at a time; at most 5 recent locations are remembered.
  Pinned/favorite locations, syncing across devices, and multi-location
  comparison are out of scope.
- Weather and location-matching data come from an external weather data provider; the app
  depends on that provider's availability and coverage.
- The interface is in English only for this version.
- Users access the app through a current version of a mainstream web browser with an
  internet connection.
- Default units are inferred from the browser's region setting; users can switch at any time.

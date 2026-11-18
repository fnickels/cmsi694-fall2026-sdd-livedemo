# Client Storage Contract (browser `localStorage`)

Only these keys are written. Values are JSON. Invalid or unparsable values are discarded and
treated as absent (never crash the app).

| Key | Type | Written when | Rules |
|-----|------|--------------|-------|
| `wx.units` | `"imperial"` \| `"metric"` | User toggles units | Absent ⇒ derive from browser region (US ⇒ imperial, other ⇒ metric, unknown ⇒ imperial). |
| `wx.recent` | `Location[]` (see [data-model.md](../data-model.md)) | Weather shown successfully; entry removed; list cleared | Newest first, ≤ 5, unique by `id`; coordinates already rounded to 2 decimals. Cleared ⇒ key removed. |

Nothing else (search text, raw device coordinates, weather data) is stored on the device.

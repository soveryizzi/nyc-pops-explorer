# NYC POPS Explorer — Build Brief

Build a production-quality map explorer for NYC's Privately Owned Public Spaces (POPS). This brief is self-contained: everything you need about the dataset, its quirks, the feature set, design direction, and build order is below. Do not invent alternative architectures — follow the phases.

---

## Stack

- **React + Vite + TypeScript**
- **MapLibre GL JS** via `react-map-gl` (maplibre variant)
- **Basemap:** OpenFreeMap vector tiles (free, no token) with a **custom style JSON** recolored to the app palette — never CSS-filter raster tiles
- **Supabase:** auth, Postgres, storage (Phase 5+ only)
- **Hosting:** Vercel, auto-deploy from GitHub
- **Analytics:** Vercel Analytics (or Plausible)
- **Data:** NYC Open Data POPS dataset — `https://data.cityofnewyork.us/resource/rvih-nhyn.json` (~600 records, Socrata API, supports `$limit` and `$order`)
- **Design tokens:** the Figma file **"NYC POPS — Design System"** is the single source of truth. Two variable collections (Primitives, Semantic) plus text styles (Type/*) and effect styles (Elevation/*). Every variable carries WEB code syntax (e.g. `green/700` → `var(--green-700)`). Generate `tokens.css` from these variables via the Figma MCP; **never hand-edit token values in code**. Create a `/sync-tokens` custom command that re-reads the Figma variables and regenerates `tokens.css`.

## Project structure

```
src/
  components/     # Map, MarkerLayer, Sidebar, FilterPanel, SearchBar,
                  # SpaceCard, SpaceDetail, MobileSheet, ViewToggle
  hooks/          # useFilters, useUrlState, useSpaces, useFavorites, useGeolocation
  lib/            # resolvers.ts, constants.ts, supabase.ts
  styles/         # tokens.css, global.css
  data/           # pops-snapshot.json (cached dataset)
public/
  map-style.json
scripts/
  fetch-data.ts   # build-time dataset snapshot
```

---

## Dataset knowledge (critical — this data is messy)

Records are inconsistent. These rules are proven against the live data; implement them exactly in `lib/resolvers.ts`.

### Field resolution
- **Name** — first non-empty of: `building_name` → `principal_public_space` → `space_name` → `pops_name` → `address_number + ' ' + street_name` → `building_address_with_zip` → `'Unnamed space'`
- **Address** — `building_address_with_zip`, else `address_number + street_name`, else empty
- **Borough** — `borough_name`
- **Space type** — `public_space_type` (free text, e.g. "Plaza", "Arcade", "Atrium")
- **Coordinates** — `parseFloat(latitude)` / `parseFloat(longitude)`; exclude from map if missing/NaN, but keep in list with a "no map location" flag
- **Hours** — `hour_of_access_required` (free text; may be empty → show "Not listed")
- **APOPS link** — if `pops_number` exists: `https://apops.mas.org/pops/{pops_number.toLowerCase().trim()}/`
- **Stable record ID** — `pops_number`, falling back to `building_address_with_zip`

### Indoor vs outdoor
A space is **indoor** if `public_space_type` (lowercased) contains any of:
`atrium, arcade, gallery, covered, interior, enclosed, lobby, galleria`
Everything else is outdoor. This drives marker shape, detail-header color, and the Type filter.

### Amenities (keyword matching against `amenities_required`)
`amenities_required` is a free-text blob. Lowercase it; if empty or `"none"`, no amenities. An amenity is present if the text contains any of its keywords:

| Amenity | Keywords |
|---|---|
| Seating | seating, seat |
| Tables | table |
| Restrooms | restroom, bathroom, toilet |
| Food service | food, café, cafe, kiosk, vending, restaurant |
| Water feature | water feature, fountain, waterfall |
| Trees / planting | trees, planting, landscap, shrub |
| Artwork | artwork, art, sculpture |
| Bicycle parking | bicycle, bike |
| Climate control | climate, heated, air condition, cooled |
| Elevator | elevator |
| Escalator | escalator |
| Lighting | lighting, lit |
| Retail frontage | retail |
| Subway access | subway |
| Programs | program |
| 24-hour access | 24 hour, 24-hour, 24hours, open 24 |

### ADA accessibility (`physically_disabled` field)
Normalize (lowercase, trim), then map:
- `full` → **Fully accessible** ("Full ADA compliance")
- `full/partial` or `partial/full` → **Partially accessible** ("Full access in some areas") — counts as *full* for filtering
- `partial` → **Partially accessible** ("Some ADA features present")
- `none`, `no`, `n/a`, `na` → **Not accessible**
- empty or `unknown` → **Accessibility unknown**
- anything else → **Accessibility unknown**, show the raw value as the subtitle

Filter semantics: "♿ Full" chip matches full + full/partial; "♿ Some" chip matches partial only; both selected = OR.

### Search
Case-insensitive substring match across a concatenation of: name, address, borough, `street_name`, `neighborhood`, `community_district`, space type, `amenities_required`, `hour_of_access_required`, `building_location`, `developer`, `zip_code`, `pops_number`.

---

## Data strategy

1. **Cached snapshot is the primary source.** `npm run fetch-data` pulls the full dataset (`?$limit=600&$order=:id`) and writes `src/data/pops-snapshot.json`. App boots from it instantly — no loading spinner on the critical path.
2. **Background freshness check:** on load, fetch live in the background; silently update state if it differs. If the live fetch fails, the app still works from the snapshot.
3. Keep a visible-but-quiet error path only for the case where both snapshot and live fetch are unavailable.

## URL state (v1 requirement)

All filter/search/selection state syncs to the URL — shareable and deep-linkable:

```
/?borough=Manhattan,Brooklyn&type=indoor&amenity=restrooms,seating&ada=full&q=atrium&space=<pops_number>
```

- `space=` opens the detail view for that record on load and centers the map
- `useUrlState` hook; browser back/forward must work

---

## Features and build order

### Phase 1 — Scaffold + Map
- Vite + React + TS, structure above, Vercel deploy pipeline from day one
- MapLibre map centered on `[40.745, -73.985]`, zoom ~12, zoom controls bottom-right
- **Custom style JSON:** recolor land, water, roads, and labels using the `map/*` tokens from the design system (map/land, map/water, map/park, map/road, map/road-casing, map/building, map/label). The basemap is part of the design system — when tokens sync, regenerate the style JSON colors too
- **Markers:** sizes come from `marker/size-default` (20) and `marker/size-selected` (32)
- **Custom SVG markers:** teardrop pin = outdoor (orange), rounded square = indoor (blue). Selected state: larger, dark-green fill with white ring, raised z-index. One selected at a time
- Marker click → open detail. Map click → deselect/close
- Attribution: OpenStreetMap, OpenFreeMap, NYC Open Data

### Phase 2 — List, Filters, Search, Detail
**Layout**
- **Desktop (>640px):** floating left sidebar over the map — green header block (title "NYC POPS", subtitle "privately owned public spaces", yellow accent on "POPS"), icon buttons for search and filters that expand collapsible panels, live count row, scrollable results list below
- **Mobile (≤640px):** fixed green top bar (same title/icons/expanding panels), map fills screen, bottom-center pill toggle (Map | List), full-screen list view, slide-up detail sheet (~50% height)

**Filters** (all combinable)
- Borough: Manhattan, Brooklyn, Queens, Bronx, Staten Island (multi-select, OR)
- Type: Outdoors / Indoors (multi-select, OR)
- ADA: ♿ Some / ♿ Full (semantics above)
- Amenities: all 16 chips, **AND** logic (record must match every selected amenity)
- Live result count; "Clear N filters" button; count badge on the filter icon; desktop and mobile filter state stay in sync

**List cards:** type icon, name, address, tags (borough outline, indoor/outdoor colored, space type neutral). Click → pan map, open detail, highlight card.

**Detail view** (desktop floating right card / mobile bottom sheet)
- Header color-coded: orange = outdoor, blue = indoor; name + address as a Google Maps search link (`https://www.google.com/maps/search/?api=1&query={name, address, NYC}`)
- Tag row (borough / indoor-outdoor / type)
- Amenity checklist: all 16, ✓/✕ per item
- Hours block (yellow tint) with caveat: "⚠️ This data may be out of date — confirm hours before visiting."
- ADA status block per the mapping above
- "View on APOPS" button when `pops_number` exists

### Phase 3 — Design system + Accessibility (blocking for launch)
**Tokens** (`tokens.css`, generated from the Figma design system — see Stack)
- The palette is already built and WCAG AA verified in Figma. Key values: primary `green/700 #007263`, dark header surface `green/800 #00594E` (required behind yellow or white text — plain #007263 fails AA with yellow), accent `yellow/400 #F5CB5C`, outdoor `orange/600 #B5541A`, indoor `blue/600 #0071A4`, ink ramp `#1E2523 / #44504D / #5F6E6B`, focus ring `border/focus → blue/600`
- Spacing is base-8: 4, 8, 12, 16, 24, 32, 48. Radii: 8, 16, 24, 32, full(999). Type: 12/14/16/20/24/32, leading 1.2 tight / 1.5 normal. Motion: 150ms fast, 400ms slow, ease cubic-bezier(0.32, 0.72, 0, 1); `prefers-reduced-motion` zeroes durations
- Shadows come from the Elevation/card and Elevation/sheet effect styles; text styles map to Type/Display, Heading, Title, Body, Body Small, Caption
- **Every foreground/background pair passes WCAG AA** (4.5:1 text, 3:1 large text/UI) — verify programmatically in a test, don't eyeball

**Accessibility**
- All icon-only buttons: `aria-label`; filter chips: real `<button>`s with `aria-pressed`
- Full keyboard support: tab through chips and list items, visible focus rings, Escape closes detail/sheet
- Result count in an `aria-live="polite"` region
- Detail sheet: focus trap, focus returns to trigger on close
- Landmarks (`nav`, `main`, `search`), skip link, `prefers-reduced-motion` disables slide/stagger animations
- Target: **Lighthouse accessibility ≥ 95**

### Phase 4 — GPS + polish
- "Near me": `navigator.geolocation`, sort list by distance, distance on cards, user-location dot on map, graceful denied-permission handling
- Empty states, error states, loading skeletons; subtle staggered card entrance animation (respecting reduced motion)

### Phase 5 — Favorites (local-first)
- Heart toggle on cards + detail; favorites in **localStorage**; "Favorites" filter chip
- Design the Supabase schema now for later migration: `favorites(user_id, pops_number, created_at)`

### Phase 6 — Supabase: Auth + Suggest an Edit
- Auth: **magic link** (email, no passwords); on login, migrate localStorage favorites to the account
- "Suggest an edit" form on detail: field, proposed value, optional note
- `suggested_edits(id, pops_number, field, current_value, proposed_value, note, submitted_by, status[pending|approved|rejected], reviewed_by, reviewed_at, created_at)`
- Minimal role-gated `/admin` route: list pending edits, approve/reject

### Phase 7 — Photo uploads
- Authenticated upload per space (Supabase Storage)
- `photos(id, pops_number, storage_path, uploaded_by, status[pending|approved|rejected], reviewed_by, created_at)`
- Public display **only after approval** (extend `/admin`)
- Client-side resize/compress (max ~1600px, ~500KB), max 5 photos/user/space, jpg/png/webp only
- Required checkbox: "I took this photo or have the right to share it"

---

## Footer / legal (v1)

- "Data: NYC Open Data. Not affiliated with the Municipal Art Society, APOPS, or the NYC Department of City Planning."
- When accounts exist: one-paragraph privacy note (what's stored: email, favorites, submissions)
- Photo terms line ships with Phase 7

## Working agreements

- Ship Phases 1–4 as v1 before any Supabase work
- One commit per phase with a working deploy; from Phase 3 on, no phase merges with Lighthouse a11y < 95
- Check mobile/desktop parity every phase (375px and 1440px)
- Filter/URL logic lives in hooks, not components; keep components small
- Start with **Phase 1 only**; wait for my review before each next phase

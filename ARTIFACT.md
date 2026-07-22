# NYC POPS Explorer Artifact

## Table of Contents

- [Design System](#design-system)
- [Components + UX Highlights](#components--ux-highlights)
- [Workflow](#workflow)
- [Accessibility & QA](#accessibility--qa)

## Design System

### Token source

- `src/styles/tokens.css` is the single source for color, spacing, radius, typography, motion, map colors, and marker sizes.
- The token file is generated from the Figma design system, not hand-edited in code.
- `CLAUDE.md` and `nyc-pops-kickoff-prompt_1.md` confirm the design system is the authoritative palette and token source.

### Palette and semantics

- Primitive colors include sage greens, cream surfaces, honey accent, terracotta/orange, lake blue, and ink neutrals.
- Semantic colors map to tokens such as:
  - `--color-primary` = green brand
  - `--color-accent` = honey/yellow accent
  - `--color-outdoor` = terracotta orange
  - `--color-indoor` = lake blue
  - `--color-ada-full`, `--color-ada-partial`, `--color-ada-none`, `--color-ada-unknown`
- Map theme colors are also tokens:
  - `--map-land`, `--map-water`, `--map-road`, `--map-road-casing`, `--map-park`, `--map-label`, `--map-building`

### Spacing, radii, typography, motion

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48.
- Radii scale: 6, 10, 16, 22, 32, full.
- Typeface stacks:
  - `--font-sans` for UI and body text
  - `--font-display` for titles and headings
- Type sizes: 12, 14, 16, 20, 24, 32.
- Motion durations: 150ms fast, 250ms medium, 400ms slow, with a standard easing curve.
- `prefers-reduced-motion` zeroes motion durations.

### Design intent

- The interface uses botanical rounded shapes, soft cards, and a green header anchored to the UI.
- Buttons and chips use pill shapes; passive tags use smaller rounded rectangles.
- The map and list visual systems are intentionally matched through token-based color and spacing.

## Components + UX Highlights

### App structure

- `src/App.tsx` renders two separate trees for desktop and mobile.
  - Desktop: map + sidebar + floating detail card.
  - Mobile: top bar + map view / list view toggle + sliding detail sheet.
- Responsive behavior is handled with `useMediaQuery` and not only CSS breakpoints.

### State and interactions

- `src/hooks/useUrlState.ts` keeps filter/search/selection state in the URL query string.
  - `borough`, `type`, `amenity`, `ada`, `q`, and `space` are all synced to the URL.
  - `update()` uses `pushState` for discrete actions and `replaceState` for typed input.
  - `popstate` is handled so back/forward navigation restores filter state.
- `src/hooks/useSpaces.ts` loads static snapshot data immediately, then fetches live data in the background.
  - Snapshot file: `src/data/pops-snapshot.json`
  - Live fetch URL: `https://data.cityofnewyork.us/resource/rvih-nhyn.json?$limit=600&$order=:id`

### Header, search, filters

- `src/components/AppHeader.tsx` contains the title, search button, filters button, result count, and reset behavior.
- `src/components/FilterPanel.tsx` provides filter chips for borough, type, ADA, and 16 amenities.
  - Borough, type, and ADA are multi-select OR filters.
  - Amenity chips are AND filters.
- Search is handled by `src/components/SearchBar.tsx` and updates `filters.q` via URL state.

### List + detail interactions

- `src/components/ResultList.tsx` renders cards and handles auto-scrolling the selected card into view.
- `src/components/SpaceCard.tsx` renders each space item with:
  - indoor/outdoor icon
  - name and address
  - tags for borough, indoor/outdoor, and type
- Desktop selected item flow opens `src/components/SpaceDetail.tsx` in a floating panel.
- Mobile selected item flow opens `src/components/MobileSheet.tsx` with the same detail content.

### Map and marker UX

- `src/components/MapView.tsx` renders a `react-map-gl` MapLibre map and markers for mappable spaces.
- Marker visuals are custom SVG shapes:
  - teardrop pin for outdoor
  - rounded square for indoor
  - selected marker is larger and visually highlighted
- Map click deselects the current space.
- Selected/highlighted marker behavior is coordinated with list and detail views.
- The map cleans up `maplibregl-marker` wrapper attrs to avoid nested interactive elements.

### Detail view

- `src/components/SpaceDetail.tsx` renders:
  - color-coded header for indoor/outdoor
  - name, address, and a Google Maps route link
  - tags, amenities checklist, hours, ADA status, and external links
- `useDialogClose` ensures focus trap and focus return for the detail dialog.
- `SpaceDetail` also supports photo/updates UI via `PhotoLightbox` and `PhotosSection`.

## Workflow

### Build and scripts

- `package.json` defines:
  - `dev`: `vite`
  - `build`: `tsc -b && vite build`
  - `lint`: `oxlint`
  - `preview`: `vite preview`
  - `build-map-style`: `tsx scripts/build-map-style.ts`
  - `fetch-data`: `tsx scripts/fetch-data.ts`

### Data pipeline

- Primary data source is the cached JSON snapshot in `src/data/pops-snapshot.json`.
- The app boots instantly from the snapshot and uses `useSpaces` to attempt a live refresh.
- If live refresh fails, the app continues working from the snapshot.
- `scripts/fetch-data.ts` is the build-time step to refresh the snapshot from the Socrata endpoint.

### URL-driven state

- Filters, search, and space selection are always reflected in the URL.
- `space=<pops_number>` deep-links directly to a detail view and map selection.
- This makes the app shareable and back/forward compatible.

### Phased delivery

- Phase 1: scaffold + map + custom basemap styling.
- Phase 2: list, filters, search, detail views, and responsive mobile layout.
- Phase 3: design system, token sync, and accessibility.
- Phase 4: GPS/near-me, polish, empty/error states, loading skeletons.
- Later phases include favorites, Supabase auth, edits, and photo uploads.

## Accessibility & QA

### Accessibility priorities

- Real `<button>` chips with `aria-pressed` for toggle filters.
- Icon-only controls use `aria-label` and `aria-expanded` where needed.
- Result count is published in an `aria-live="polite"` region.
- Dialogs and sheets use focus management through `useDialogClose`.
- `prefers-reduced-motion` disables nonessential transitions.
- Landmarks and semantic structure include `main`, `nav`, and `header`.

### Contrast and color

- All foreground/background pairs in `src/styles/tokens.css` are WCAG AA verified.
- Semantic ADA colors and on-primary text colors are chosen for accessibility.
- `CLAUDE.md` documents the commitment to WCAG AA contrast checks.

### QA notes

- The repo has no test suite configured, but manual validation should include:
  - desktop and mobile layouts at 375px and 1440px
  - filter/search state persistence via the URL
  - map/list/detail synchronization
  - keyboard navigation and focus behavior
- The `CLAUDE.md` brief explicitly calls for Lighthouse accessibility >= 95.

### Design-system maintenance

- `tokens.css` should remain generated from the Figma design system.
- Map style colors must stay synced with the palette defined in `tokens.css` and `scripts/build-map-style.ts`.
- Avoid introducing hardcoded colors or raw pixel typography values outside the token system.

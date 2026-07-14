# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NYC POPS Explorer — a map-based explorer for NYC's Privately Owned Public Spaces (POPS), built against a project brief that specifies dataset-handling rules, a phased build order, and working agreements (see "Build order & working agreements" below). React + Vite + TypeScript, MapLibre GL JS via `react-map-gl`, deployed to Vercel with auto-deploy from GitHub on push to `main`.

## Commands

```bash
npm run dev              # start dev server
npm run build             # tsc -b && vite build — type-checks before bundling
npm run lint               # oxlint
npm run preview            # preview the production build locally
npm run fetch-data         # pull the live POPS dataset into src/data/pops-snapshot.json
npm run build-map-style    # fetch OpenFreeMap's "liberty" style and recolor it into public/map-style.json
```

There is no test suite configured in this repo.

Type-check the whole project with `npx tsc -b --force` (the `--force` bypasses the incremental build cache — use it when you want a real from-scratch check, e.g. before committing).

## Architecture

### Data pipeline
- `scripts/fetch-data.ts` pulls the NYC Open Data POPS dataset (Socrata API, `$limit=600`) and writes a static snapshot to `src/data/pops-snapshot.json`. The app imports this JSON directly and renders from it instantly (no loading spinner on the critical path), then `useSpaces` (`src/hooks/useSpaces.ts`) does a background `fetch` of the live endpoint and swaps in fresh data if it differs; a failed live fetch silently falls back to the snapshot.
- `scripts/build-map-style.ts` fetches OpenFreeMap's public "liberty" style JSON and recolors specific layers (land/water/park/road/label) to the app palette, writing the result to `public/map-style.json`. This is a build-time step, not runtime — re-run it manually if the palette or OpenFreeMap's base style changes.
- Raw Socrata records are messy/inconsistent by design (missing fields, free-text amenity blobs, inconsistent ADA values). **All field access goes through `src/lib/resolvers.ts`** — never read raw record fields directly in components. Key resolvers: `resolveName`/`resolveAddress`/`resolveCoordinates` (fallback chains), `isIndoor` (keyword match against `public_space_type`), `resolveAmenities` (keyword match against the free-text `amenities_required` field, keyed off the `AMENITIES` config in `src/lib/constants.ts`), `resolveAda` (normalizes `physically_disabled` into `full`/`partial`/`none`/`unknown` — note `full/partial` and `partial/full` both count as `full` for filtering purposes), `matchesSearch`/`searchHaystack` (substring search across a fixed set of fields). `toSpace()` converts a raw record into the `PopsSpace` shape everything else in the app consumes.

### Filter/URL state
- All search/filter/selection state lives in the URL as query params (`borough`, `type`, `amenity`, `ada`, `q`, `space`), managed by `src/hooks/useUrlState.ts`. This is the single source of truth — there is no separate filter state elsewhere.
- **Side effects (`history.pushState`/`replaceState`) must never live inside a `setState` updater function.** React StrictMode invokes updater functions twice in dev to catch impurities; a pushState inside one double-fires and corrupts the back/forward stack. `useUrlState`'s `update()` computes the next state from the `filters` closure and calls `history.push/replaceState` directly in the callback body, then calls `setFilters(next)` with a plain value — see the comment in that file before changing this pattern.
- `update(patch, { push })`: pass `push: true` for discrete actions (filter toggles, selection) so they're back/forward-able; pass `push: false` (or omit) for continuous input like search-as-you-type, using `replaceState` so every keystroke doesn't spam history.
- `src/hooks/useFilters.ts` applies the current `FilterState` against the space list: borough/type/ADA are OR-within-category, amenities are AND (a space must match every selected amenity), search is a substring match. This filtered list feeds both the map markers and the result list — filters affect what's plotted, not just what's listed.

### Responsive layout — two real component trees, not CSS breakpoints
`App.tsx` branches on `useMediaQuery('(max-width: 640px)')` (aliased as `MOBILE_MEDIA_QUERY` in `src/lib/constants.ts`) and renders **entirely different component trees** for desktop vs. mobile, rather than one tree hidden/shown via CSS:
- Desktop: `Sidebar` (floating card: `AppHeader` + `ResultList`) + a `.detail-card`-wrapped `SpaceDetail` floating on the right.
- Mobile: a `<header>` top bar (`AppHeader` again), a `ViewToggle` pill (Map/List), a full-screen `ResultList` when in list mode, and `MobileSheet` (a slide-up sheet, positioning-only) wrapping `SpaceDetail` when a space is selected.

`AppHeader` and `SpaceDetail` are shared between both trees; `MobileSheet` deliberately has no dialog/focus logic of its own — it's a positioning shell only, because `SpaceDetail` (via `useDialogClose`) owns all of the dialog semantics (role, focus trap, Escape, focus-return) so nesting two dialog-behavior owners doesn't happen. When editing detail-view content, edit `SpaceDetail`, not the wrappers.

### Accessibility invariants (established in Phase 3, don't regress)
- Map markers render as real `<button>`s but are `tabIndex={-1}` — with ~400 markers, including them in the tab sequence would make keyboard navigation unusable. The `ResultList` cards are the keyboard-accessible path to every space; if you add another way to reach a space, keep it out of the marker layer's tab order too.
- `maplibre-gl`'s `Marker` class force-sets `role="button"` on its own wrapper element (outside library configuration) unless a `role` attribute is already present, which nests an interactive element around our labeled marker `<button>` — an axe `nested-interactive` violation. `MapView.tsx` strips `role`/`aria-label`/`tabindex` off `.maplibregl-marker[role="button"]` elements in a `useEffect` after each marker set change; this must run in a *parent* effect so it fires after the child `Marker` components' own effects have created the DOM (React runs effects child-before-parent).
- `useDialogClose` (`src/hooks/useDialogClose.ts`) provides the focus trap + focus-return pattern for any dialog/sheet: it returns `{ containerRef, closeButtonRef }`, traps Tab/Shift+Tab within `containerRef`'s focusable descendants, and restores focus to whatever had focus before the dialog opened. Reuse this hook rather than re-implementing dialog focus handling.
- Every foreground/background color pair in `tokens.css` has been verified against WCAG AA (4.5:1 normal text, 3:1 large text/UI) — see the comments on `--color-outdoor`, `--color-indoor`, and `--color-ada-none`/`--color-ada-unknown` for the specific values that were darkened from their original design-brief targets to pass, and why. If you change any of these colors, re-verify contrast (a plain relative-luminance contrast calculation is enough — no special tooling needed).
- Landmarks matter here: `<main>` wraps the map (with a skip link), `<header>` wraps the mobile top bar, `<nav>` wraps the sidebar/mobile list/view-toggle. Axe's `region` rule will flag floating UI that isn't inside a landmark.

### Design tokens
`src/styles/tokens.css` is the single source for color/spacing/radius/type-scale/z-index custom properties; `src/styles/components.css` consumes them (no hardcoded `px` font sizes or hex colors in component CSS — use `var(--text-*)` / `var(--color-*)`). Semantic color tokens exist only for indoor/outdoor space type and ADA accessibility state, plus one primary and one accent brand color — don't introduce new one-off brand colors for individual features.

## Build order & working agreements

This project follows a phased build order from a project brief (Phases 1–7: scaffold+map, list/filters/search/detail, design system+accessibility, GPS+polish, favorites, Supabase auth, photo uploads). As of the last work session, Phases 1–3 are complete and deployed; Phase 4 (GPS "near me" + empty/error states + loading skeletons) is next, with a separate final motion/animation polish pass planned after all functional phases. Supabase-backed work (Phases 5–7) is intentionally deferred until the non-Supabase v1 (Phases 1–4) is complete — don't reach for Supabase, auth, or a backend unless picking up that later phase.

Other standing agreements from the brief: one commit per phase with a working deploy; Lighthouse accessibility must stay ≥ 95 (currently 100) — don't merge a change that regresses it; check both ~375px and ~1440px layouts for any UI change, since desktop and mobile are separate component trees, not one responsive tree.

## Deployment

- GitHub repo: `soveryizzi/nyc-pops-explorer`, auto-deploys to Vercel on push to `main`.
- `.vercel/` and `.env*` are gitignored (added automatically by the Vercel CLI).

# Movielly — UI Redesign & Component Rework Plan

> Handoff document. Everything below was derived by reading the current source at
> `/Users/jennietran/Downloads/movielly`. Line numbers reflect the working tree at the
> time of writing (branch `main`, after commit `e204616 web redesign`) and may drift —
> verify before editing.

---

## 0. Context an implementer needs

### Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v3.4, dark-only.
- **Data fetching**: TanStack Query v5. Provider in `frontend/src/components/Providers.tsx`.
  Shared stale times in `frontend/src/lib/queryConfig.ts` (`QUERY_STALE_TIME.{browse,search,details,referenceData,trailersAndSimilar}`).
- **TMDB access**: proxied through the Express backend (port 3001) via `frontend/src/lib/api.ts`.
- **Supabase**: auth + DB, all table access through `frontend/src/lib/db.ts`.
- **Client state**: `AuthContext`, `WatchlistContext`, `FavoritesContext` in `frontend/src/context/`.
- **Icons**: `lucide-react`. **Popover**: `@radix-ui/react-popover`.
- Node >= 20.9. Run both servers with `npm run dev` at the repo root.

### Existing design system (do NOT redesign this — it is good and coherent)

Defined in `frontend/tailwind.config.ts` + `frontend/src/app/globals.css`. Theme name in the
code comments is "late-night cinema": a warm black room, gold for judgment, red for love,
and **posters carry the color — the UI does not.**

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0B0A09` | page background |
| `velvet` | `#161310` | raised surface (cards, dropdowns, inputs) |
| `seat` | `#211C18` | hover / inset well |
| `rail` | `#2C261F` | borders, hairlines |
| `fog` | `#8A8278` | secondary text, captions, placeholders |
| `screen` | `#F3EDE3` | primary text |
| `tungsten` / `tungsten-dim` | `#E0A84A` / `#B07E2C` | the one action colour |
| `ticket` / `ticket-dim` | `#C23B3B` / `#8E2A2A` | favorite / danger |

Fonts: `font-display` = Bodoni Moda (headlines, wordmark), `font-sans` = Manrope (UI),
`font-mono` = IBM Plex Mono (numbers, dates, counts, meta lines).

Type scale (`fontSize` in the Tailwind config, with an explicit comment "Do not invent sizes
outside this list"): `display-xl` 64, `display-lg` 40, `display-md` 28, `title` 18,
`body` 15, `ui` 13, `meta` 12.

Radii: `poster` 6px, `panel` 16px. Shadow: `shadow-poster` only on hovered posters and modals.

**Constraints to preserve in every change below:**

1. Dark-only. No light mode, no theme toggle.
2. Gold (`tungsten`) marks exactly one primary action per view. Red (`ticket`) is favorite/danger only.
3. `.glass` is allowed only on surfaces that sit over imagery (mobile dock, controls over a still).
   Never a white sheen, never a brand-coloured inner glow.
4. Hover effects belong to fine pointers only — see the `@media (hover: hover) and (pointer: fine)`
   block in `globals.css`. Touch devices show actions permanently and never scale art.
5. Respect `prefers-reduced-motion` (already wired for hero, poster zoom, poster wall, aurora).
6. Every interactive element keeps a visible focus ring in `tungsten` with an `ink` offset.

---

## Priority summary

| # | Item | Type | Impact | Effort |
|---|---|---|---|---|
| 1 | Desktop has no section navigation | Redesign | Critical | M |
| 2 | Browse/filter state is not in the URL | Redesign | High | M |
| 3 | Results grid is capped at 20 with no pagination | Redesign | High | M |
| 4 | Filter popover: 76-year scroll list | Redesign | High | M |
| 5 | Two search implementations; home search below the hero | Redesign | Medium | S |
| 6 | Rail poster titles hidden until hover on desktop | Redesign | Medium | XS |
| 7 | "Where to watch" falls to the bottom on mobile | Redesign | Medium | XS |
| 8 | `useTitleActions` — same logic written 4× | Rework | High | S |
| 9 | `/movie/[id]` and `/tv/[id]` are near-duplicates | Rework | High | M |
| 10 | `focusRing` ×12 and section heading ×8 | Rework | Medium | S |
| 11 | 29 hardcoded `text-[Npx]` bypass the type scale | Rework | Medium | S |
| 12 | `StarRating` is two different products | Rework | Medium | S |
| 13 | Delete dead sandbox routes (drops `framer-motion`) | Rework | Medium | XS |
| 14 | Toast position collides with the navbar | Rework | Low | XS |

Suggested order: **1 → 2 → 3** (user-visible, unblock each other), then **8 → 9 → 10**
(cleanup that makes everything after it cheaper), then the rest. **13** is a five-minute win
and can be done first to shrink the surface area.

---

# Part A — Redesign

## 1. Desktop has no section navigation at all

**Severity: critical. This is a navigation dead end, not a taste question.**

### Evidence

- `frontend/src/components/layout/SiteDockNav.tsx:26` — `if (!isMobile || HIDDEN_ON.includes(pathname)) return null;`
  The dock carrying Home / Watched / Favorites / Friends is **mobile-only**.
- `frontend/src/components/layout/Navbar.tsx` — renders only: `<Wordmark>`, a search form
  (hidden on `/`), and the account avatar. **No section links.**
- `Navbar.tsx:82-102` — the account dropdown contains only *Edit profile* (`/settings`) and *Sign out*.

**Result:** on a desktop viewport, `/watchlist`, `/favorites` and `/friends` cannot be reached
by clicking anything. The user must type the URL. `/user/[id]` and `/list/[shareId]` are only
reachable *from* `/friends`, so they are transitively unreachable too.

### Recommended fix — persistent left rail on `lg+`

Create `frontend/src/components/layout/SideRail.tsx`:

- Fixed left rail, `lg:` and up only. Collapsed width 72px (icon + tooltip), expanded ~200px
  (icon + Manrope label). Persist the expanded/collapsed choice in `localStorage`.
- Items: reuse the exact `NAV_ITEMS` array currently in `SiteDockNav.tsx:10-15` — extract it to a
  shared module (e.g. `frontend/src/lib/nav.ts`) so the rail and the dock cannot drift apart.
  Note the existing comment: the route stays `/watchlist` for link compatibility but the visible
  word is **"Watched"**.
- Active state: match the dock's language — a `tungsten` marker on the active item (the dock uses
  a 2px underline; the rail should use a 2px left bar), `text-screen` when active, `text-fog`
  otherwise. **No glow, no filled pill.**
- Bottom of the rail: the account block (avatar, `@username`, Edit profile, Sign out) moved out of
  the top bar's dropdown.
- Surface: `bg-ink` with a `border-r border-rail`. Not glass — it does not sit over imagery.

Then in `frontend/src/components/layout/SiteChrome.tsx`:

- Mount `<SideRail />` alongside `<Navbar />` and `<SiteDockNav />`.
- Offset `<main>` and the footer by the rail width on `lg+`.
- Keep `BARE_ROUTES` (`/login`, `/signup`, `/forgot-password`, `/reset-password`) fully bare —
  no rail there either.
- The top bar shrinks to: wordmark (mobile only, since the rail carries it on desktop) + search.

**Full-bleed heroes:** `NowShowing` and `TitleHero` are currently `w-full` against the viewport.
With a rail they must be full-bleed *within the content column*, not under the rail. Verify both
at 1280px and 1920px after the change.

### Cheaper alternative (if you do not want a rail)

Add the four `NAV_ITEMS` as text links in the centre of `Navbar`, and move search into a
command-palette-style trigger. This is less work but competes with search for horizontal space
and loses the vertical real estate a rail would give back.

### Acceptance

- At ≥1024px, every one of Home / Watched / Favorites / Friends / Settings / Sign out is
  reachable in one click from any non-auth page.
- The mobile dock is unchanged below `lg`.
- Nav items are declared in exactly one place.

---

## 2. Browse and filter state is not in the URL

### Evidence — `frontend/src/app/page.tsx`

- Line 73: only `q` is read from `useSearchParams()`.
- Lines 75-80: `genre`, `typeFilter`, `year`, `sort`, `viewAll` are all `useState`.
- Line 103: `const resultsMode = !!query || activeFilterCount > 0 || viewAll !== null;` — the page
  flips between "rails" and "grid" based on a mode that is invisible to the URL.

**Consequences:** a filtered browse view cannot be shared or bookmarked; the browser Back button
does not undo a filter (it exits the page instead); a refresh silently resets every filter; and
`viewAll` — set by the "View all →" affordance on each rail at lines 363, 369, 375 — is a hidden
mode with no address.

### Recommended fix

Move all browse state into the query string and derive React state from it:

```
/?q=dune&type=movie&genre=878&year=2021&sort=rating_desc
```

- Read every value from `useSearchParams()`; write with `router.replace()` (not `push`) for filter
  toggles so the history stack does not fill with intermediate states — but use `push` for search
  submits and for "View all", which *should* be Back-able.
- Delete the `viewAll` state entirely. "View all" on the Trending rail becomes
  `?sort=popularity&view=trending`; on Popular films it becomes `?type=movie`; on Popular series,
  `?type=tv`. Note the existing subtlety at lines 315-318: "Popular films" sets both `typeFilter`
  and `viewAll`, and the chip's remove handler has to clear both. Encoding it in the URL makes
  that coupling disappear.
- `resultsMode` becomes a pure function of the parsed params.
- Keep the existing chip row (lines 309-324) — it is good — but derive each chip's remove action
  from "delete this param" instead of "call this setter".

### Acceptance

- Copy the URL of a filtered view into a new tab → identical results.
- Back after applying a genre filter → previous filter state, not page exit.
- Refresh preserves filters.

---

## 3. The results grid is capped at 20 titles with no way forward

### Evidence — `frontend/src/app/page.tsx`, `queryFn` at lines 156-172

- Line 158: `movieApi.search(query, 1, type, signal)` — page hardcoded to `1`.
- Line 170: `movieApi.discover(mediaType, genre, year, sortBy, 1, signal)` — same.
- There is no "Load more", no infinite scroll, and no pagination control anywhere in the tree.

So every search and every "View all" shows at most one TMDB page (20 results) and then stops dead.

**Secondary bug this creates:** `applySort` (lines 107-111) sorts client-side, but only on the
search branch. So choosing "Rating: best to worst" on a search does not return the best-rated
matches — it returns the best-rated *of the arbitrary first 20*. The discover branch correctly
sorts server-side via `sortBy`, so the same control means two different things depending on
whether `q` is set.

### Recommended fix

- Convert the `browse` query to `useInfiniteQuery`, with `getNextPageParam` returning
  `page + 1` while `page < total_pages` (TMDB caps at 500 pages — clamp).
- Auto-load on scroll via an `IntersectionObserver` sentinel placed after the grid, plus a visible
  "Load more" button as the accessible fallback (do not rely on scroll alone).
- Append a skeleton row (`PosterSkeleton` from `frontend/src/components/movie/MovieGrid.tsx`
  already exists and takes a `count`) while the next page is in flight.
- **Delete `applySort`.** Pass the sort to the API on both branches. If TMDB's `/search` endpoint
  cannot sort, then hide the sort control while `q` is set rather than showing a control that lies.
- `MovieGrid` will need to accept `hasNextPage` / `isFetchingNextPage` / `onLoadMore`, or the page
  can render the sentinel itself below `<MovieGrid>`.

### Acceptance

- Scrolling a search or a filtered browse loads page 2, 3, … without a click.
- Keyboard-only users can reach and activate "Load more".
- The sort control's meaning is identical whether or not a search term is present.

---

## 4. The filter popover is a scrolling list of 76 years

### Evidence — `frontend/src/app/page.tsx`

- Line 30: `const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, …)` — 76 entries.
- Lines 263-273: those 76 years render as `OptionRow` radio rows inside a `max-h-44 overflow-y-auto`.
- Lines 278-283: genres render as another `max-h-44 overflow-y-auto` list.
- Line 231: both of those sit inside a `max-h-[26rem] overflow-y-auto` popover body.

That is a scroll container inside a scroll container inside a popover — painful with a trackpad,
worse on touch, and it hides the app's primary browse interaction behind a click.

### Recommended fix

Replace the popover with a **filter bar** that renders inline under the page heading whenever
`resultsMode` is true (keep it collapsed behind the existing `SlidersHorizontal` trigger on
small screens only):

- **Type** — keep the existing segmented control (lines 234-251). It is already right.
- **Genre** — wrapped chips, not a scroll list. TMDB returns ~19 movie genres and ~16 TV genres;
  they fit in two or three rows. Reuse the visual language of the existing `FilterChip`
  (lines 56-68) for the selected state.
- **Year** — decade chips (`2020s`, `2010s`, `2000s`, `1990s`, `Older`) plus an optional
  "exact year" numeric input for power users. A single year is rarely what someone wants;
  TMDB's discover endpoint supports `primary_release_date.gte`/`.lte` for ranges.
- **Sort** — a compact select or a small popover. Three options do not need a section.
- Keep "Clear filters" (lines 286-294), and keep the active-count badge on the trigger.

Keep the chip summary row (lines 309-324) — it is the best part of the current filter UI and it
should stay visible when the bar is collapsed.

### Acceptance

- Choosing a genre takes one click from a results view, with no nested scrolling.
- Choosing a decade is one click.
- Everything still round-trips through the URL (see item 2).

---

## 5. Two search implementations, and the home one sits below the hero

### Evidence

- `frontend/src/components/layout/Navbar.tsx:19` — `const showSearch = pathname !== '/';`
  The bar's search is *hidden* on the home page.
- `frontend/src/app/page.tsx:200-307` — home renders its own, larger search bar (`searchBar`),
  mounted at line 342 **below** `<NowShowing>` (a `h-[min(78vh,640px)] md:h-[min(72vh,760px)]`
  hero, per `NowShowing.tsx:18`) and above the rails.
- The two inputs have different markup, different sizes, different placeholder handling, and only
  one of them owns the filter popover.

So on landing, the product's primary action is roughly one full screen-height of scrolling away,
and there are two components to maintain that do the same job.

### Recommended fix

- Pick **one** search component — extract `frontend/src/components/search/SearchBar.tsx` with a
  `variant="bar" | "page"` prop if two sizes are genuinely needed.
- Put it in the chrome (top bar, or the rail from item 1) on **every** page including `/`.
- On home, either drop the second instance entirely, or keep a large one **overlaid on the hero's
  lower third** so it is visible above the fold — do not stack it under a 72vh hero.
- Consider a `⌘K` / `/` shortcut opening the same component as a command palette. Optional.

### Acceptance

- One search component in the tree.
- A search input is visible without scrolling on every route, including `/`.

---

## 6. Rail poster titles are invisible until hover on desktop

### Evidence

- `frontend/src/app/globals.css:161-165`:
  ```css
  @media (min-width: 768px) {
    .rail-caption { opacity: 0; }
    .group:hover .rail-caption,
    .group:focus-visible .rail-caption { opacity: 1; }
  }
  ```
- `frontend/src/components/movie/MovieCard.tsx:126-131` renders the rail caption over the art,
  `hidden … md:block`; line 160 hides the under-poster caption on `md+` for the rail variant
  (`isRail ? 'md:hidden' : ''`).

So a desktop user scanning "Trending this week" sees a wall of unlabelled posters and must hover
each one to learn what it is. That trade works for Netflix because the viewer already recognises
the art from marketing; it fails for a discovery product whose whole job is surfacing titles the
user has *not* seen.

### Recommended fix

Show the title under the poster permanently on rails, exactly as the grid variant already does.
Keep the hover *zoom* (`.poster-zoom`) and the hover-revealed action buttons — those are fine.
Concretely: delete the `@media (min-width: 768px)` `.rail-caption` block, drop the over-art
caption from `MovieCard`, and remove the `md:hidden` on the under-poster block so `rail` and
`poster` variants share one caption treatment.

Note this makes rails slightly taller — check the rail-scroll chevron vertical centering at
`PosterRail.tsx:87` (`top-[38%]`), which is tuned to the current caption-less height.

---

## 7. "Where to watch" falls below every review on mobile

### Evidence — `frontend/src/app/(main)/movie/[id]/page.tsx:154-183` (and the TV twin)

```
<div className="grid gap-10 lg:grid-cols-3">
  <div className="… lg:col-span-2">  overview, cast, trailers, reviews  </div>
  <div className="space-y-6">        WhereToWatch, TitleFacts           </div>
</div>
```

Below `lg`, the grid is a single column, so the sidebar stacks **after** the entire main column.
A phone user must scroll past the overview, the cast strip, the trailer list and every review
before finding out where the film can actually be streamed.

### Recommended fix

Reorder for small screens so `WhereToWatch` sits immediately below the hero actions:

- Simplest: pull `<WhereToWatch>` out of the sidebar and render it twice — once in the main column
  with `lg:hidden`, once in the sidebar with `hidden lg:block`. It is a self-contained query
  component (`useQuery` keyed on `['providers', type, id]`), so a second mount is free —
  TanStack Query dedupes it.
- Or use `order-*` utilities on a flex container below `lg`.

`TitleFacts` can stay where it is; it is reference material, not an action.

---

# Part B — Component rework

## 8. Extract `useTitleActions(movie)` — the same logic exists four times

**Highest-value extraction in the codebase.**

### Evidence — four verbatim-ish copies of watchlist/favorite toggling

| File | Lines | Contains |
|---|---|---|
| `frontend/src/components/movie/MovieCard.tsx` | 48-79 | `payload()`, `toggleWatchlist`, `toggleFavorite` |
| `frontend/src/components/home/NowShowing.tsx` | 57-74 | same |
| `frontend/src/app/(main)/movie/[id]/page.tsx` | 97-109 | same |
| `frontend/src/app/(main)/tv/[id]/page.tsx` | ~98-110 | same |

Each one independently: derives `isTV`, builds the `{ movie_id, movie_title, movie_poster,
movie_type }` payload, reads `useWatchlist()` / `useFavorites()` / `useAuth()`, redirects to
`/login` when signed out, calls add/remove, and fires a toast with a hand-written string.
The toast copy is *already* inconsistent in places, which is exactly what duplication produces.

### Recommended fix

`frontend/src/hooks/useTitleActions.ts`:

```ts
export function useTitleActions(movie: Movie | TitleDetail) {
  // derives isTV, href, title, payload
  // returns { isTV, href, title, inWatchlist, inFavorites, toggleWatchlist, toggleFavorite }
}
```

- Centralise the "not signed in → `router.push('/login')`" guard.
- Centralise the toast strings so "Marked X as watched" / "Removed X from Watched" /
  "Added X to Favorites" / "Removed X from Favorites" are written once.
- Centralise the `isTV` derivation, which is currently repeated as
  `movie.media_type === 'tv' || (!movie.title && !!movie.name)` in at least
  `MovieCard.tsx:36` and `NowShowing.tsx:40`.

Then delete the four copies. Expect roughly 120 lines removed.

**Related:** there is an existing `frontend/src/hooks/useTitleList.ts` — check whether this hook
belongs beside it or should absorb part of it, rather than adding a third overlapping abstraction.

---

## 9. `/movie/[id]` and `/tv/[id]` are near-identical files

### Evidence

`frontend/src/app/(main)/movie/[id]/page.tsx` is 223 lines; `frontend/src/app/(main)/tv/[id]/page.tsx`
is 224. `diff` between them shows only these real differences:

1. Component name (`MovieDetailPage` / `TvDetailPage`).
2. `movieApi.getMovie(id)` vs `movieApi.getTv(id)` and the `'movie'`/`'tv'` literal in four
   query keys.
3. Title field order: `movie.title || movie.name` vs `show.name || show.title`.
4. Date field order: `release_date || first_air_date` vs `first_air_date || release_date`.
5. Meta middle segment: `runtime` formatted as `Xh Ym` vs `N season(s)`.
6. Facts list: movie shows **Director** (found via `credits.crew.find(c => c.job === 'Director')`);
   TV does not.
7. `movie_type` literal in the saved payload and in the review upsert.

Everything else — the review modal state machine, the trailer modal, the two-column layout, the
similar-titles rail, the skeleton, the not-found `EmptyState` — is byte-identical.

### Recommended fix

`frontend/src/components/movie/TitleDetail.tsx` taking `{ type: 'movie' | 'tv'; id: number }`,
with a small per-type adapter:

```ts
type TitleAdapter = {
  fetch: (id: number, signal?: AbortSignal) => Promise<TitleDetail>;
  title: (d: TitleDetail) => string;
  year: (d: TitleDetail) => string | undefined;
  metaMiddle: (d: TitleDetail) => string | null;   // runtime | seasons
  facts: (d: TitleDetail) => Fact[];               // director for film, seasons/status for TV
};
```

Both route files then become four lines: `export default function Page() { const { id } =
useParams(); return <TitleDetail type="movie" id={Number(id)} />; }`.

Do this **after** item 8, so the shared component already uses `useTitleActions`.

---

## 10. Two primitives that should exist and do not

### 10a. `focusRing` is redeclared verbatim in 12 files

The exact string

```
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
```

appears as a local `const focusRing` in:

```
src/app/page.tsx
src/app/(main)/settings/page.tsx
src/app/(main)/user/[id]/page.tsx
src/app/(main)/friends/page.tsx
src/components/movie/PosterRail.tsx
src/components/home/NowShowing.tsx
src/components/movie/TitleHero.tsx
src/components/movie/TrailerList.tsx
src/components/movie/MovieCard.tsx
src/components/movie/StarRating.tsx
src/components/layout/Navbar.tsx
src/components/movie/ReviewCard.tsx
```

(Plus inline copies in `Button.tsx`, `Modal.tsx`, `Toast.tsx`, `WhereToWatch.tsx`,
`tubelight-navbar.tsx`, and the skip-link in `app/layout.tsx`.)

Two variants exist — most use `ring-offset-ink`, but `StarRating.tsx` and `ReviewCard.tsx` use
`ring-offset-velvet` because they sit on a raised surface. Preserve that distinction.

**Fix:** add to `@layer components` in `globals.css`:

```css
.focus-ring { @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink; }
.focus-ring-raised { @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-velvet; }
```

Then delete all 12 declarations and replace usages with the class name.

### 10b. A `SectionHeading` component

The string `text-[13px] font-semibold uppercase tracking-[0.08em] text-fog` is copy-pasted across
**8 files** (`movie/[id]`, `tv/[id]`, `CastStrip`, `TitleFacts`, `WhereToWatch`, `ReviewsSection`,
`friends/page.tsx`, `TrailerList`). Several call sites additionally hand-roll a count badge with
the same ad-hoc markup, e.g.:

- `ReviewsSection.tsx:22` — `<span className="ml-2 font-mono normal-case tracking-normal">{reviews.length}</span>`
- `WhereToWatch.tsx:88` — the same pattern for the region code
- `friends/page.tsx` — the same pattern twice, once tinted `text-ticket` for pending requests

**Fix:** `frontend/src/components/ui/SectionHeading.tsx`:

```tsx
<SectionHeading count={reviews.length}>Reviews</SectionHeading>
<SectionHeading count={incoming.length} tone="urgent">Requests</SectionHeading>
<SectionHeading trailing={data.region}>Where to watch</SectionHeading>
```

Renders an `<h2>` by default with a `level` escape hatch, since some of these are inside `<section>`
and some inside sidebars.

---

## 11. 29 hardcoded pixel font sizes bypass the type scale

### Evidence

`tailwind.config.ts:65` carries the comment *"The whole type scale. Do not invent sizes outside
this list."* Yet `grep -rEo 'text-\[[0-9]+px\]' frontend/src` returns **29 matches**, including:

- `text-[14px]` — card titles (`MovieCard.tsx:161`)
- `text-[15px]` — rail section titles (`PosterRail.tsx:26,54`)
- `text-[13px]` — section headings and rail captions (many files)
- `text-[11px]` — meta captions, dock labels, filter group labels (many files)
- `text-[10px]` — the JustWatch attribution (`WhereToWatch.tsx:104`)
- `text-[22px]` — the wordmark (`Wordmark.tsx:12`)
- `text-[48px]` — the detail-page `h1` override (`TitleHero.tsx:78`)

The scale is missing the two sizes the code keeps reaching for: a ~14px card title (between `ui` 13
and `body` 15) and an ~11px caption (below `meta` 12).

### Recommended fix

Add named tokens rather than continuing to invent:

```ts
'card':    ['14px', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
'caption': ['11px', { lineHeight: '1.35', letterSpacing: '0.02em' }],
```

Then mechanically convert: `text-[14px]` → `text-card`, `text-[11px]` → `text-caption`,
`text-[13px]` → `text-ui`, `text-[15px]` → `text-body`. Leave the two deliberate one-offs
(`text-[22px]` wordmark, `text-[48px]` hero) but move them into the config as `wordmark` and
`display-hero` so nothing in `src/` uses a bracket size.

Add an ESLint rule or a CI grep asserting zero `text-\[\d+px\]` matches in `src/`, so the comment
in the config becomes enforceable rather than aspirational.

---

## 12. `StarRating` renders two different products

### Evidence — `frontend/src/components/movie/StarRating.tsx`

- Default `max = 10`.
- Lines 34-56: when interactive **and** `useIsMobile()`, it renders **ten 40px numbered buttons**.
- Lines 59-85: otherwise it renders **ten 20px stars** plus a `N/10` mono readout.

So the same rating input is a star row on desktop and a number pad on mobile — two different mental
models for one value. And ten stars reads as "five stars, all filled" at a glance, which is
actively misleading; the component's own comment concedes "Ten 16px stars is not a touch target."

### Recommended fix

Move to **5 stars with half-steps** on every viewport, while continuing to store 1–10 underneath
(no DB migration needed — `reviews.rating` stays an integer 1-10; a half star = an odd value).

- One rendering path, no `useIsMobile()` branch.
- Hit target: wrap each star in a ≥44px touch area on coarse pointers, with the left/right halves
  mapping to `2n-1` / `2n`.
- Keyboard: make the whole control a single `role="slider"` with arrow-key increments, rather than
  ten separate buttons — currently a keyboard user tabs through ten controls to set one value.
- Keep the mono `N/10` readout; it disambiguates the half-star display.
- Read-only usage (`ReviewCard.tsx`, `size="sm"`) gets the same treatment for free.

---

## 13. Delete the dead sandbox — it is the only thing importing `framer-motion`

### Evidence

Routes with no inbound links from the product:

```
src/app/aurora/            (+ layout.tsx)
src/app/beams/
src/app/lamp/
src/app/liquid-glass/
src/app/sentry-example-page/  (+ layout.tsx)
src/app/api/sentry-example-api/route.ts
```

Components only those routes use:

```
src/components/ui/Aurora.tsx
src/components/ui/aurora-background.tsx   (54 lines)
src/components/ui/beams-background.tsx    (207 lines)
src/components/ui/lamp.tsx                (104 lines)
src/components/ui/liquid-glass.tsx        (232 lines)
```

Plus the CSS that exists only for them: `globals.css:68-76` (`moveBackground`, for the liquid-glass
demo dock) and `globals.css:173-210` (the entire `.aurora` block, whose own comment reads
*"only the /aurora + /liquid-glass sandbox routes use this. Nothing in the product mounts it."*).

`SiteDockNav.tsx:18` even maintains a `HIDDEN_ON` list to keep the dock off these routes —
maintenance overhead for pages that ship to production and serve no one.

**`grep -rl 'framer-motion' frontend/src` returns exactly two files: `src/app/aurora/page.tsx` and
`src/components/ui/lamp.tsx`.** Deleting the sandbox removes the only reason `framer-motion`
(a large dependency) is in `package.json`.

### Recommended fix

1. Delete the routes and components listed above.
2. Delete `globals.css:68-76` and `globals.css:173-210`.
3. Remove the `HIDDEN_ON` array and its check from `SiteDockNav.tsx`.
4. `npm uninstall framer-motion`.
5. Also remove `addVariablesForColors` from `tailwind.config.ts:5-14` — its comment states it exists
   solely because `ui/aurora-background.tsx` reads Tailwind colours as CSS vars. With that file
   gone, the plugin injects every Tailwind colour into `:root` for nothing.
6. Decide separately on the Sentry example route — it is scaffolding from `@sentry/nextjs` setup
   and is normally deleted once Sentry is verified working.

**Caution:** keep `src/components/ui/popover.tsx` and `src/components/ui/tubelight-navbar.tsx` —
those *are* used (filter popover and mobile dock respectively).

---

## 14. Toast position collides with the navbar

### Evidence — `frontend/src/components/ui/Toast.tsx:39`

```
className="fixed top-20 right-4 z-[100] …"
```

with the comment *"Top-right so toasts never sit on the mobile dock."*

`top-20` = 80px, which clears the 64px (`h-16`) sticky navbar by 16px — but the navbar is
`z-40` and the toast is `z-[100]`, so any layout change to the bar height causes an overlap.
More importantly, on mobile the toast lands at the top-right corner, the furthest point from
the thumb, for messages that are almost always a response to a thumb action
("Added X to Favorites").

### Recommended fix

- Mobile: bottom-centre, offset above the dock (the dock is `bottom-0 mb-5` per
  `tubelight-navbar.tsx`, so roughly `bottom-24`).
- Desktop: bottom-right.
- Derive the offset from a shared constant rather than a magic number, so the dock height and the
  toast offset cannot drift.

Also worth fixing while in the file: `Toast.tsx:24` uses `Math.random().toString(36)` for ids —
use `crypto.randomUUID()`. And the auto-dismiss `setTimeout` is never cleared on unmount.

---

# Appendix — things that are already right, do not "fix" them

- The colour system, type pairing, and the "posters carry the colour" rule. Keep.
- `EmptyState` — a display headline, one line of Manrope, one tungsten button, no 64px faded icon.
  This is the right pattern; keep using it.
- `Modal` — implements focus trap, focus restore, Escape, and body scroll lock correctly. Do not
  replace it with a library.
- The hover-only-on-fine-pointer discipline in `globals.css:152-157`. Preserve it in every new
  component.
- `PosterRail` — native scroll-snap with chevrons gated behind `[@media(pointer:fine)]`. Correct.
- The `savedToMovie()` adapter in `lib/api.ts` that lets saved rows reuse `MovieCard`. Good reuse.
- `/list/[shareId]` — the overlapped, masked poster header is the best-composed page in the app.
- Skip link in `app/layout.tsx` and the `aria-label`/`aria-current` coverage throughout. Keep.
- `queryConfig.ts` centralised stale times. Keep, and use it for any new query.

# Movielly — UI / UX / Visual Design Recommendations

**Purpose:** Implementation brief for another LLM. Follow this document exactly. Do not invent a second visual system. Do not keep the current “generic dark SaaS + Aceternity effects” look.

**Product:** Movielly — movie and TV discovery, trailers, ratings/reviews, a watched log, favorites, and friend sharing.

**Audience:** People who already care about films. They arrive to *find something to watch* and *claim taste*, not to use a dashboard.

**Single job of the site:** Make a title feel like a night at the cinema — then let the person save it, rate it, or send it to a friend in one tap.

---

## 0. How to implement this

1. Change tokens and type first (`tailwind.config.ts`, `globals.css`, `layout.tsx`). Every later change must read from those tokens.
2. Then navigation architecture (this is a UX change, not just styling).
3. Then Home (the attention surface).
4. Then `MovieCard` + grids (the most-seen component).
5. Then title detail (`movie/[id]`, `tv/[id]`).
6. Then lists, friends, auth, empty/error states.
7. Verify every route listed in §16. Respect `prefers-reduced-motion`. Do not add new animation libraries.

**Do not** restyle by sprinkling more `glass`, more gradients, or more glow. The current site already has too many effects fighting each other.

---

## 1. What is wrong today (audit)

Read this before changing anything. These are the problems the new design is solving.

### Visual identity
- Palette is default Tailwind blue (`#3b82f6`) on cool navy surfaces. It reads as a SaaS admin, not a film product.
- Type is Inter for everything. No display voice. Titles and UI look the same.
- Movie card titles use a blue→purple gradient (`from-blue-300 to-purple-400`). This is a generic AI-generated look. Kill it.
- Three separate token systems coexist: custom `surface`/`brand`/`gold`, shadcn HSL vars, and raw Tailwind `slate`/`gray`/`neutral`. Pick one.

### Too many effects, no signature
The page currently stacks:
- a full-viewport canvas beam field (`SiteBackground`)
- an Aceternity lamp hero (`LampContainer`, `min-h-[52rem]`)
- liquid-glass on search, tabs, dock, friends, settings
- a tubelight dock *and* a sticky top navbar

The result is busy, not cinematic. Posters — the one thing this product owns — are buried under chrome.

### Home
- Hero is 52rem tall with a decorative cone of light and a generic headline (“Your cinema and TV shows universe / All in one place.”).
- Grid is pulled up with `-mt-48`, which is a layout hack and breaks at some viewport heights.
- After the hero, the page is a single 5-column dump of whatever the tab returns. No featured title. No editorial rows. No reason to stay.

### Navigation
- Logged-in desktop users see **Watchlist / Favorites / Friends twice**: once in the top bar, once in the bottom dock.
- The dock is forced to the bottom on all breakpoints via `sm:top-auto sm:bottom-0`, fighting the component’s default (top on desktop).
- Toasts sit at `bottom-4 right-4` and collide with the dock.
- Footer adds `pb-24` solely to clear the dock. That is a smell that the chrome is too heavy.

### Cards
- Each card is a padded, bordered, blurred mini-panel (`rounded-3xl border … p-2 backdrop-blur`). The poster is inset. Density is low; a 5-column grid still feels sparse.
- Film/TV pills on every card compete with the poster.
- Hover actions are fine; the rest of the chrome is not.

### Lists
- Watchlist and Favorites are identical flat rows (tiny 48px poster + text + trash). They do not feel like a collection of films.
- Copy contradiction: the nav says **Watchlist**, the toast says **“Marked as watched”**, the subtitle says **“Movies & shows you’ve watched.”** This is a watched log mislabeled as a watchlist. Letterboxd users will be confused.

### Detail pages
- Movie and TV pages do not share a layout. TV has no similar-titles rail and dumps everything in one column.
- Backdrop is only 18–24rem tall, then a hard fade to a form-like page of `bg-surface-700` boxes.
- Action row is four same-size buttons. Nothing is the primary act.
- Cast is a grid of small cards with circular avatars — social-app pattern, not a credits roll.

### Auth / chrome leftovers
- Auth form is a generic `bg-surface-800` card. The poster wall on the right is the only good idea and it is hidden on mobile.
- Demo routes still ship: `/aurora`, `/beams`, `/lamp`, `/liquid-glass`, `/sentry-example-page`. Hide them from production or delete the pages if unused.

### Accessibility / quality floor
- No skip link.
- Focus rings are missing on most icon buttons and dock items.
- 10-star rating is a row of 10 tiny stars — hard to tap on mobile.
- Native `<select>` for year looks out of place inside the glass popover.

---

## 2. Design direction (lock this)

**Name:** Late-night cinema. Not a dashboard. Not a neon nightclub. A warm-dark theater after the house lights drop.

**One signature (spend the boldness here):**
The home page opens on a **Now Showing** hero: the week’s top trending title as a full-bleed backdrop, with the title set in a high-contrast display serif like a film-festival poster. One primary action. Everything below is quiet horizontal poster rails.

**What stays quiet:**
Surfaces, lists, forms, nav, settings. No extra glow. No extra glass. No extra gradients on text.

**What this is not (reject if you drift here):**
- Cream background + terracotta + “friendly” serif (AI default #1)
- Near-black + acid green or vermilion (AI default #2)
- Broadsheet / hairline newspaper layout (AI default #3)
- More Aceternity/Magic-UI demos (lamp, aurora blobs, beams, tubelight) as the brand
- Inter + `#3b82f6` + purple gradient titles (current look)

---

## 3. Design tokens

Replace the current `surface` / `brand` / `gold` scale and the shadcn HSL vars so they all point at this palette. After this, **no raw `slate-*`, `gray-*`, `neutral-*`, `blue-*`, or `sky-*` in components.** Use the named tokens.

### 3.1 Color

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0B0A09` | Page background. Warm black, not navy. |
| `velvet` | `#161310` | Raised surface (cards, dropdowns, inputs). |
| `seat` | `#211C18` | Hover / inset well. |
| `rail` | `#2C261F` | Borders, hairlines. |
| `fog` | `#8A8278` | Secondary text, captions, placeholders. |
| `screen` | `#F3EDE3` | Primary text. Warm off-white, like a lit screen. |
| `tungsten` | `#E0A84A` | The *only* accent. Ratings, primary CTA, active tab, focus. Theater-bulb gold. |
| `tungsten-dim` | `#B07E2C` | Pressed / dark gold. |
| `ticket` | `#C23B3B` | Favorites heart, destructive, incoming-request urgency. |
| `ticket-dim` | `#8E2A2A` | Pressed ticket red. |

**Rules**
- Posters carry color. The UI does not.
- Do not introduce a second brand blue. Drop `#3b82f6` / `brand` / `brand-light` / `brand-dark`.
- Film vs TV is **not** color-coded blue vs brand. Use a 10px caption under the title (`Film` / `Series`) in `fog`, or a 1px corner tick. Never a saturated pill on the poster.
- Gold is for *judgment* (ratings) and *the one action*. Red is for *love / danger*. Nothing else gets a saturated color.
- Glass, if used at all, is a 12–16px blur over `ink` at 55–70% opacity, 1px `rgba(243,237,227,0.08)` border. No brand-tinted inner glow.

Map the existing Tailwind keys so you do not have to rewrite every class on day one, then migrate:

```ts
// tailwind.config.ts — theme.extend.colors
ink: '#0B0A09',
velvet: '#161310',
seat: '#211C18',
rail: '#2C261F',
fog: '#8A8278',
screen: '#F3EDE3',
tungsten: { DEFAULT: '#E0A84A', dim: '#B07E2C' },
ticket: { DEFAULT: '#C23B3B', dim: '#8E2A2A' },

// keep these aliases during migration, then delete
surface: { 900: '#0B0A09', 800: '#161310', 700: '#211C18', 600: '#2C261F', 500: '#3A3229' },
brand: { DEFAULT: '#E0A84A', light: '#E0A84A', dark: '#B07E2C' },
gold: { DEFAULT: '#E0A84A', light: '#E8C27A' },
```

Update `globals.css` semantic vars:

```css
:root {
  color-scheme: dark;
  --background: 30 8% 4%;          /* ink */
  --foreground: 36 33% 92%;        /* screen */
  --primary: 38 71% 58%;           /* tungsten */
  --primary-foreground: 30 8% 4%;  /* ink on gold */
  --muted: 30 14% 11%;             /* velvet */
  --muted-foreground: 32 7% 51%;   /* fog */
  --border: 30 16% 15%;            /* rail */
  --popover: 30 14% 11%;
  --popover-foreground: 36 33% 92%;
}
```

Primary buttons become **ink text on tungsten**, not white on blue.

```
bg-tungsten text-ink hover:bg-tungsten-dim
```

### 3.2 Type

Load from Google Fonts in `frontend/src/app/layout.tsx`. Remove Inter.

| Role | Face | Weights | Use |
|---|---|---|---|
| Display | **Bodoni Moda** | 500, 600 italic | Page titles, Now Showing title, auth headline, empty-state headline. Tight tracking on large sizes (`tracking-tight`). Never for buttons or nav. |
| Body / UI | **Manrope** | 400, 500, 600, 700 | Everything else: nav, buttons, overview, forms, card meta. |
| Data | **IBM Plex Mono** | 400, 500 | Year, runtime, vote counts, `8.4`, `3h 12m`, share-list index numbers. Tabular, clapboard energy. |

Type scale (use these, do not invent others):

| Name | Size / line / tracking / face |
|---|---|
| `display-xl` | 64px / 1.05 / -0.03em / Bodoni Moda 500 — Now Showing title, desktop only |
| `display-lg` | 40px / 1.1 / -0.02em / Bodoni Moda 500 — page H1, mobile hero |
| `display-md` | 28px / 1.15 / -0.015em / Bodoni Moda 500 — section titles on detail |
| `title` | 18px / 1.3 / -0.01em / Manrope 600 — card titles, list titles |
| `body` | 15px / 1.6 / 0 / Manrope 400 — overview, reviews |
| `ui` | 13px / 1.4 / 0.01em / Manrope 500 — buttons, tabs, nav |
| `meta` | 12px / 1.4 / 0.04em / IBM Plex Mono 400 — year, runtime, rating |

**Title treatment:** Now Showing and detail-page H1 use Bodoni Moda. If the TMDB title is ALL CAPS, leave it; do not title-case it. Taglines stay italic Manrope in `fog`, never italic Bodoni (too precious).

### 3.3 Space, radius, elevation

| Token | Value | Use |
|---|---|---|
| Page gutter | 20px mobile / 32px desktop | `px-5 sm:px-8` |
| Content max | 1280px | `max-w-7xl` stays |
| Rail gap | 12px mobile / 16px desktop | poster-to-poster |
| Radius poster | 6px | posters, thumbnails — almost sharp, like a print |
| Radius control | 999px | pills, search, dock, primary buttons |
| Radius panel | 16px | modal, dropdown, form card |
| Elevation | none on rest; `0 24px 48px -24px rgba(0,0,0,0.65)` on hover poster and modal only |

No `rounded-3xl` cards. No 24px radius on posters.

### 3.4 Motion

Keep `framer-motion` (already a dependency). Do not add Lottie or extra animation kits.

| Event | Motion |
|---|---|
| Now Showing enter | Backdrop fades 400ms. Title rises 12px → 0 over 600ms, 80ms delay. CTA 120ms after title. Once. |
| Poster hover (pointer: fine) | Scale 1.04, 200ms ease-out. Soft shadow. No border-color flash. |
| Rail scroll | Native overflow-x, scroll-snap, hide scrollbar. Optional fade masks on left/right edges. |
| Page change | No full-page fade. Detail backdrop crossfades if coming from a card. |
| Dock active | Existing `layoutId` slide is fine; restyle colors to tungsten. |
| Reduced motion | Disable beams (already), lamp (will be gone), poster marquee, hero rise, hover scale. Instant state changes only. |

Do **not** animate every card in with `opacity 0 → 1, y: 20` on a 20-item grid. That is the current `MovieCard` behavior and it stutters. Animate the first visible row only, or nothing.

---

## 4. Signature layout concepts

### 4.1 Home — Now Showing + rails (replace the lamp + dump)

```
┌─────────────────────────────────────────────────────────────┐
│  top bar: wordmark                          search   avatar │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   NOW SHOWING                                               │
│   [full-bleed backdrop, ~72vh, bottom-heavy gradient]       │
│                                                             │
│   Dune: Part Two                                            │
│   2024  ·  Film  ·  2h 46m  ·  ★ 8.4                        │
│   [ Watch trailer ]   +  Watched   ♡                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Trending this week                          View all →     │
│  [poster][poster][poster][poster][poster]   →               │
│                                                             │
│  Popular films                                              │
│  [poster][poster][poster][poster][poster]   →               │
│                                                             │
│  Popular series                                             │
│  [poster][poster][poster][poster][poster]   →               │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Title detail — still from the film, then credits

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                                     │
│  [backdrop 70vh]                                            │
│     poster   TITLE                                          │
│              meta  ·  genres as text, not chips             │
│              [ Trailer ]  Watched  ♡  Review                │
├──────────────┬──────────────────────────────────────────────┤
│ Overview     │  Where to watch                              │
│ Cast strip → │  Director / runtime / status                 │
│ Trailers     │                                              │
│ Reviews      │  More like this (poster rail)                │
└──────────────┴──────────────────────────────────────────────┘
```

### 4.3 Collection pages (Watched / Favorites)

```
┌─────────────────────────────────────────────────────────────┐
│  Favorites                           14 titles    Share     │
│  [poster][poster][poster][poster][poster][poster]           │
│  [poster][poster][poster][poster]                           │
└─────────────────────────────────────────────────────────────┘
```

Poster grid, not a settings-style list. Hover or tap reveals title + remove.

---

## 5. Navigation architecture

This is the highest-leverage UX change.

### 5.1 One chrome system, not two

**Desktop (≥768px)**
- Keep a thin sticky top bar. Remove Watchlist / Favorites / Friends links from it.
- Top bar contents: wordmark (left) · search (center, max 420px) · avatar / Log in + Sign up (right).
- **Remove `SiteDockNav` on desktop.** The dock fighting `sm:top-auto` exists only because the top bar already has those links.

**Mobile (<768px)**
- Top bar: wordmark + avatar (or Log in). No search field in the bar on `/`. Search lives in the hero / a sticky compact search under the hero after scroll.
- Keep the bottom dock for Home / Watched / Favorites / Friends. This is the right pattern on a phone.
- Hide the hamburger menu’s duplicate of those four links. The hamburger, if it remains, only needs Settings + Sign out.

### 5.2 Wordmark

Replace `Clapperboard` + “Movielly” in Inter bold.

- Wordmark in Bodoni Moda italic, 22px, `screen`.
- Optional 6×6px tungsten square before the name (a ticket stub punch), not a Lucide icon.
- Do not use a clapperboard, film-strip, or popcorn icon. Those are clip-art.

### 5.3 Search

- Home, logged-out or no query: large search in the Now Showing block (or just under it). Pill shape, velvet fill, 1px rail border, Manrope, tungsten Search button.
- Other pages: compact pill in the top bar (already the pattern). Restyle to the new tokens.
- Filters stay in a popover, but:
  - Replace the native `<select>` year control with a scrollable year list matching the genre list.
  - Active filters become removable tungsten chips under the search (`Drama ×`, `2023 ×`, `Top rated ×`), not only a count badge.
  - Type filter (All / Films / Series) should not duplicate the Trending / Movies / TV tabs. Pick one. Recommendation: **delete the three tabs**. Type lives in Filters. The page below is rails, not a tabbed dump.

### 5.4 Dock restyle (mobile only)

File: `frontend/src/components/ui/tubelight-navbar.tsx` + `SiteDockNav.tsx`.

- Render `SiteDockNav` only when `window.matchMedia('(max-width: 767px)')` (or a `useMedia` hook). Do not mount it on desktop.
- Track: `ink/80`, blur 16px, 1px `rail`, no “tubelight” cyan halo.
- Active item: tungsten underline 2px × 16px, text `screen`. Inactive: `fog`.
- Labels on mobile too if there is room; otherwise icons + `aria-label`.
- Move toasts to `top-20 right-4` so they never sit on the dock.

### 5.5 Footer

One line is fine. Tighten: remove `mt-16 pb-24` when the desktop dock is gone. On mobile keep `pb-24`. Text in `fog`, 12px. “Movie data from TMDB” can stay; add “Streaming data from JustWatch” only on detail pages (already there).

---

## 6. Home page — make this the attention surface

File: `frontend/src/app/page.tsx`.

### 6.1 Delete the lamp

Remove `LampContainer` from the home page. Do not keep it “just in case.” The `/lamp` demo page can stay as a sandbox or be deleted.

### 6.2 Now Showing hero

**Data:** first item from the existing `movieApi.trending('week', 'all')` that has a `backdrop_path`. Fallback: first popular movie with a backdrop.

**Layout**
- Height: `min(72vh, 760px)` desktop, `min(78vh, 640px)` mobile.
- Full-bleed `next/image` backdrop, `object-cover`, `priority`.
- Scrim: `linear-gradient(to top, ink 0%, ink 18%, transparent 62%)` plus a left-side `linear-gradient(to right, ink 0%, transparent 55%)` so the title is always readable.
- Do **not** put a solid `bg-surface-900` lamp slab behind this. The backdrop *is* the background. `SiteBackground` beams must not show through the hero.

**Content (bottom-left, max-width 720px)**
- Eyebrow in IBM Plex Mono, 11px, tracking 0.16em, uppercase, tungsten: `NOW SHOWING`
- Title in Bodoni Moda `display-xl` / `display-lg`, `screen`. Two-line clamp max.
- Meta row in Plex Mono `meta`: `2024  ·  Film  ·  ★ 8.4` (omit runtime if the trending payload does not include it — do not extra-fetch just for this).
- Actions:
  1. Primary: `Watch trailer` (tungsten pill) — only if trailers exist; otherwise `View title` linking to the detail page.
  2. Ghost: watched toggle (bookmark icon + label).
  3. Ghost: favorite heart.
- Do **not** put the search bar on top of the backdrop. Search sits in a 24px gap *below* the hero, centered, max-width 640px. This keeps the still clean.

**Copy (replace the current headline)**
- Delete “Your cinema and TV shows universe / All in one place.”
- Delete the sparkles pill “Discover your next favorite.”
- The Now Showing title *is* the headline. No marketing sentence on top of it.
- Optional one-line under the meta, 15px Manrope `fog`, pulled from `overview` clamped to 140 characters. If missing, omit. Do not write a new slogan.

### 6.3 Search + filters (below the hero)

Keep the current filter popover behavior (type, sort, year, genre). Restyle to velvet / rail / tungsten. When a search query or any filter is active:

- Hide the Now Showing hero.
- Show a compact page header: `Results for “dune”` in Bodoni Moda `display-md`, plus removable filter chips.
- Results render as the **poster grid** in §7.3, not rails.

When idle (no query, no filters): do not show a tabbed grid.

### 6.4 Editorial rails (idle home)

Three rails, in this order:

| Rail | Source (already in `lib/api.ts`) |
|---|---|
| Trending this week | `movieApi.trending('week', 'all')` — skip the title used in Now Showing |
| Popular films | `movieApi.popular('movie')` |
| Popular series | `movieApi.popular('tv')` |

Each rail:
- Section label: Manrope 600, 15px, `screen`. Right-aligned `View all` in `fog` → `screen` on hover. “View all” applies the matching type filter and scrolls to a grid (or routes `/?tab=movies` if you keep a query param).
- Horizontal scroller of posters (see §7). `scroll-snap-type: x mandatory`. Peek the next poster (do not align so the last visible card is flush).
- 12–16 items. No “load more” on the rail.

Do not add numbered markers (01 / 02 / 03). These are not a sequence.

### 6.5 Logged-in personalization (small, high value)

If the user has ≥1 favorite or watched title, insert a fourth rail **above** Trending:

- Label: `Because you saved {Title}` or simply `Your shelf` if you do not want to compute similarity.
- If similar-titles API is easy (`movieApi.similar` already exists on detail), pick the most recently favorited title and fetch similar. If that is too much for this pass, skip the rail. Do not fake it with random popular items labeled “For you.”

---

## 7. Movie card and grids

Files: `frontend/src/components/movie/MovieCard.tsx`, `MovieGrid.tsx`.

### 7.1 The card is the poster

The card should be:

```
[ poster 2:3, 6px radius ]
Title          ← Manrope 600, 13–14px, screen, 1-line clamp
2024  ·  8.4   ← Plex Mono 12px, fog
```

**Remove**
- The padded black panel (`p-2`, `border-gray-800`, `bg-black/80`, `rounded-3xl`).
- The blurred echo image behind the poster.
- The Film / TV pill on the poster.
- The rating pill on the poster.
- Gradient text on the title.
- Per-card `motion` mount animation.
- The extra `whileHover` border-color change.

**Keep / refine**
- Whole card is a `<Link>` to `/movie/:id` or `/tv/:id`.
- Hover (fine pointer): poster scales to 1.04 inside `overflow-hidden`.
- Favorite + watched icon buttons overlay the **bottom-right of the poster** on hover (always visible on coarse pointers, as today).
  - Idle: 32px circle, `ink/70`, 1px `rgba(243,237,227,0.15)`, icon `screen`.
  - Active favorite: fill `ticket`, icon white.
  - Active watched: fill `tungsten`, icon `ink`.
- `alt` on the poster is the title. Decorative glow images are gone, so no empty `alt=""`.

Media type, if needed, is a 11px `fog` word after the year (`2024 · Series`), not a badge.

### 7.2 Two layouts from one component

Add a `variant` prop:

```ts
variant?: 'poster' | 'rail' | 'row'
```

- `poster` — default, used in search results and collection grids.
- `rail` — same as poster, no title under the image on viewports ≥768px (Netflix density). Title appears in a 0→1 opacity caption on hover. On mobile, keep the title under the poster (hover does not exist).
- `row` — reserved for dense admin-like places (friend request context). 40px poster + title + year. Do not use this as the default for Watched/Favorites.

### 7.3 Grid

`MovieGrid`:
- Search / filtered results: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4`.
- Collection pages (Watched, Favorites): same grid.
- Skeleton: poster-shaped bones (`aspect-[2/3] bg-velvet rounded-[6px]`), no fake title bars if you can avoid them. 12 skeletons, not 10.

Empty state: see §12.

### 7.4 New `PosterRail` component

Create `frontend/src/components/movie/PosterRail.tsx`.

```tsx
<PosterRail title="Trending this week" href="/?filter=trending" movies={movies} />
```

- Heading row + horizontal `MovieCard variant="rail"`.
- Buttons on desktop edges (chevron) that `scrollBy({ left: containerWidth * 0.8 })`. Hidden on touch.
- `aria-label` on the scroller: the rail title.

---

## 8. Title detail (movie + TV)

Files: `frontend/src/app/(main)/movie/[id]/page.tsx`, `frontend/src/app/(main)/tv/[id]/page.tsx`.

**Unify these.** Extract `TitleHero`, `TitleActions`, `CastStrip`, `ReviewsSection` into `frontend/src/components/movie/`. TV and movie should only differ in data (seasons vs runtime, “Season trailers” vs “Trailers”). TV must get a “More like this” rail; the movie page already has similar titles.

### 8.1 Hero

- Backdrop height `min(70vh, 720px)`. Same dual scrim as Now Showing.
- Poster overlaps the bottom of the backdrop: 160px wide mobile, 200px desktop, 6px radius, 1px `rgba(243,237,227,0.12)` ring. No `border-2 border-surface-600`.
- Title: Bodoni Moda, `display-lg` / 48px desktop.
- Meta: Plex Mono. `2024  ·  2h 46m  ·  ★ 8.4 (12,481)` — the count in `fog`.
- Genres: plain `fog` text separated by a middot (`Drama · Science Fiction · Adventure`). **Not** chips.
- Tagline: italic Manrope, `fog`, under the meta. One line.
- Back control: text button `← Back` top-left, `screen` on `ink/40` blur pill. Keep `router.back()`.

### 8.2 Actions (one primary)

Order, left to right:

1. **Watch trailer** — tungsten, only if a trailer exists. Opens the existing modal.
2. **Watched** — ghost; filled tungsten when on.
3. **Favorite** — ghost heart; filled ticket when on.
4. **Review** — ghost; if the user already reviewed, label becomes `Your review · 8/10`.

Do not render two primary (`variant="primary"`) buttons at once, which the movie page does today (trailer + mark watched).

### 8.3 Body

Two columns from `lg`:

**Main (2/3)**
- Overview: `display-md` “Overview” is too loud. Use a Manrope 600 13px uppercase tracked label in `fog`, then the paragraph in `body` / `screen`.
- Cast: **horizontal strip**, not a 2×4 card grid. 72px circular still (or 2:3 headshot if you prefer consistency with posters — pick circular, 64px). Name + character under, 12px. Scrolls sideways.
- Trailers: keep `TrailerList`, but make the first trailer a large 16:9 thumbnail if there are 2+. Heading: “Trailers” or “Season trailers” — drop the parenthetical “(Franchise)”.
- Reviews: see §8.5.

**Side (1/3)**
- `WhereToWatch` restyled to velvet panel, 16px radius, no heavy border. Provider logos 40px, 6px radius. Keep JustWatch attribution.
- Facts (director, status, seasons): definition list, label `fog` / value `screen`, no box if the Where-to-watch card already provides a surface — stack them in one panel titled `Details`.
- More like this: `PosterRail` of 8–12 similar titles, vertical stack of 2 columns only if you cannot fit a rail in the sidebar. Prefer a full-width rail *under* both columns so posters stay large.

### 8.4 Loading / not found

- Loading: full-width backdrop bone + poster bone + 3 text bones. Do not use a 72px navy bar.
- Not found: Bodoni “This title isn’t in the house.” + link home. See §12.

### 8.5 Reviews

- `ReviewCard`: velvet panel, no hard border (or 1px `rail`). Avatar 36px. Name Manrope 500. Time Plex Mono 11px `fog`. Stars stay but use tungsten. Body `body`.
- Empty: do not use a large outlined box with a huge star icon. One sentence + tungsten `Write a review` button.
- Modal: velvet, 16px radius. Replace 10 individual stars on mobile with a **horizontal 1–10 stepper** (tap a number). Keep stars on desktop if you want; they must be ≥24px hit targets (`size="lg"` is 24px — bump interactive stars to 28px).

---

## 9. Watched and Favorites

Files: `watchlist/page.tsx`, `favorites/page.tsx`.

### 9.1 Rename the concept

The feature is a **watched log**, not a to-watch list.

| Surface | New copy |
|---|---|
| Nav / dock | `Watched` (icon can stay `BookmarkCheck`) |
| Page H1 | `Watched` |
| Subtitle | `Titles you’ve finished.` |
| Card action (off) | `Mark watched` |
| Card action (on) | `Watched` |
| Toast add | `Marked {title} as watched` |
| Toast remove | `Removed {title} from Watched` |
| Empty | `Nothing watched yet.` + `Browse titles` |

Keep the `/watchlist` route to avoid breaking links. Change the visible word only.

Favorites copy is already clear. Keep `Favorites`. Share button becomes a tungsten-outline pill, not `variant="secondary"` gray.

### 9.2 Collection layout

Both pages:

- Header: Bodoni `display-md` title + Plex Mono count (`14 titles`) + Favorites-only Share action.
- Body: `MovieGrid` of the saved posters (you already store `movie_poster`, `movie_title`, `movie_type`, `movie_id`). Map each item into a `Movie` stub and reuse `MovieCard`.
- Remove the 48px-poster list rows.
- Watchlist review accordion: move it. On Watched, a small Plex Mono `8/10` under the title if a review exists; tap the card to go to the title (where they edit the review). Do not nest an accordion inside a poster grid.

Empty states: §12.

Share modal: velvet, the URL field in `seat` with a tungsten `Copy` button. Title: `Share this list`. Body: `Anyone with the link can see these favorites.`

---

## 10. Friends, profiles, shared lists

### 10.1 Friends (`friends/page.tsx`)

This page is closer than the others. Keep the structure. Restyle:

- Page H1 Bodoni. Username hint in Manrope: `Friends add you as @{username}`.
- Add-friend field: velvet pill, not liquid-glass. Tungsten `Send` button.
- Incoming requests sit in a ticket-red-tinted thin left rule (4px `ticket`) so they feel urgent without a banner.
- Friend row: 40px avatar, name, bio one line. Actions as text+icon, not extra glass pills. `Watched` and `Favorites` as quiet links.
- Empty: “No friends yet. Send a username above.” No giant Users icon.

### 10.2 Friend profile (`user/[id]/page.tsx`)

- Header: 72px avatar, Bodoni `@name`, bio, Plex Mono `{n} watched`.
- Body: their watched titles as a **poster grid**, not rows. Same as §9.2.
- Private state: lock line + `You and @{name} aren’t friends.` + link back. No huge glass card.

### 10.3 Shared list (`list/[shareId]/page.tsx`)

This is the public, shareable surface. It should look like a **printed program**, not an internal list.

- Full-width header: owner avatar, `{Name}’s favorites`, Bodoni list title, Plex Mono count.
- Optional: use the first 3 posters as a tiny overlapping still behind the header (opacity 25%, masked). Attention without clutter.
- Body: **poster grid**, keep the numeric index as a Plex Mono caption on the poster (`01`, `02`) — this is one of the few places numbering encodes order the owner chose.
- Footer: `From Movielly` wordmark, not “Powered by”.

---

## 11. Auth

Files: `AuthShell.tsx`, `PosterWall.tsx`, `login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`.

**Keep** the split layout and the scrolling poster wall. It is the only current screen that already feels like the product.

**Change**
- Hide the global top navbar and footer on auth routes (the dock already hides). Auth should be immersive. Put a small wordmark above the form that links home.
- Form card: velvet, 16px radius, 1px `rail`, no heavy shadow. Inputs: `seat` fill, rail border, tungsten focus ring (`focus:ring-2 focus:ring-tungsten/30`).
- Headline: Bodoni. Login: `Back again.` Signup: `Take a seat.` Forgot: `We’ll find you.`
- Subhead: one Manrope line, `fog`.
- Primary button full-width tungsten.
- Right-side tagline (currently “Thousands of films. / One watchlist.”) →  
  **“What you watch is who you are.”**  
  Sub: `Rate it. Keep it. Pass it to a friend.`
- Mobile: no poster wall today. Add a **single** static backdrop (first popular poster, blurred, 20% opacity) behind the form so mobile is not a blank ink slab.

---

## 12. Empty, error, loading

Treat these as direction, not decoration.

| State | Copy | Action |
|---|---|---|
| Search empty | `Nothing under “{q}”.` | `Clear search` |
| Rail empty (API fail) | omit the rail entirely | — |
| Watched empty | `Nothing watched yet.` | `Browse titles` → `/` |
| Favorites empty | `No favorites yet.` | `Browse titles` |
| Friends empty | `No friends yet.` | focus the username field |
| Shared list empty | `{Name} hasn’t added favorites.` | `Go to Movielly` |
| Title 404 | `This title isn’t in the house.` | `Back to browse` |
| Route error (`error.tsx`) | `The reel snapped.` | `Try again` + `Go home` |
| Auth error | keep the existing red inline; restyle to ticket/15 background, ticket text | — |

Visual: Bodoni headline, one Manrope sentence, one tungsten button. **No 64px faded Lucide icons.** A small 20px icon next to the headline is enough if you need one.

Loading:
- Home hero: backdrop bone the same height as the real hero.
- Rails: 6 poster bones in a row.
- Spinner on auth-gated pages: replace the blue ring with a 20px tungsten arc.

Toasts:
- Velvet surface, 1px rail, 13px Manrope.
- Success: tungsten check. Error: ticket icon.
- Position `top-20 right-4`. Auto-dismiss 3.5s stays.

---

## 13. Site background and leftover effects

File: `frontend/src/components/layout/SiteBackground.tsx`.

The canvas beams are expensive and they tint every page navy-cyan. They also fight posters.

**Recommendation:** remove `SiteBackground` from `layout.tsx`.

Replace with a static page treatment in `globals.css`:

```css
html { background-color: #0B0A09; }
body {
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(224,168,74,0.06), transparent 60%),
    #0B0A09;
}
```

A barely-there tungsten bloom at the top of the page. No animation. No canvas. No blur.

**Liquid glass (`GlassEffect`, `.glass`)**
- Allowed on: nothing, by default.
- If a surface sits on a busy image (search over a still, mobile dock), use the CSS `.glass` class with the new tint (ink 60%, not white 10% + blue inner glow).
- Remove `GlassEffect` from the home tabs (tabs are gone) and from Friends / Settings. Those pages are not over imagery.

**Demo routes** (`/aurora`, `/beams`, `/lamp`, `/liquid-glass`, `/sentry-example-page`): add `robots: { index: false }` or delete if unused. Do not link them.

---

## 14. Component-level restyle notes

### Button (`components/ui/Button.tsx`)

```
primary    bg-tungsten text-ink hover:bg-tungsten-dim  (pill)
secondary  bg-transparent text-screen border border-rail hover:border-screen
ghost      text-fog hover:text-screen hover:bg-seat
danger     text-ticket hover:bg-ticket/10
```

Sizes: `sm` 32px height, `md` 40px, `lg` 48px. All pills (`rounded-full`). 13px Manrope 600. No `shadow-lg shadow-brand/25`.

### Input (`components/ui/Input.tsx`)

`bg-seat border-rail text-screen placeholder-fog rounded-xl`. Focus: `border-tungsten ring-2 ring-tungsten/25`. Error: `border-ticket`.

### Modal (`components/ui/Modal.tsx`)

Overlay `ink/70` + `backdrop-blur-sm`. Panel `velvet`, 16px radius, 1px `rail`. Title Manrope 600 16px (not Bodoni — modals are tools). Close hit area 36px.

### Navbar dropdown

Velvet, 8px radius, 1px rail. No `bg-surface-800 border-surface-600` leftover. Avatar button: 32px, 1px rail, no brand/20 wash.

### Settings (`settings/page.tsx`)

Quiet form on velvet. Page title Bodoni `Edit profile`. Camera badge on the avatar becomes tungsten, icon `ink`.

---

## 15. Accessibility and quality floor (do not skip)

- Skip link as the first child of `body`: `Skip to titles` → `#main`. Give `<main>` `id="main"`.
- Visible focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink` on every interactive element. Icon-only buttons already have `aria-label`; keep them.
- Contrast: `fog` (`#8A8278`) on `ink` is ~4.6:1 — OK for 12px+ secondary. Do not use `fog` for primary body. `screen` on `ink` is fine. Tungsten on ink for button text is fine (gold is large + bold).
- Dock and top bar: `aria-current="page"` on the active item.
- Poster rails: keyboard users can tab to each card; chevron buttons are `aria-label="Scroll {title} right"`.
- `prefers-reduced-motion`: no hero rise, no poster scale, no poster-wall marquee, no dock spring (instant).
- Trailer iframe modal: move focus into the dialog, restore on close (Modal should do this; add it if missing).
- Do not ship the 10-star control at 16px on touch devices.

---

## 16. File-by-file change map

Implement in this order. Stay inside these files unless you are extracting a shared component listed here.

| File | What to do |
|---|---|
| `frontend/tailwind.config.ts` | New palette, font families (`display`, `sans`, `mono`), drop unused `aurora` keyframes if unused after cleanup. |
| `frontend/src/app/globals.css` | New CSS vars, body background bloom, delete or idle the aurora blob CSS, restyle `.glass` to ink-tint, keep poster-scroll keyframes for auth. |
| `frontend/src/app/layout.tsx` | Bodoni Moda + Manrope + IBM Plex Mono. Remove `SiteBackground`. Skip link. `id="main"` on `<main>`. Hide navbar/footer on auth routes (pathname check via a tiny client wrapper, or a route-group layout). |
| `frontend/src/components/layout/SiteBackground.tsx` | Stop importing. File can remain unused. |
| `frontend/src/components/layout/Navbar.tsx` | Wordmark, drop the three section links, new tokens, search pill, avatar menu. |
| `frontend/src/components/layout/SiteDockNav.tsx` | Mobile-only mount. Relabel Watchlist → Watched. |
| `frontend/src/components/ui/tubelight-navbar.tsx` | Restyle to ink/tungsten. Keep `layoutId` active indicator; remove cyan halo blobs. |
| `frontend/src/components/ui/Button.tsx` | Token variants, pills, no blue shadow. |
| `frontend/src/components/ui/Input.tsx` | Token restyle. |
| `frontend/src/components/ui/Modal.tsx` | Token restyle + focus trap. |
| `frontend/src/components/ui/Toast.tsx` | Position top, new colors. |
| `frontend/src/app/page.tsx` | Now Showing + search + rails. Delete lamp, tabs, `-mt-48`. |
| `frontend/src/components/movie/MovieCard.tsx` | Poster-first rewrite, `variant` prop. |
| `frontend/src/components/movie/MovieGrid.tsx` | 6-col grid, new skeletons, new empty. |
| `frontend/src/components/movie/PosterRail.tsx` | **Create.** |
| `frontend/src/app/(main)/movie/[id]/page.tsx` | New hero, one primary action, shared sections. |
| `frontend/src/app/(main)/tv/[id]/page.tsx` | Match movie page; add similar rail. |
| `frontend/src/components/movie/TrailerList.tsx` | Restyle; drop “(Franchise)” from default heading. |
| `frontend/src/components/movie/WhereToWatch.tsx` | Velvet panel. |
| `frontend/src/components/movie/ReviewCard.tsx` | Velvet, no chip-border look. |
| `frontend/src/components/movie/StarRating.tsx` | Larger hit targets; mobile number stepper optional. |
| `frontend/src/app/(main)/watchlist/page.tsx` | Rename copy, poster grid. |
| `frontend/src/app/(main)/favorites/page.tsx` | Poster grid, share restyle. |
| `frontend/src/app/(main)/friends/page.tsx` | Drop glass, request urgency, copy. |
| `frontend/src/app/(main)/user/[id]/page.tsx` | Poster grid of their watched. |
| `frontend/src/app/(main)/list/[shareId]/page.tsx` | Program-style header, poster grid, numbered captions. |
| `frontend/src/app/(main)/settings/page.tsx` | Quiet form. |
| `frontend/src/components/auth/*` + auth pages | Hide chrome, new headlines, mobile backdrop. |
| `frontend/src/app/error.tsx` | New copy + tokens. |

Do not restyle backend files. Do not add new pages.

---

## 17. Copy deck (use these strings)

Voice: short, specific, a little dry. No exclamation marks except a saved review. No “Discover your next favorite.” No sparkles emoji in the UI.

| Place | Copy |
|---|---|
| Document title (keep) | `Movielly — Discover, Review & Share Movies` |
| Now Showing eyebrow | `NOW SHOWING` |
| Search placeholder | `Search a film or series` |
| Search button | `Search` |
| Filter trigger | `Filters` |
| Clear filters | `Clear filters` |
| Rail 1 | `Trending this week` |
| Rail 2 | `Popular films` |
| Rail 3 | `Popular series` |
| Primary detail CTA | `Watch trailer` |
| Watched off / on | `Mark watched` / `Watched` |
| Favorite off / on | `Favorite` / `Favorited` |
| Review off / on | `Write a review` / `Your review · {n}/10` |
| Login H1 | `Back again.` |
| Signup H1 | `Take a seat.` |
| Auth panel H2 | `What you watch is who you are.` |
| Watched empty | `Nothing watched yet.` |
| Favorites empty | `No favorites yet.` |
| Title 404 | `This title isn’t in the house.` |
| App error | `The reel snapped.` |
| Share modal | `Share this list` |
| Shared footer | `From Movielly` |
| Sign up (nav) | `Sign up` |
| Log in (nav) | `Log in` |

Buttons say what happens: `Save review`, `Send request`, `Copy link`. Not `Submit`.

---

## 18. What success looks like

A stranger lands on `/` and, in under two seconds, sees a real film still, a real title in a display face, and one obvious next step. The rest of the site is the same quiet room: warm black, gold for judgment, red for love, posters uncropped by chrome.

If a screenshot of a page could be mistaken for a Tailwind UI dashboard, a Letterboxd clone with blue buttons, or an Aceternity landing demo, it is not done.

---

## 19. Out of scope (do not do in this pass)

- Light mode.
- New features (recommendations engine, continue-watching, notifications, lists beyond favorites).
- Replacing TMDB imagery with generated art.
- Rewriting the API or auth.
- Adding another animation or component library.
- Redesigning the Sentry example pages.

---

## 20. Implementation checklist for the other LLM

- [ ] Tokens and fonts live in config + `globals.css`; no leftover `#3b82f6` or Inter.
- [ ] `SiteBackground` unmounted. Lamp gone from home.
- [ ] Desktop: no dock. Mobile: dock only, labeled Home / Watched / Favorites / Friends.
- [ ] Home idle = Now Showing + 3 rails. Home search = poster grid.
- [ ] `MovieCard` is poster-first; no gradient titles, no type pills on the art.
- [ ] Movie and TV detail share a layout; one primary button; similar rail on TV.
- [ ] Watched + Favorites are poster collections; visible name is Watched.
- [ ] Auth hides site chrome; new headlines; poster wall kept on desktop.
- [ ] Skip link, focus rings, reduced motion, toasts do not cover the dock.
- [ ] Copy matches §17.
- [ ] Verify in a browser: `/`, search, `/movie/:id`, `/tv/:id`, `/watchlist`, `/favorites`, `/friends`, `/login`, `/signup`, a shared `/list/:id`, mobile width 390 and desktop 1280.

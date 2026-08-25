# Movielly — Improvements & Feature Backlog

A running list of improvements and features for Movielly (backend, frontend, fixes, new
capabilities). Built from a scan of the current codebase (Next.js 16 frontend, Express
backend, Supabase).

This backlog **excludes** work already shipped: the entire `UI-UX-RECOMMENDATIONS.md`
visual redesign, and the `UI_REDESIGN_PLAN.md` punch-list items already done (URL filter
state, infinite scroll, SideRail nav, `useTitleActions`, unified `TitleDetail`,
`focus-ring`, `SectionHeading`, toast placement, etc.). Only genuinely-open threads are here.

**How to use:** toggle `[ ]` → `[x]` as items ship. Priority tags — **P1** (high value /
low cost), **P2** (worthwhile), **P3** (nice-to-have / larger).

---

## 1. Testing & Quality

- [x] **P1 — Frontend has zero tests.** ~~Add Vitest + React Testing Library.~~ Vitest stood up (`vitest.config.ts`, `npm test`/`test:watch` scripts) with a first suite covering the `lib/api.ts` adapters (`getMovieTitle`, `getYear`, `savedToMovie`) — 8 tests passing. _Next: extend to `lib/utils.ts` and the `useTitleList` membership cache (add RTL when component tests are needed)._
- [x] **P2 — Backend service tests missing on the fragile code.** ~~`trailer.service.js` … untested.~~ The trailer service is now exercised end-to-end via `test/integration.test.js` (TMDB videos + YouTube oEmbed mocked with `nock`, asserting the first playable video is returned). _Pure ranking/cache logic was already covered._
- [x] **P2 — No HTTP-level/integration tests.** ~~Add `supertest`~~ — `test/integration.test.js` (supertest + nock) covers health, search validation + proxy + cache MISS→HIT, genres, a TMDB 404 passthrough, and the trailer route. No network is hit.
- [x] **P3 — No backend linter.** ~~Add ESLint to `backend/`~~ — flat `eslint.config.js` (Node/CommonJS) + `npm run lint`, clean.
- [x] **P3 — CI.** ~~GitHub Action~~ — `.github/workflows/ci.yml`: backend (lint + test) and frontend (lint + type-scale + test + build) jobs on push/PR to `main`.

## 2. Backend — fixes & improvements

- [x] **P1 — Validate `POST /api/lists/share` body.** ~~`req.body.title` is read with no type/length check~~ — `lists.controller.js` now rejects non-string titles (400), trims, and caps at 100 chars before it reaches Supabase.
- [x] **P2 — Review Sentry `sendDefaultPii: true`.** ~~Captures request/user data~~ — set to `false` in `instrument.js` (no request bodies/headers/cookies/IP attached to events).
- [ ] **P2 — Shared cache for serverless.** _Deferred by decision:_ we lean on the already-implemented dual CDN headers (`Vercel-CDN-Cache-Control` + `stale-while-revalidate`/`stale-if-error` in `lib/cache.js`) as the serverless-durable layer; in-memory stays the warm-instance fast path. Adding Upstash/Redis needs external infra + credentials — revisit only if CDN caching proves insufficient.
- [x] **P2 — Timeout/circuit-breaker around trailer resolution.** ~~no total cap~~ — `trailer.service.js` now caps playability probes at `TRAILER_MAX_CHECKS` (8) and wraps the whole resolution in a `TRAILER_DEADLINE_MS` (12s) deadline that returns null instead of hanging. TMDB request errors still propagate for correct 404 mapping.
- [x] **P3 — Request logging/observability.** ~~beyond `console.error`~~ — `pino` + `pino-http` (`lib/logger.js`), silent under tests; the global error handler now logs structured `{ err }`.
- [x] **P3 — Confirm `.env` is gitignored.** Verified — root `.gitignore` ignores `.env`/`**/.env` (allowing `.env.example`); `backend/.env` is untracked.

## 3. Frontend — fixes & improvements

- [x] **P1 — Migrate `user/[id]/page.tsx` to TanStack Query.** ~~It's the one page still on raw `useState`/`useEffect` + `Promise.all`~~ — now a single cached `useQuery` returning a discriminated `notfound | not-friends | ok` result; redirects kept as thin effects.
- [x] **P1 — Stop swallowing mutation errors in `db.ts`.** ~~Several calls destructure only `data` and drop the Supabase `error`~~ — `watchlist`/`favorites` `add`/`remove` and `reviews.remove` now throw on error; `useTitleActions` catches and shows an error toast instead of silently succeeding.
- [x] **P2 — `reviews.listForMovie` does an N-query manual profile join.** ~~Replace with a Supabase FK embed (single query).~~ Added FK `reviews.user_id → profiles(id)` (`supabase/reviews_profiles_fk.sql`) + the matching `Relationships` entry in `database.ts`; `listForMovie` now embeds `profiles(...)` in one round-trip. ⚠️ **Requires running `supabase/reviews_profiles_fk.sql` in the Supabase SQL editor before this code is deployed** — otherwise the embed query errors and the reviews section breaks.
- [x] **P2 — Friendlier auth error copy.** ~~Auth pages surface raw Supabase `.message` strings~~ — new `lib/authErrors.ts` maps the common cases (bad credentials, already-registered, rate limit, expired link, …) with a safe fallback; applied to login/signup/forgot-password/reset-password.

## 4. New features

- [x] **P2 — Friend-request notifications.** ~~A badge/indicator for incoming requests~~ — lightweight polled head-count (`friendships.pendingIncomingCount` + `useFriendRequestCount`, 60s interval) drives a `ticket`-colored badge on the Friends item in both the desktop `SideRail` and the mobile dock (`tubelight-navbar` gained a `badges` prop).
- [x] **P2 — Activity / reviews feed.** ~~No feed exists~~ — `db.activity.forUser` merges friends' recent reviews + watched titles (newest first, capped at 50); surfaced via an **Activity/Friends tab** on `/friends` (`ActivityFeed.tsx`), so no new nav item and the mobile dock stays at 4 items.
- [x] **P2 — Shared-list management UI.** ~~After creating a share link you can't rename or unshare it~~ — the Favorites "Share" flow now loads the existing list (`sharedLists.getMine`) and the modal supports rename-in-place (keeps the token) and stop-sharing (`updateTitle` / `remove`, owner-RLS client writes).
- [x] **Profile basics: taste + all-time top five.** `profiles` gained `favorite_genres` (TMDB movie-genre ids) and `top_movies` (denormalized `{id, title, poster, type}`, capped at 5 by a CHECK constraint) via `supabase/profile_taste.sql`. Edited in Settings → **Your taste** (`TasteEditor`: genre chips capped at 5, debounced TMDB search, reorder/remove), rendered on a friend's profile by `TasteSummary`. `AuthContext` now carries `favoriteGenres` / `topMovies`.
- [ ] **P3 — Multiple custom lists** (beyond the single favorites-based share). _Deferred — its own project:_ needs new `lists` + `list_items` tables with RLS, a sharing model, and UI across create/edit/detail/share. Not folded into this sprint to avoid a fragile half-build; recommend a dedicated design pass.
- [x] **P3 — `StarRating` half-step / 5-star model.** Already satisfied — `StarRating.tsx` renders **5 stars with half-star fill** and 10 click positions (each = half a star), stored as the DB's `1–10` integer. The half-step 5-star model is effectively in place; no change needed.

## 5. Housekeeping / tech debt

- [x] **P1 — Delete or `noindex` the sandbox routes.** ~~`app/aurora`, `app/beams`, `app/lamp`, `app/liquid-glass`, `app/sentry-example-page` still ship publicly.~~ Their `page.tsx` files were already gone; removed the leftover empty directories. (No `addVariablesForColors`/unused color plugin present in `tailwind.config.ts`.)
- [x] **P2 — Consolidate search into one `SearchBar` used on every route.** Already done — a single `components/search/SearchBar.tsx` is mounted in the global `Navbar` (part of `SiteChrome`), so search is available on every `(main)` route and navigates to `/?q=`. No duplicate implementation remains.
- [x] **P3 — Enforce the type scale.** `npm run check:type-scale` passes clean; the CI workflow now runs it on every push/PR to keep it that way. (New badge/feed styles use scale tokens, not `text-[Npx]`.)

## 7. Mobile / responsive

- [x] **Site-wide horizontal scroll on mobile.** No root `overflow-x` guard existed, so any stray overflow scrolled the whole viewport. Added `overflow-x: hidden` to `html`/`body` + `max-width: 100%` in `globals.css`; hardened the mobile dock (`tubelight-navbar`) with `max-w-[calc(100vw-1.5rem)]` + internal `overflow-x-auto`.
- [x] **Off-screen / clipped content on mobile (measured with Playwright @ 390px & 360px).** Found and fixed three real offenders that the guard was only clipping: (1) **Movie/TV detail** — `grid gap-10 lg:grid-cols-3` sized its implicit mobile track to *max-content* (988px), pushing overview/cast/facts off-screen; changed to `flex flex-col … lg:grid` + `min-w-0` on both columns. (2) **Activity feed** rows — long unbreakable names/titles overflowed; added `break-words`. (3) **Review cards** — header lacked `min-w-0`/`truncate`, so a long username shoved the star rating off-screen; added `min-w-0` + `truncate` + `shrink-0`. Verified **0 overflow offenders on every page** (home, search, movie, tv, auth, watchlist, favorites, settings, friends incl. Activity tab, user profile, share modal) at 390px and 360px with populated worst-case data.

## 6. Security / privacy

- [x] **P2 — Service-role key has no RLS safety net.** ~~document that future endpoints must enforce authz in code~~ — added a prominent SECURITY comment to `backend/src/lib/supabase.js` spelling out that the service-role client bypasses RLS and every user-scoped query must authorize in code.
- [x] **P3 — Rate-limit story for authenticated writes.** Reviewed — the only authenticated *backend* write is `POST /api/lists/share`, which already has a strict 10/15-min limiter; all other user writes go straight to Supabase under RLS. Documented here; add per-user limits alongside any new authenticated write endpoint.

---

## Verification / workflow

For each code change, run the relevant checks:

- **Frontend:** `cd frontend && npm run lint && npm run check:type-scale && npm run build`
- **Backend:** `cd backend && npm test`
- **Manual:** `npm run dev` at root, then exercise the changed flow in the browser.

## Sprint 1 — ✅ complete (branch `improvements-sprint-1`)

Validate share body → delete sandbox routes → surface `db.ts` errors →
migrate `user/[id]` to Query → stand up Vitest with a first test. All five P1s landed;
frontend lint/type-check + 8 new tests + 23 backend tests all green.

## Sprint 2 — ✅ complete (branch `improvements-sprint-1`)

Review FK embed → friend-request badge → activity feed → shared-list management.
All four P2 features landed; `tsc`, lint (0 errors), type-scale guard, tests, and a full
`next build` all pass.

> ⚠️ **Action required before deploying Sprint 2:** run `supabase/reviews_profiles_fk.sql`
> in the Supabase SQL editor. It adds the `reviews → profiles` FK the embedded
> `reviews.listForMovie` query depends on. (The activity feed does not depend on it.)
> ✅ Applied by the user on 2026-08-23.

## Sprint 3 — ✅ complete (all remaining tractable items)

Backend hardening & quality (Sentry PII off, trailer circuit-breaker, pino logging,
ESLint, supertest+nock integration tests, CI, service-role RLS doc) and frontend polish
(friendlier auth errors). Verified: backend **29 tests** + lint clean; frontend **15 tests**,
tsc, lint (0 errors), type-scale, and `next build` all green.

**Two items intentionally deferred (not code-cleanups — they need their own scope):**
- **Multiple custom lists** — a feature project (new `lists`/`list_items` schema + RLS +
  UI). Recommend a dedicated design pass rather than a rushed half-build.
- **Shared Redis/Upstash cache** — needs external infra + credentials. Decision: rely on
  the existing CDN cache headers as the serverless-durable layer; revisit if insufficient.

Also confirmed already-satisfied and marked done: 5-star half-step rating, single global
search bar, and the type-scale guard.

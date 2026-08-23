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
- [ ] **P2 — Backend service tests missing on the fragile code.** `trailer.service.js` (YouTube oEmbed / KinoCheck / collection logic), `recommendation.service.js`, and `list.service.js` are untested. Add tests with axios mocked.
- [ ] **P2 — No HTTP-level/integration tests.** Add `supertest` to cover route → controller → validation wiring (esp. `/api/lists/share` auth + rate limit).
- [ ] **P3 — No backend linter.** Add ESLint to `backend/` to match the frontend's standard.
- [ ] **P3 — CI.** GitHub Action running `lint` + `test` for both packages on PRs.

## 2. Backend — fixes & improvements

- [x] **P1 — Validate `POST /api/lists/share` body.** ~~`req.body.title` is read with no type/length check~~ — `lists.controller.js` now rejects non-string titles (400), trims, and caps at 100 chars before it reaches Supabase.
- [ ] **P2 — Review Sentry `sendDefaultPii: true`.** Captures request/user data; confirm that's intended for privacy, otherwise disable.
- [ ] **P2 — Shared cache for serverless.** In-memory TTL cache only survives per warm instance. Consider Upstash/Redis (or lean fully on the existing CDN headers) so cold serverless invocations aren't slow.
- [ ] **P2 — Timeout/circuit-breaker around trailer resolution.** The trailer path walks many external candidates (TMDB videos + per-candidate YouTube oEmbed + KinoCheck) with no total cap; bound total work / add a fast-fail.
- [ ] **P3 — Request logging/observability** beyond `console.error` (structured logs, e.g. pino).
- [ ] **P3 — Confirm `.env` is gitignored** (appears untracked; verify explicitly).

## 3. Frontend — fixes & improvements

- [x] **P1 — Migrate `user/[id]/page.tsx` to TanStack Query.** ~~It's the one page still on raw `useState`/`useEffect` + `Promise.all`~~ — now a single cached `useQuery` returning a discriminated `notfound | not-friends | ok` result; redirects kept as thin effects.
- [x] **P1 — Stop swallowing mutation errors in `db.ts`.** ~~Several calls destructure only `data` and drop the Supabase `error`~~ — `watchlist`/`favorites` `add`/`remove` and `reviews.remove` now throw on error; `useTitleActions` catches and shows an error toast instead of silently succeeding.
- [x] **P2 — `reviews.listForMovie` does an N-query manual profile join.** ~~Replace with a Supabase FK embed (single query).~~ Added FK `reviews.user_id → profiles(id)` (`supabase/reviews_profiles_fk.sql`) + the matching `Relationships` entry in `database.ts`; `listForMovie` now embeds `profiles(...)` in one round-trip. ⚠️ **Requires running `supabase/reviews_profiles_fk.sql` in the Supabase SQL editor before this code is deployed** — otherwise the embed query errors and the reviews section breaks.
- [ ] **P2 — Friendlier auth error copy.** Auth pages surface raw Supabase `.message` strings; map to friendly messages.

## 4. New features

- [x] **P2 — Friend-request notifications.** ~~A badge/indicator for incoming requests~~ — lightweight polled head-count (`friendships.pendingIncomingCount` + `useFriendRequestCount`, 60s interval) drives a `ticket`-colored badge on the Friends item in both the desktop `SideRail` and the mobile dock (`tubelight-navbar` gained a `badges` prop).
- [x] **P2 — Activity / reviews feed.** ~~No feed exists~~ — `db.activity.forUser` merges friends' recent reviews + watched titles (newest first, capped at 50); surfaced via an **Activity/Friends tab** on `/friends` (`ActivityFeed.tsx`), so no new nav item and the mobile dock stays at 4 items.
- [x] **P2 — Shared-list management UI.** ~~After creating a share link you can't rename or unshare it~~ — the Favorites "Share" flow now loads the existing list (`sharedLists.getMine`) and the modal supports rename-in-place (keeps the token) and stop-sharing (`updateTitle` / `remove`, owner-RLS client writes).
- [ ] **P3 — Multiple custom lists** (beyond the single favorites-based share). Larger — needs a `lists` + `list_items` schema.
- [ ] **P3 — Finish `StarRating` half-step / 5-star model** (plan item #12 — currently a single 1–10 slider path).

## 5. Housekeeping / tech debt

- [x] **P1 — Delete or `noindex` the sandbox routes.** ~~`app/aurora`, `app/beams`, `app/lamp`, `app/liquid-glass`, `app/sentry-example-page` still ship publicly.~~ Their `page.tsx` files were already gone; removed the leftover empty directories. (No `addVariablesForColors`/unused color plugin present in `tailwind.config.ts`.)
- [ ] **P2 — Consolidate search into one `SearchBar` used on every route** (plan item #5 — verify the two implementations, unify with a `variant` prop). Search is currently confined to the home route's `?q=`.
- [ ] **P3 — Enforce the type scale** (plan item #11). The `check:type-scale` script exists; fix remaining hardcoded `text-[Npx]` literals so it passes clean.

## 6. Security / privacy

- [ ] **P2 — Service-role key has no RLS safety net.** `getSharedList` correctly scopes by `user_id`; document that any *future* list endpoints must enforce authorization in code since the backend bypasses RLS.
- [ ] **P3 — Rate-limit story for authenticated writes.** Only `/share` has a strict limiter; consider per-user limits if more write endpoints are added.

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

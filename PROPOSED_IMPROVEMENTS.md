# Movielly — Proposed Features and Improvements

Implementation brief for a coding agent. This document is based on an audit of the current
codebase and should be treated as a prioritized product and engineering roadmap.

## Product direction

Movielly should feel like a warm, editorial film journal that helps someone answer:

> What should I watch, where can I watch it, and what did my friends think?

Keep the current “late-night cinema” visual system. Do not introduce another theme, neon
gradients, excessive glass effects, or a dashboard-like redesign. Posters should remain the
primary visual surface; tungsten gold is the primary action color and ticket red is reserved for
favorites and destructive actions.

## Current strengths to preserve

- Next.js App Router, React Query, Supabase, and the existing shared component structure.
- Warm-dark palette, Bodoni display typography, Manrope UI typography, and IBM Plex Mono metadata.
- Desktop side rail plus mobile dock navigation.
- URL-backed home search and browse filters.
- Infinite browse pagination with an accessible “Load more” fallback.
- Shared movie/TV detail layout through `TitleDetail` adapters.
- Poster-first cards with touch-safe actions and reduced-motion support.
- Trailer selection, provider lookup, reviews, friends, and shareable favorites.

The existing `UI_REDESIGN_PLAN.md` contains several items that are already implemented. Verify
the current code before attempting those changes again.

## Priority 0 — data correctness and trust

### 1. Make movie and TV identity type-safe

The database stores `movie_type`, but saved titles and reviews are uniquely identified only by
`(user_id, movie_id)`. TMDB movie IDs and TV IDs can overlap. This can cause a movie and a series
with the same numeric ID to overwrite each other, appear as already saved, or share reviews.

Relevant files:

- `supabase/schema.sql`
- `frontend/src/lib/db.ts`
- `frontend/src/hooks/useTitleList.ts`
- `frontend/src/hooks/useTitleActions.ts`
- `frontend/src/hooks/useUserData.ts`
- `frontend/src/components/movie/TitleDetail.tsx`

Required changes:

1. Add a migration that deduplicates existing rows safely before changing constraints.
2. Change unique constraints to `(user_id, movie_type, movie_id)` for `watchlist`, `favorites`,
   and `reviews`.
3. Update delete, upsert, lookup, and cache membership functions to accept both type and ID.
4. Include type in React Query keys and list membership maps.
5. Add regression tests for a movie and TV title sharing the same TMDB ID.

Acceptance criteria:

- A user can save a movie and a TV title with the same numeric TMDB ID independently.
- Reviews for those titles never appear on the wrong detail page.
- Removing one title does not remove the other.

### 2. Distinguish network failure from “no results”

Several query consumers render an empty state when a request fails. A title detail request can
therefore produce “This title isn’t in the house” when TMDB or the backend is unavailable.

Add explicit `isError` and retry states to:

- Home browse/search.
- Title detail.
- Where-to-watch.
- Friends/activity.
- Watched and Favorites.

Use a calm retry action and preserve the existing visual language. Do not expose raw Axios,
Supabase, or TMDB error messages to users.

## Priority 1 — clarify the core product loop

### 3. Separate “Want to watch” from “Watched”

The current `/watchlist` route is intentionally presented as a watched log, even though the
route and some historical terminology still imply a watchlist.

Introduce three clear states:

- Want to watch.
- Watched.
- Rewatch or favorite.

Recommended data model:

- `title_status`: `planned | watched`.
- `watched_at` timestamp, nullable.
- Optional `note` or viewing context.
- Keep rating and review separate from status.

Migration behavior:

- Preserve existing rows as `watched` if the current product promises that behavior.
- Add a clear migration or onboarding explanation for existing users.
- Keep `/watchlist` as a compatibility route, but use “Want to watch” for the planning view.

### 4. Add a “Tonight” decision flow

Create a lightweight planning experience:

1. Filter by country and preferred streaming services.
2. Add 3–5 titles to a temporary or saved “Tonight” queue.
3. Share the queue with friends.
4. Allow friends to vote or react.
5. Pick one title and open its trailer/provider link.

This converts discovery into a concrete action instead of leaving users in an endless catalogue.

### 5. Make recommendations personal

The home page currently seeds a recommendation rail from the first favorite or watched title.
The backend already has theme-aware similar-title ranking in
`backend/src/services/recommendation.service.js`, but there is no user taste model.

Add a recommendation pipeline using:

- Recent ratings and reviews.
- Favorite titles.
- Watched titles.
- Genres and keywords from those titles.
- Titles the user has already dismissed or watched.
- Provider availability when a region is configured.

Every personalized rail should include a short reason, for example:

- “Because you rated *Arrival* highly.”
- “More slow-burn mysteries.”
- “Available on your services.”

Cold-start option: ask a new user to pick five titles or genres they like before showing a
personalized home rail.

## Priority 1 — availability and sharing

### 6. Add region and preferred-service settings

`WhereToWatch` currently requests providers for `US` unconditionally, although the backend
already accepts a region query parameter.

Implement:

- Region selector in Settings.
- Preferred provider selection.
- Provider-filtered browse results.
- Cached provider queries keyed by region.
- A visible “availability last checked” or stale-data explanation where appropriate.

Use TMDB’s available-region endpoint to populate supported countries rather than hard-coding a
list: <https://developer.themoviedb.org/reference/watch-providers-available-regions>

### 7. Turn Favorites into collections

The current model supports one shared favorites list per user. Add multiple named collections:

- Private or public visibility.
- Description and optional cover image.
- Manual ordering.
- Tags or themes.
- Share link and revoke link.
- Optional duplicate/clone action.

Examples: “Comfort films”, “Date night”, “Best horror”, “Watch with family”.

Keep the existing favorites share route working for backwards compatibility.

### 8. Improve public profiles and share previews

Public title and list pages should have useful social previews. Add dynamic metadata and Open
Graph images for:

- Movie detail pages.
- TV detail pages.
- Shared lists.
- User profiles.

Profiles should show selected favorites, recent watched/reviewed titles, lists, and lightweight
stats. Add privacy controls for watched history, reviews, and activity visibility.

## Priority 2 — social product depth

### 9. Make the activity feed useful

The existing feed has watched and review events, but is currently a simple chronological list.
Add:

- Activity-type filters.
- Review reactions or comments.
- “Open list” and “Watch trailer” actions.
- Better empty-state onboarding.
- Optional notification preferences.

Respect privacy settings and avoid exposing watched history by default without user control.

### 10. Improve review quality

Add optional review metadata:

- Spoiler flag with reveal control.
- Tags such as `rewatch`, `theater`, `with-friends`, or custom tags.
- Watched date.
- Edit history or updated indicator.
- Clear rating average and review count.

Keep the current accessible 1–10 rating control and add confirmation after save.

## Priority 2 — discovery and navigation UX

### 11. Upgrade search into a command palette

The current search is submit-based and title-oriented. Add:

- Debounced suggestions.
- Keyboard navigation with highlighted result.
- Recent searches.
- Search by people/crew where supported.
- Quick actions from results: mark watched, add to favorites, add to Want to watch.
- A clear no-results explanation and recovery suggestions.

Preserve URL state so submitted searches remain shareable and back-button friendly.

### 12. Improve browse filter semantics

The current filter bar is substantially improved, but search filtering still applies some genre
and year filtering client-side after a TMDB search page is returned. This can make “no results”
appear even when later pages contain matches.

Options:

- Use server-side discovery whenever a filter is active.
- Or clearly label search filters as filtering loaded results only.
- Keep all browse state in the URL.
- Preserve the existing “Load more” button and IntersectionObserver fallback.

### 13. Add meaningful collection sorting

Watched, favorites, and reviews should support:

- Recently added.
- Recently watched.
- Title.
- Release year.
- Personal rating.
- Community rating.
- Genre/type.

The current data access layer caps title lists at 250 rows and reviews at 100 rows. Replace hard
limits with pagination or an explicit “showing the first N” state.

## Priority 2 — polish and accessibility

### 14. Make title-page back navigation resilient

`TitleHero` currently calls `router.back()`. A user who opens a direct or shared link may go to
an unrelated previous page or leave the app.

Use a browse link as the guaranteed fallback, optionally preserving the incoming query string.

### 15. Fix the remaining lint warnings

Frontend lint currently reports three hook dependency warnings in:

- `frontend/src/app/(auth)/reset-password/page.tsx`
- `frontend/src/context/AuthContext.tsx`

Stabilize the Supabase client reference or restructure effects so dependencies are explicit and
safe. Do not silence the rule without documenting why.

### 16. Improve mobile provider actions

Provider logos currently all link to the same aggregate JustWatch URL. Keep that behavior if the
provider API only supplies an aggregate link, but label the interaction clearly as “More on
JustWatch” rather than implying each logo opens a provider-specific deep link.

### 17. Add keyboard and screen-reader regression coverage

Test:

- Skip link.
- Side rail and mobile dock active states.
- Filter popover open/close and focus return.
- Load more button.
- Rating slider keyboard controls.
- Review modal focus trap and escape behavior.
- Favorite/watched button labels.
- Spoiler reveal if implemented.

## Suggested implementation order

1. Type-safe movie/TV identity migration.
2. Error-state separation and regression tests.
3. Want-to-watch versus Watched model.
4. Region and preferred services.
5. Personalized recommendation pipeline.
6. Tonight queue and share flow.
7. Collections and public metadata.
8. Social activity/review improvements.
9. Search command palette and remaining polish.

## Definition of done

- Existing users’ saved titles and reviews survive migrations.
- Movie and TV titles with equal numeric IDs behave independently.
- A user can discover a title, confirm where it is available, save it to a meaningful state, and
  share the decision or collection with friends.
- Every major request has loading, empty, error, retry, and success feedback.
- Public links have useful previews.
- Mobile and keyboard interactions remain first-class.
- Existing dark visual tokens and motion/accessibility constraints remain intact.

## Inspiration

Letterboxd is a useful reference for separating watchlists from diary entries, adding context to
watched films, supporting curated lists, and building friend activity around reviews and watches:

- <https://letterboxd.com/about/faq/?s=owned>
- <https://letterboxd.com/apps/>
- <https://letterboxd.com/about/pro/>

Use the product patterns as inspiration, not its branding or layout. Movielly should retain its
own late-night cinema identity.

## Verification baseline

At the time of this audit:

- Frontend tests: 15 passing.
- Backend tests: 29 passing.
- Frontend lint: no errors, three React hook dependency warnings.

After each implementation phase, run:

```bash
npm run test --prefix frontend
npm run lint --prefix frontend
npm test --prefix backend
```

For visual changes, verify at narrow mobile width, tablet width, 1280px desktop, and 1920px
desktop. Check keyboard navigation and `prefers-reduced-motion` before considering the phase
complete.

# Movielly Native Mobile App Plan

## Summary

Create a production-ready iOS and Android app using Expo and React Native while keeping the existing Next.js web app.

The mobile app will support full feature parity:

- Authentication and password reset
- Home discovery, search, filters, trending, and popular titles
- Movie and TV detail pages
- Trailer browsing and playback handoff
- Reviews and ratings
- Watched and Want to Watch lists
- Favorites and public sharing
- Friends, activity feed, and user profiles
- Avatar uploads, taste preferences, and streaming preferences

The current Express backend, TMDB integration, Supabase project, database schema, RLS policies, and user data will remain shared.

## Architecture

Add an Expo app and a shared workspace package:

```text
frontend/              Existing Next.js web app
mobile/                New Expo React Native app
packages/core/         Shared types, API clients, repositories, and pure logic
backend/               Existing Express API
supabase/              Existing database and RLS schema
```

Update the root package configuration to use npm workspaces for `frontend`, `mobile`, and `packages/core`. The web app must continue running independently after the workspace migration.

## Shared Core Package

Move or extract platform-neutral code into `packages/core`:

- Domain types from `frontend/src/types`
- Database types
- Movie, TV, trailer, provider, review, friendship, and list models
- Title identity helpers
- API request functions currently in `frontend/src/lib/api.ts`
- Supabase repositories currently in `frontend/src/lib/db.ts`
- Query keys and stale-time configuration
- Pure data conversion helpers such as saved-list rows to movie models
- Authentication error mapping
- Validation rules for usernames, bios, ratings, and profile fields

Refactor the API client to accept configuration instead of reading Next.js-only environment variables:

```ts
createMovieApi({
  baseUrl: string;
  tmdbImageBaseUrl?: string;
})
```

Refactor Supabase initialization to accept a platform storage adapter:

```ts
createMoviellySupabaseClient({
  url: string;
  anonKey: string;
  storage: StorageAdapter;
})
```

The web client will use browser storage. The native client will use SecureStore for sensitive auth persistence, with AsyncStorage only for non-sensitive cached preferences.

Keep platform-specific concerns out of the shared package:

- Next.js routing
- Expo Router navigation
- Web markup and Tailwind classes
- Native UI components
- Browser DOM APIs
- Toast and modal presentation
- File-picker implementations

Shared hooks may be retained only when they do not import routing, DOM, or web UI dependencies. Otherwise, expose shared query functions and create thin web/mobile hooks around them.

## Mobile App

Create `mobile/` using:

- Expo
- Expo Router
- React Native
- React Native Testing Library
- TanStack React Query
- `@supabase/supabase-js`
- Expo SecureStore
- Expo Image
- Expo Image Picker
- Expo Clipboard
- Expo Sharing
- Expo Linking
- Expo Web Browser
- `lucide-react-native`
- `@sentry/react-native`

Use React Native `StyleSheet`-based primitives and a mobile-specific design system. Preserve Movielly's colors, typography direction, tone, and poster-led identity, but redesign the information architecture for native interaction.

Use this navigation structure:

- Root stack switching between authenticated and unauthenticated flows
- Bottom tabs:
  - Browse
  - Watched
  - Favorites
  - Friends
- Stack screens:
  - Movie detail
  - TV detail
  - Shared list
  - User profile
  - Settings
  - Taste editor
  - Provider preferences
  - Search/filter screen
- Auth screens:
  - Login
  - Signup
  - Forgot password
  - Reset password

Replace the current web implementations as follows:

- `next/navigation` -> Expo Router
- `next/image` -> Expo Image
- `next/link` -> Expo Router links/navigation
- Tailwind classes -> native style tokens and styles
- Radix popovers -> React Native modal or bottom-sheet UI
- HTML forms -> native inputs, buttons, and keyboard-aware layouts
- Browser file input -> Expo Image Picker
- Browser clipboard -> Expo Clipboard
- Browser share links -> Expo Sharing/native share sheet
- YouTube iframe -> open YouTube/native browser using Expo Web Browser
- `window`, `document`, `localStorage`, and `matchMedia` -> native platform APIs
- Canvas background animation -> omit in v1 or replace with a lightweight native background treatment

## Authentication and Deep Links

Configure Supabase redirect URLs for native auth flows.

Support:

- `movielly://auth/callback`
- `movielly://reset-password`
- Universal links/app links for public shared-list URLs
- Session restoration on app launch
- Sign-out and expired-session handling
- Safe handling of password-reset links opened from email

Add a configurable site URL for shared web links. A shared-list link should:

1. Open the mobile shared-list screen when the app is installed.
2. Fall back to the existing web shared-list page when it is not installed.

Never include the Supabase service-role key in the mobile app.

## Backend and Database Changes

No database migration is required for the core native app.

Make only these backend adjustments:

- Ensure the mobile app can use the production API base URL.
- Keep bearer-token authentication for protected list-sharing requests.
- Confirm CORS remains compatible with requests without a browser origin.
- Add mobile-specific API changes only if testing exposes a real requirement.

Push notifications and offline mutation queues are explicitly excluded from v1.

## Profile and Media Handling

Implement native avatar selection using Expo Image Picker.

The shared profile repository should accept a platform-neutral upload payload. The web adapter may use `File`; the native adapter should upload an image URI converted to the format supported by Supabase Storage.

Support:

- Image type validation
- 3 MB size limit
- Preview before save
- Upload failure handling
- Profile refresh after upload
- Safe-area-aware settings layouts
- Keyboard avoidance for username and bio editing

## Testing and Acceptance Criteria

Add shared-core unit tests for:

- Movie/TV title identity
- API query serialization
- Saved-title conversion
- Validation rules
- Auth error mapping

Add mobile tests for:

- Authenticated and unauthenticated navigation
- Home/search/filter flows
- Movie and TV detail rendering
- Watchlist/favorites mutations
- Review creation, editing, and deletion
- Friend request and acceptance flows
- Shared-list navigation
- Profile and avatar editing
- Provider preference saving
- Session restoration
- Deep-link routing

Add device smoke tests for both platforms covering:

1. Install and launch
2. Login
3. Search for a title
4. Open movie and TV details
5. Add/remove favorites and watchlist items
6. Write and delete a review
7. Send and accept a friend request
8. Open a shared list link
9. Pick and upload an avatar
10. Reset a password from an email link
11. Sign out and sign back in

Production acceptance requires:

- iOS and Android builds succeed
- Safe areas work on modern phones
- Keyboard does not obscure forms
- Back navigation behaves natively
- Session persistence works after app restart
- Expired tokens recover cleanly
- No service secrets ship in the bundle
- Sentry reports native crashes and unhandled errors
- Existing web functionality remains unaffected

## Delivery Phases

1. Extract shared core and establish npm workspaces.
2. Create Expo shell, native theme, navigation, Supabase auth, and deep links.
3. Build browse, search, title details, images, trailers, and providers.
4. Build watchlists, favorites, reviews, and sharing.
5. Build friends, activity, profiles, settings, avatars, and taste preferences.
6. Add tests, device smoke tests, Sentry, app icons, splash screens, privacy configuration, and store metadata.
7. Release through TestFlight and Google Play internal testing.
8. Fix platform-specific issues and submit production builds.

Estimated effort for one experienced developer:

- Shared foundation: 1-2 weeks
- Core discovery and details: 2 weeks
- Lists, reviews, sharing, and social features: 2-3 weeks
- Native QA and release preparation: 1-2 weeks
- Total: approximately 7-10 weeks for full production parity on iOS and Android

## Assumptions

- The existing Supabase project and backend remain available.
- The native app is a separate client, not a replacement for the web app.
- Full feature parity is required, but the mobile UI may be redesigned.
- Native essentials are included; push notifications and offline mode are deferred.

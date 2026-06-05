# 🎬 Movielly

A full-stack movie & TV discovery app. Search titles, watch trailers, write reviews, rate, build a watchlist, save favorites, and share your favorites list with friends.

## Stack

- **Frontend** — Next.js 16 (App Router) + React 19, Tailwind CSS (dark theme), TypeScript
- **Backend** — Express.js (TMDB proxy, hybrid trailer resolver, shared-list API)
- **Database & Auth** — Supabase (Postgres + RLS, email auth)
- **Data** — [TMDB](https://www.themoviedb.org/) for movies/TV/images, [KinoCheck](https://api.kinocheck.com/) for curated trailers (with TMDB fallback)

## Features

- 🔍 Search movies & TV shows, browse trending and popular
- 🎞️ **Trailers** — hybrid KinoCheck → TMDB; a trailer per film for franchises, per season for shows
- ⭐ Ratings & reviews (1–10 stars)
- 🔖 Watchlist & ❤️ Favorites
- 🔗 Shareable favorites list via public link
- 🔐 Auth — login, signup, forgot/reset password (split layout with scrolling poster wall)
- 🌙 Dark, responsive UI

## Getting started

### 1. Install & run
```bash
npm run install:all   # installs backend + frontend deps
npm run dev           # starts backend :3001 and frontend :3000
```

## Project structure

```
backend/    Express API (TMDB proxy, trailers, shared lists)
frontend/   Next.js app (App Router)
supabase/   schema.sql — tables, RLS policies, triggers
```

> Note: Supabase's built-in email sender is rate-limited and testing-only. Configure custom SMTP (e.g. Resend) for reliable confirmation emails, or disable email confirmation during development.

-- ─────────────────────────────────────────
-- Profile taste: favourite genres + top 5 films of all time
-- Run this in the Supabase SQL Editor (clear box / new query first).
-- ─────────────────────────────────────────

-- favorite_genres: TMDB *movie* genre ids, e.g. [28, 878, 18].
-- top_movies: denormalized so a profile renders without a TMDB round-trip —
--   [{ "id": 27205, "title": "Inception", "poster": "/xyz.jpg", "type": "movie" }]
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_genres JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS top_movies      JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Both are arrays, and the top list is capped at five. The UI enforces this
-- too, but the column is user-writable under RLS so the constraint is the
-- real guard.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_favorite_genres_is_array;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_favorite_genres_is_array
  CHECK (jsonb_typeof(favorite_genres) = 'array' AND jsonb_array_length(favorite_genres) <= 12);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_top_movies_is_array;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_top_movies_is_array
  CHECK (jsonb_typeof(top_movies) = 'array' AND jsonb_array_length(top_movies) <= 5);

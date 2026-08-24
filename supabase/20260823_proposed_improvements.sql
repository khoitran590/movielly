-- Apply after schema.sql. This migration preserves existing saved titles and
-- reviews while making TMDB identity media-type aware. Existing watchlist
-- entries represented a watched log, so they are deliberately retained as
-- `watched` rather than silently changing people's history into a plan.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  region TEXT NOT NULL DEFAULT 'US' CHECK (region ~ '^[A-Z]{2}$'),
  preferred_provider_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.watchlist
  ADD COLUMN IF NOT EXISTS title_status TEXT NOT NULL DEFAULT 'watched'
    CHECK (title_status IN ('planned', 'watched')),
  ADD COLUMN IF NOT EXISTS watched_at TIMESTAMPTZ;

UPDATE public.watchlist
SET movie_type = COALESCE(movie_type, 'movie'),
    title_status = COALESCE(title_status, 'watched'),
    watched_at = COALESCE(watched_at, added_at)
WHERE movie_type IS NULL OR title_status IS NULL OR watched_at IS NULL;

UPDATE public.favorites SET movie_type = COALESCE(movie_type, 'movie') WHERE movie_type IS NULL;
UPDATE public.reviews SET movie_type = COALESCE(movie_type, 'movie') WHERE movie_type IS NULL;

-- Defensive cleanup for databases that may have had their old constraints
-- removed manually. Keep the newest row for each real title identity.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id, movie_type, movie_id ORDER BY added_at DESC NULLS LAST, id DESC
  ) AS position
  FROM public.watchlist
)
DELETE FROM public.watchlist USING ranked WHERE watchlist.id = ranked.id AND ranked.position > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id, movie_type, movie_id ORDER BY added_at DESC NULLS LAST, id DESC
  ) AS position
  FROM public.favorites
)
DELETE FROM public.favorites USING ranked WHERE favorites.id = ranked.id AND ranked.position > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id, movie_type, movie_id ORDER BY updated_at DESC NULLS LAST, id DESC
  ) AS position
  FROM public.reviews
)
DELETE FROM public.reviews USING ranked WHERE reviews.id = ranked.id AND ranked.position > 1;

ALTER TABLE public.watchlist DROP CONSTRAINT IF EXISTS watchlist_user_id_movie_id_key;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_movie_id_key;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_movie_id_key;

ALTER TABLE public.watchlist
  ADD CONSTRAINT watchlist_user_type_movie_key UNIQUE (user_id, movie_type, movie_id);
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_user_type_movie_key UNIQUE (user_id, movie_type, movie_id);
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_type_movie_key UNIQUE (user_id, movie_type, movie_id);

CREATE INDEX IF NOT EXISTS reviews_title_type_created_idx
  ON public.reviews (movie_type, movie_id, created_at DESC);
CREATE INDEX IF NOT EXISTS watchlist_user_status_added_idx
  ON public.watchlist (user_id, title_status, added_at DESC);

COMMIT;

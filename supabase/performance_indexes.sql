-- Safe, idempotent indexes for the application's most frequent filtered and
-- ordered reads. Run once in the Supabase SQL Editor for an existing project.

CREATE INDEX IF NOT EXISTS reviews_movie_created_idx
  ON public.reviews (movie_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_user_updated_idx
  ON public.reviews (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS watchlist_user_added_idx
  ON public.watchlist (user_id, added_at DESC);

CREATE INDEX IF NOT EXISTS favorites_user_added_idx
  ON public.favorites (user_id, added_at DESC);

CREATE INDEX IF NOT EXISTS friendships_requester_status_idx
  ON public.friendships (requester_id, status, addressee_id);

CREATE INDEX IF NOT EXISTS friendships_addressee_status_idx
  ON public.friendships (addressee_id, status, requester_id);

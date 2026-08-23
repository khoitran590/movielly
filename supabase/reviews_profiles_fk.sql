-- Adds a foreign key from reviews.user_id to profiles(id) so PostgREST can embed
-- the author profile in a single query (previously reviews + a second profiles
-- fetch were merged in application code).
--
-- Safe because profiles.id === auth.users.id and every review's user_id already
-- has a matching profiles row (created by the on_auth_user_created trigger).
--
-- Apply this in the Supabase SQL editor BEFORE deploying the matching code change
-- in frontend/src/lib/db.ts (reviews.listForMovie).

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_user_id_profiles_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

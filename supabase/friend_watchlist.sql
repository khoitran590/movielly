-- ─────────────────────────────────────────
-- Let accepted friends view each other's watchlist.
-- Run this in the Supabase SQL Editor (clear the box / new query first).
-- This ADDS a second SELECT policy; combined with the existing
-- "Users can view own watchlist" policy they OR together, so you can
-- still see your own list plus your friends'.
-- ─────────────────────────────────────────
CREATE POLICY "Friends can view watchlist"
  ON public.watchlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.addressee_id = watchlist.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = watchlist.user_id)
        )
    )
  );

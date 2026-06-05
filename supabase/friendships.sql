-- ─────────────────────────────────────────
-- Friendships  (run this in the Supabase SQL Editor)
-- A single row represents the relationship between two users.
-- status: 'pending' (request sent) or 'accepted' (friends).
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friendships (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CONSTRAINT no_self_friendship CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships (requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON public.friendships (addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Either party can see the relationship
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Only the requester can create a request (as themselves)
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Only the addressee can accept (update status) a request to them
CREATE POLICY "Addressee can respond to requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

-- Either party can remove the relationship (unfriend / cancel / decline)
CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

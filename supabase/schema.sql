-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- ─────────────────────────────────────────
-- Profiles (extends auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────
-- Reviews
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id     INTEGER NOT NULL,
  movie_title  TEXT NOT NULL,
  movie_poster TEXT,
  movie_type   TEXT DEFAULT 'movie' CHECK (movie_type IN ('movie', 'tv')),
  rating       INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  content      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Watchlist
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id     INTEGER NOT NULL,
  movie_title  TEXT NOT NULL,
  movie_poster TEXT,
  movie_type   TEXT DEFAULT 'movie' CHECK (movie_type IN ('movie', 'tv')),
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own watchlist"
  ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist"
  ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Favorites
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id     INTEGER NOT NULL,
  movie_title  TEXT NOT NULL,
  movie_poster TEXT,
  movie_type   TEXT DEFAULT 'movie' CHECK (movie_type IN ('movie', 'tv')),
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own favorites"
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own favorites"
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Shared Lists
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_lists (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token  TEXT UNIQUE NOT NULL,
  title        TEXT DEFAULT 'My Favorites',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared lists are publicly readable"
  ON public.shared_lists FOR SELECT USING (true);

CREATE POLICY "Users can manage own shared list"
  ON public.shared_lists FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Friendships (request / accept model)
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

CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can respond to requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ─────────────────────────────────────────
-- Allow backend service role to read favorites for shared lists
-- (handled via service role key in Express — no extra policy needed)
-- ─────────────────────────────────────────

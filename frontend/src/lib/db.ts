// Centralized Supabase data access. Every table/storage query in the app goes
// through here, so query shapes and table names live in one place (mirroring
// lib/api.ts for the Express backend). The client is schema-typed against
// src/types/database.ts.
import { createClient } from './supabase';
import type { WatchlistItem, FavoriteItem, Review, FriendProfile } from '@/types';

const supabase = createClient();
const TITLE_LIST_LIMIT = 250;
const REVIEW_LIMIT = 100;
const FRIENDSHIP_LIMIT = 200;
const TITLE_LIST_COLUMNS = 'id, user_id, movie_id, movie_title, movie_poster, movie_type, added_at';
const REVIEW_COLUMNS = 'id, user_id, movie_id, movie_title, movie_poster, movie_type, rating, content, created_at, updated_at';
const FRIENDSHIP_COLUMNS = 'id, requester_id, addressee_id, status, created_at, updated_at';

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

// ── Profiles ────────────────────────────────────────────────────────────────

export const profiles = {
  get: async (id: string): Promise<FriendProfile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('id', id)
      .maybeSingle();
    return data;
  },

  getMany: async (ids: string[]): Promise<FriendProfile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .in('id', ids);
    return data || [];
  },

  findByUsername: async (name: string): Promise<Pick<FriendProfile, 'id' | 'username'> | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', name)
      .limit(1)
      .maybeSingle();
    return data;
  },

  update: async (id: string, patch: { username?: string; avatar_url?: string | null; bio?: string | null }) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', id);
    return { error };
  },
};

// ── Watchlist & Favorites (same row shape, different tables) ───────────────

type TitleListTable = 'watchlist' | 'favorites';
type TitleListItem = WatchlistItem | FavoriteItem;

const titleList = (table: TitleListTable) => ({
  list: async (userId: string): Promise<TitleListItem[]> => {
    const { data } = await supabase
      .from(table)
      .select(TITLE_LIST_COLUMNS)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
      .limit(TITLE_LIST_LIMIT);
    return (data as TitleListItem[]) || [];
  },

  add: async (userId: string, item: Omit<TitleListItem, 'id' | 'user_id' | 'added_at'>): Promise<TitleListItem | null> => {
    const { data } = await supabase
      .from(table)
      .insert({ ...item, user_id: userId })
      .select(TITLE_LIST_COLUMNS)
      .single();
    return (data as TitleListItem | null) ?? null;
  },

  remove: async (userId: string, movieId: number): Promise<void> => {
    await supabase.from(table).delete().eq('user_id', userId).eq('movie_id', movieId);
  },
});

export const watchlist = titleList('watchlist');
export const favorites = titleList('favorites');

// ── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = {
  // Author profiles are fetched separately and merged in (there is no FK
  // between reviews and profiles for PostgREST to embed on).
  listForMovie: async (movieId: number): Promise<Review[]> => {
    const { data } = await supabase
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })
      .limit(REVIEW_LIMIT);

    const rows = (data as Review[]) || [];
    const userIds = [...new Set(rows.map(r => r.user_id))];
    if (!userIds.length) return rows;

    const profs = await profiles.getMany(userIds);
    const profileMap = Object.fromEntries(
      profs.map(p => [p.id, { username: p.username, avatar_url: p.avatar_url, bio: p.bio }])
    );
    return rows.map(r => ({ ...r, profiles: profileMap[r.user_id] || null }));
  },

  // Every review the user has written (newest first) — used by the
  // watchlist page to show "your review" under each title.
  listByUser: async (userId: string): Promise<Review[]> => {
    const { data } = await supabase
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(REVIEW_LIMIT);
    return (data as Review[]) || [];
  },

  upsert: async (
    userId: string,
    movieId: number,
    payload: { rating: number; content: string; movie_title: string; movie_poster: string | null; movie_type: 'movie' | 'tv' }
  ) => {
    const { error } = await supabase
      .from('reviews')
      .upsert(
        { ...payload, user_id: userId, movie_id: movieId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,movie_id' }
      );
    return { error };
  },

  remove: async (userId: string, movieId: number): Promise<void> => {
    await supabase.from('reviews').delete().eq('user_id', userId).eq('movie_id', movieId);
  },
};

// ── Friendships ─────────────────────────────────────────────────────────────

export const friendships = {
  listFor: async (userId: string): Promise<FriendshipRow[]> => {
    const { data } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_COLUMNS)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(FRIENDSHIP_LIMIT);
    return (data as FriendshipRow[]) || [];
  },

  // The relationship between two users, in either direction (if any).
  between: async (userId: string, otherId: string): Promise<FriendshipRow | undefined> => {
    const { data } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_COLUMNS)
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`)
      .limit(1)
      .maybeSingle();
    return (data as FriendshipRow | null) ?? undefined;
  },

  acceptedBetween: async (userId: string, otherId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`)
      .maybeSingle();
    return data ?? null;
  },

  request: async (requesterId: string, addresseeId: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: requesterId, addressee_id: addresseeId });
    return { error };
  },

  accept: async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    return { error };
  },

  remove: async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    return { error };
  },
};

// ── Shared lists ────────────────────────────────────────────────────────────

export const sharedLists = {
  getToken: async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('shared_lists')
      .select('share_token')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.share_token ?? null;
  },

  getTokens: async (userIds: string[]): Promise<{ user_id: string; share_token: string }[]> => {
    const { data } = await supabase
      .from('shared_lists')
      .select('user_id, share_token')
      .in('user_id', userIds);
    return data || [];
  },
};

// ── Avatar storage ──────────────────────────────────────────────────────────

export const avatars = {
  // Uploads to a stable per-user path; returns a cache-busted public URL,
  // or null if the upload failed.
  upload: async (userId: string, file: File): Promise<string | null> => {
    const path = `${userId}/avatar`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  },
};

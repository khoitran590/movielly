// Centralized Supabase data access. Every table/storage query in the app goes
// through here, so query shapes and table names live in one place (mirroring
// lib/api.ts for the Express backend). The client is schema-typed against
// src/types/database.ts.
import { createClient } from './supabase';
import type { WatchlistItem, FavoriteItem, Review, FriendProfile, TopMovie } from '@/types';
import type { TitleType } from './titleIdentity';

const supabase = createClient();
const FRIENDSHIP_LIMIT = 200;
const WATCHLIST_COLUMNS = 'id, user_id, movie_id, movie_title, movie_poster, movie_type, added_at, title_status, watched_at';
const FAVORITE_COLUMNS = 'id, user_id, movie_id, movie_title, movie_poster, movie_type, added_at';
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

const PROFILE_COLUMNS = 'id, username, avatar_url, bio, favorite_genres, top_movies';

// favorite_genres / top_movies are jsonb, so they arrive as unknown-shaped Json.
// Everything downstream expects clean arrays; coerce once, here.
const toGenreIds = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : [];

const toTopMovies = (value: unknown): TopMovie[] =>
  Array.isArray(value)
    ? value.flatMap(entry => {
        if (!entry || typeof entry !== 'object') return [];
        const { id, title, poster, type } = entry as Record<string, unknown>;
        if (typeof id !== 'number' || typeof title !== 'string') return [];
        return [{
          id,
          title,
          poster: typeof poster === 'string' ? poster : null,
          type: type === 'tv' ? 'tv' : 'movie',
        } satisfies TopMovie];
      })
    : [];

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_genres: unknown;
  top_movies: unknown;
};

const toProfile = (row: ProfileRow): FriendProfile => ({
  id: row.id,
  username: row.username,
  avatar_url: row.avatar_url,
  bio: row.bio,
  favorite_genres: toGenreIds(row.favorite_genres),
  top_movies: toTopMovies(row.top_movies),
});

export const profiles = {
  get: async (id: string): Promise<FriendProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toProfile(data) : null;
  },

  getMany: async (ids: string[]): Promise<FriendProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .in('id', ids);
    if (error) throw error;
    return (data || []).map(toProfile);
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

  update: async (
    id: string,
    patch: {
      username?: string;
      avatar_url?: string | null;
      bio?: string | null;
      favorite_genres?: number[];
      top_movies?: TopMovie[];
    },
  ) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', id);
    return { error };
  },
};

// ── Watchlist & Favorites (same row shape, different tables) ───────────────

type TitleListTable = 'watchlist' | 'favorites';
type TitleListItem = WatchlistItem | FavoriteItem;

const titleList = (table: TitleListTable) => ({
  list: async (userId: string): Promise<TitleListItem[]> => {
    const { data, error } = await supabase
      .from(table)
      .select(table === 'watchlist' ? WATCHLIST_COLUMNS : FAVORITE_COLUMNS)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as TitleListItem[]) || [];
  },

  add: async (userId: string, item: Omit<TitleListItem, 'id' | 'user_id' | 'added_at'>): Promise<TitleListItem | null> => {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...item, user_id: userId })
      .select(table === 'watchlist' ? WATCHLIST_COLUMNS : FAVORITE_COLUMNS)
      .single();
    if (error) throw error;
    return (data as unknown as TitleListItem | null) ?? null;
  },

  remove: async (userId: string, movieType: TitleType, movieId: number): Promise<void> => {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).eq('movie_type', movieType).eq('movie_id', movieId);
    if (error) throw error;
  },
});

export const watchlist = {
  ...titleList('watchlist'),
  updateStatus: async (userId: string, movieType: TitleType, movieId: number, status: 'planned' | 'watched') => {
    const { error } = await supabase
      .from('watchlist')
      .update({ title_status: status, watched_at: status === 'watched' ? new Date().toISOString() : null })
      .eq('user_id', userId)
      .eq('movie_type', movieType)
      .eq('movie_id', movieId);
    if (error) throw error;
  },
};
export const favorites = titleList('favorites');

// ── Availability preferences ──────────────────────────────────────────────

export const preferences = {
  get: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('region, preferred_provider_ids, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { region: 'US', preferred_provider_ids: [] as number[], updated_at: null };
    return {
      region: data.region,
      preferred_provider_ids: Array.isArray(data.preferred_provider_ids)
        ? data.preferred_provider_ids.filter((id): id is number => typeof id === 'number')
        : [],
      updated_at: data.updated_at,
    };
  },

  save: async (userId: string, region: string, preferredProviderIds: number[]) => {
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: userId,
      region,
      preferred_provider_ids: preferredProviderIds,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = {
  // Author profile is embedded via the reviews.user_id -> profiles(id) FK
  // (see supabase/reviews_profiles_fk.sql) so this is a single round-trip.
  listForMovie: async (movieType: TitleType, movieId: number): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`${REVIEW_COLUMNS}, profiles(username, avatar_url, bio)`)
      .eq('movie_type', movieType)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as Review[]) || [];
  },

  // Every review the user has written (newest first) — used by the
  // watchlist page to show "your review" under each title.
  listByUser: async (userId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
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
        { onConflict: 'user_id,movie_type,movie_id' }
      );
    return { error };
  },

  remove: async (userId: string, movieType: TitleType, movieId: number): Promise<void> => {
    const { error } = await supabase.from('reviews').delete().eq('user_id', userId).eq('movie_type', movieType).eq('movie_id', movieId);
    if (error) throw error;
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

  // Lightweight count of incoming pending requests — powers the nav badge
  // without pulling every relationship + profile.
  pendingIncomingCount: async (userId: string): Promise<number> => {
    const { count } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    return count ?? 0;
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

  // The signed-in user's own shared list (token + title), or null if unshared.
  getMine: async (userId: string): Promise<{ share_token: string; title: string } | null> => {
    const { data } = await supabase
      .from('shared_lists')
      .select('share_token, title')
      .eq('user_id', userId)
      .maybeSingle();
    return data ? { share_token: data.share_token, title: data.title ?? 'My Favorites' } : null;
  },

  // Rename in place — keeps the existing share token so the link stays valid.
  updateTitle: async (userId: string, title: string) => {
    const { error } = await supabase
      .from('shared_lists')
      .update({ title })
      .eq('user_id', userId);
    return { error };
  },

  // Stop sharing — removes the row (RLS allows owners to manage their own).
  remove: async (userId: string) => {
    const { error } = await supabase.from('shared_lists').delete().eq('user_id', userId);
    return { error };
  },
};

// ── Activity feed (friends' recent reviews & watched titles) ─────────────────

export const activity = {
  forUser: async (userId: string): Promise<import('@/types').FeedEntry[]> => {
    const rows = await friendships.listFor(userId);
    const friendIds = rows
      .filter(r => r.status === 'accepted')
      .map(r => (r.requester_id === userId ? r.addressee_id : r.requester_id));
    if (!friendIds.length) return [];

    const [reviewRes, watchedRes, profs] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, user_id, movie_id, movie_title, movie_poster, movie_type, rating, content, created_at')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('watchlist')
        .select(WATCHLIST_COLUMNS)
        .in('user_id', friendIds)
        .eq('title_status', 'watched')
        .order('added_at', { ascending: false })
        .limit(40),
      profiles.getMany(friendIds),
    ]);
    if (reviewRes.error) throw reviewRes.error;
    if (watchedRes.error) throw watchedRes.error;

    const profileMap = Object.fromEntries(profs.map(p => [p.id, p]));
    const entries: import('@/types').FeedEntry[] = [];

    for (const r of (reviewRes.data ?? []) as Review[]) {
      entries.push({
        kind: 'review',
        id: `review-${r.id}`,
        at: r.created_at,
        profile: profileMap[r.user_id] ?? { id: r.user_id, username: 'Unknown', avatar_url: null },
        movie_id: r.movie_id,
        movie_title: r.movie_title,
        movie_poster: r.movie_poster,
        movie_type: r.movie_type,
        rating: r.rating,
        content: r.content,
      });
    }
    for (const w of (watchedRes.data ?? []) as WatchlistItem[]) {
      entries.push({
        kind: 'watched',
        id: `watched-${w.id}`,
        at: w.added_at,
        profile: profileMap[w.user_id] ?? { id: w.user_id, username: 'Unknown', avatar_url: null },
        movie_id: w.movie_id,
        movie_title: w.movie_title,
        movie_poster: w.movie_poster,
        movie_type: w.movie_type,
      });
    }

    return entries.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 50);
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

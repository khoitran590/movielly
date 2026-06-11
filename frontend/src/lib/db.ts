// Centralized Supabase data access. Every table/storage query in the app goes
// through here, so query shapes and table names live in one place (mirroring
// lib/api.ts for the Express backend).
import { createClient } from './supabase';
import type { WatchlistItem, FavoriteItem, Review, FriendProfile } from '@/types';

const supabase = createClient();

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

// ── Profiles ────────────────────────────────────────────────────────────────

export const profiles = {
  get: (id: string) =>
    supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('id', id)
      .maybeSingle()
      .then(r => (r.data as FriendProfile | null) ?? null),

  getMany: (ids: string[]) =>
    supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .in('id', ids)
      .then(r => (r.data as FriendProfile[]) || []),

  findByUsername: (name: string) =>
    supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', name)
      .limit(1)
      .maybeSingle()
      .then(r => r.data as Pick<FriendProfile, 'id' | 'username'> | null),

  update: (id: string, patch: { username?: string; avatar_url?: string | null; bio?: string | null }) =>
    supabase.from('profiles').update(patch).eq('id', id).then(r => ({ error: r.error })),
};

// ── Watchlist & Favorites (same row shape, different tables) ───────────────

type TitleListTable = 'watchlist' | 'favorites';
type TitleListItem = WatchlistItem | FavoriteItem;

const titleList = (table: TitleListTable) => ({
  list: (userId: string) =>
    supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
      .then(r => (r.data as TitleListItem[]) || []),

  add: (userId: string, item: Omit<TitleListItem, 'id' | 'user_id' | 'added_at'>) =>
    supabase
      .from(table)
      .insert({ ...item, user_id: userId })
      .select()
      .single()
      .then(r => (r.data as TitleListItem | null) ?? null),

  remove: (userId: string, movieId: number) =>
    supabase.from(table).delete().eq('user_id', userId).eq('movie_id', movieId).then(() => undefined),
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
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    const rows = (data as Review[]) || [];
    const userIds = [...new Set(rows.map(r => r.user_id))];
    if (!userIds.length) return rows;

    const profs = await profiles.getMany(userIds);
    const profileMap = Object.fromEntries(
      profs.map(p => [p.id, { username: p.username, avatar_url: p.avatar_url, bio: p.bio }])
    );
    return rows.map(r => ({ ...r, profiles: profileMap[r.user_id] || null }));
  },

  upsert: (
    userId: string,
    movieId: number,
    payload: { rating: number; content: string; movie_title: string; movie_poster: string | null; movie_type: 'movie' | 'tv' }
  ) =>
    supabase
      .from('reviews')
      .upsert(
        { ...payload, user_id: userId, movie_id: movieId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,movie_id' }
      )
      .select('*')
      .single()
      .then(r => ({ error: r.error })),

  remove: (userId: string, movieId: number) =>
    supabase.from('reviews').delete().eq('user_id', userId).eq('movie_id', movieId).then(() => undefined),
};

// ── Friendships ─────────────────────────────────────────────────────────────

export const friendships = {
  listFor: (userId: string) =>
    supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .then(r => (r.data as FriendshipRow[]) || []),

  // The relationship between two users, in either direction (if any).
  between: (userId: string, otherId: string) =>
    supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`)
      .then(r => ((r.data as FriendshipRow[]) || [])[0]),

  acceptedBetween: (userId: string, otherId: string) =>
    supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`)
      .maybeSingle()
      .then(r => r.data ?? null),

  request: (requesterId: string, addresseeId: string) =>
    supabase
      .from('friendships')
      .insert({ requester_id: requesterId, addressee_id: addresseeId })
      .then(r => ({ error: r.error })),

  accept: (friendshipId: string) =>
    supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .then(r => ({ error: r.error })),

  remove: (friendshipId: string) =>
    supabase.from('friendships').delete().eq('id', friendshipId).then(r => ({ error: r.error })),
};

// ── Shared lists ────────────────────────────────────────────────────────────

export const sharedLists = {
  getToken: (userId: string) =>
    supabase
      .from('shared_lists')
      .select('share_token')
      .eq('user_id', userId)
      .maybeSingle()
      .then(r => r.data?.share_token ?? null),

  getTokens: (userIds: string[]) =>
    supabase
      .from('shared_lists')
      .select('user_id, share_token')
      .in('user_id', userIds)
      .then(r => (r.data as { user_id: string; share_token: string }[]) || []),
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

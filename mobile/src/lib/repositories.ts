import type { FavoriteItem, FriendProfile, FriendshipRow, Review, TitleType, TopMovie, UserPreferences, WatchlistItem } from '@movielly/core';
import { supabase } from './supabase';

const PROFILE = 'id, username, avatar_url, bio, favorite_genres, top_movies';
const SAVED = 'id, user_id, movie_id, movie_title, movie_poster, movie_type, added_at';
const WATCHED = `${SAVED}, title_status, watched_at`;
const REVIEW = `${SAVED}, rating, content, created_at, updated_at`;
const FRIEND = 'id, requester_id, addressee_id, status, created_at';

function cleanProfile(row: Record<string, unknown>): FriendProfile {
  const topMovies = Array.isArray(row.top_movies) ? row.top_movies as TopMovie[] : [];
  const favoriteGenres = Array.isArray(row.favorite_genres) ? row.favorite_genres.filter((id): id is number => typeof id === 'number') : [];
  return { id: String(row.id), username: typeof row.username === 'string' ? row.username : null, avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null, bio: typeof row.bio === 'string' ? row.bio : null, favorite_genres: favoriteGenres, top_movies: topMovies };
}

export const profileRepo = {
  async get(id: string) { const { data, error } = await supabase.from('profiles').select(PROFILE).eq('id', id).maybeSingle(); if (error) throw error; return data ? cleanProfile(data) : null; },
  async many(ids: string[]) { if (!ids.length) return []; const { data, error } = await supabase.from('profiles').select(PROFILE).in('id', ids); if (error) throw error; return (data || []).map(cleanProfile); },
  async find(username: string) { const { data } = await supabase.from('profiles').select(PROFILE).ilike('username', username).limit(1).maybeSingle(); return data ? cleanProfile(data) : null; },
  async update(id: string, patch: { username?: string; avatar_url?: string | null; bio?: string | null; favorite_genres?: number[]; top_movies?: TopMovie[] }) { const { error } = await supabase.from('profiles').update(patch).eq('id', id); if (error) throw error; },
  async uploadAvatar(id: string, uri: string, mime = 'image/jpeg') {
    const response = await fetch(uri);
    const body = await response.arrayBuffer();
    const path = `${id}/avatar`;
    const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: mime, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  },
};

function savedRepo(table: 'watchlist' | 'favorites') {
  return {
    async list(userId: string) { const { data, error } = await supabase.from(table).select(table === 'watchlist' ? WATCHED : SAVED).eq('user_id', userId).order('added_at', { ascending: false }); if (error) throw error; return (data || []) as unknown as (WatchlistItem[] | FavoriteItem[]); },
    async add(userId: string, item: { movie_id: number; movie_title: string; movie_poster: string | null; movie_type: TitleType }) { const payload = table === 'watchlist' ? { ...item, user_id: userId, title_status: 'planned' } : { ...item, user_id: userId }; const { error } = await supabase.from(table).insert(payload); if (error && error.code !== '23505') throw error; },
    async remove(userId: string, type: TitleType, id: number) { const { error } = await supabase.from(table).delete().eq('user_id', userId).eq('movie_type', type).eq('movie_id', id); if (error) throw error; },
  };
}
export const watchlistRepo = {
  ...savedRepo('watchlist'),
  async status(userId: string, type: TitleType, id: number, value: 'planned' | 'watched') { const { error } = await supabase.from('watchlist').update({ title_status: value, watched_at: value === 'watched' ? new Date().toISOString() : null }).eq('user_id', userId).eq('movie_type', type).eq('movie_id', id); if (error) throw error; },
};
export const favoriteRepo = savedRepo('favorites');

export const reviewRepo = {
  async forTitle(type: TitleType, id: number) { const { data, error } = await supabase.from('reviews').select(`${REVIEW}, profiles(username, avatar_url)`).eq('movie_type', type).eq('movie_id', id).order('created_at', { ascending: false }); if (error) throw error; return (data || []) as unknown as Review[]; },
  async mine(userId: string) { const { data, error } = await supabase.from('reviews').select(REVIEW).eq('user_id', userId).order('updated_at', { ascending: false }); if (error) throw error; return (data || []) as unknown as Review[]; },
  async save(userId: string, id: number, payload: { rating: number; content: string; movie_title: string; movie_poster: string | null; movie_type: TitleType }) { const { error } = await supabase.from('reviews').upsert({ ...payload, user_id: userId, movie_id: id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,movie_type,movie_id' }); if (error) throw error; },
  async remove(userId: string, type: TitleType, id: number) { const { error } = await supabase.from('reviews').delete().eq('user_id', userId).eq('movie_type', type).eq('movie_id', id); if (error) throw error; },
};

export const friendRepo = {
  async list(userId: string) { const { data } = await supabase.from('friendships').select(FRIEND).or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).order('created_at', { ascending: false }).limit(200); return (data || []) as FriendshipRow[]; },
  async request(from: string, to: string) { const { error } = await supabase.from('friendships').insert({ requester_id: from, addressee_id: to }); if (error) throw error; },
  async accept(id: string) { const { error } = await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; },
  async remove(id: string) { const { error } = await supabase.from('friendships').delete().eq('id', id); if (error) throw error; },
};

export type ActivityItem = {
  id: string; kind: 'review' | 'watched'; at: string; profile: FriendProfile;
  movie_id: number; movie_title: string; movie_poster: string | null; movie_type: TitleType;
  rating?: number; content?: string | null;
};
export const activityRepo = {
  async list(userId: string): Promise<ActivityItem[]> {
    const relationships = (await friendRepo.list(userId)).filter(row => row.status === 'accepted');
    const ids = relationships.map(row => row.requester_id === userId ? row.addressee_id : row.requester_id);
    if (!ids.length) return [];
    const [reviewResult, watchedResult, profiles] = await Promise.all([
      supabase.from('reviews').select(REVIEW).in('user_id', ids).order('created_at', { ascending: false }).limit(30),
      supabase.from('watchlist').select(WATCHED).in('user_id', ids).eq('title_status', 'watched').order('watched_at', { ascending: false }).limit(30),
      profileRepo.many(ids),
    ]);
    const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
    const reviews = (reviewResult.data || []).map(row => ({ id: `review-${row.id}`, kind: 'review' as const, at: row.created_at, profile: profileMap.get(row.user_id)!, movie_id: row.movie_id, movie_title: row.movie_title, movie_poster: row.movie_poster, movie_type: row.movie_type as TitleType, rating: row.rating, content: row.content }));
    const watched = (watchedResult.data || []).map(row => ({ id: `watched-${row.id}`, kind: 'watched' as const, at: row.watched_at || row.added_at, profile: profileMap.get(row.user_id)!, movie_id: row.movie_id, movie_title: row.movie_title, movie_poster: row.movie_poster, movie_type: row.movie_type as TitleType }));
    return [...reviews, ...watched].filter(item => item.profile).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  },
};

export const preferenceRepo = {
  async get(userId: string): Promise<UserPreferences> { const { data, error } = await supabase.from('user_preferences').select('region, preferred_provider_ids, updated_at').eq('user_id', userId).maybeSingle(); if (error) throw error; return data ? { region: data.region, preferred_provider_ids: Array.isArray(data.preferred_provider_ids) ? data.preferred_provider_ids.filter((id): id is number => typeof id === 'number') : [], updated_at: data.updated_at } : { region: 'US', preferred_provider_ids: [], updated_at: null }; },
  async save(userId: string, value: UserPreferences) { const { error } = await supabase.from('user_preferences').upsert({ user_id: userId, ...value, updated_at: new Date().toISOString() }); if (error) throw error; },
};

export const sharedRepo = {
  async tokens(ids: string[]) { if (!ids.length) return []; const { data } = await supabase.from('shared_lists').select('user_id, share_token').in('user_id', ids); return data || []; },
  async mine(userId: string) { const { data } = await supabase.from('shared_lists').select('share_token, title').eq('user_id', userId).maybeSingle(); return data; },
  async rename(userId: string, title: string) { const { error } = await supabase.from('shared_lists').update({ title }).eq('user_id', userId); if (error) throw error; },
  async remove(userId: string) { const { error } = await supabase.from('shared_lists').delete().eq('user_id', userId); if (error) throw error; },
};

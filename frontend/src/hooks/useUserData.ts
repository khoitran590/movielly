'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { WatchlistItem, FavoriteItem, Review } from '@/types';

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });
    setItems(data || []);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const add = async (item: Omit<WatchlistItem, 'id' | 'user_id' | 'added_at'>) => {
    if (!user) return;
    const { data } = await supabase
      .from('watchlist')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (data) setItems(prev => [data, ...prev]);
  };

  const remove = async (movieId: number) => {
    if (!user) return;
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movieId);
    setItems(prev => prev.filter(i => i.movie_id !== movieId));
  };

  const isInList = (movieId: number) => items.some(i => i.movie_id === movieId);

  return { items, add, remove, isInList, refetch: fetchItems };
}

export function useFavorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });
    setItems(data || []);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const add = async (item: Omit<FavoriteItem, 'id' | 'user_id' | 'added_at'>) => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (data) setItems(prev => [data, ...prev]);
  };

  const remove = async (movieId: number) => {
    if (!user) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('movie_id', movieId);
    setItems(prev => prev.filter(i => i.movie_id !== movieId));
  };

  const isInList = (movieId: number) => items.some(i => i.movie_id === movieId);

  return { items, add, remove, isInList, refetch: fetchItems };
}

export function useReviews(movieId?: number) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const supabase = createClient();

  const fetchReviews = useCallback(async () => {
    if (!movieId) return;
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    const rows = data || [];
    // Fetch author profiles separately (no FK between reviews and profiles to embed on).
    const userIds = [...new Set(rows.map(r => r.user_id))];
    let profileMap: Record<string, { username: string | null; avatar_url: string | null; bio: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .in('id', userIds);
      profileMap = Object.fromEntries((profs || []).map(p => [p.id, { username: p.username, avatar_url: p.avatar_url, bio: p.bio }]));
    }
    const withProfiles = rows.map(r => ({ ...r, profiles: profileMap[r.user_id] || null }));

    setReviews(withProfiles);
    if (user) {
      setUserReview(withProfiles.find(r => r.user_id === user.id) || null);
    }
  }, [movieId, user]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const upsert = async (payload: { rating: number; content: string; movie_title: string; movie_poster: string | null; movie_type: 'movie' | 'tv' }) => {
    if (!user || !movieId) return;
    const { error } = await supabase
      .from('reviews')
      .upsert({ ...payload, user_id: user.id, movie_id: movieId, updated_at: new Date().toISOString() }, { onConflict: 'user_id,movie_id' })
      .select('*')
      .single();
    if (!error) {
      await fetchReviews();
    }
    return { error };
  };

  const deleteReview = async () => {
    if (!user || !movieId) return;
    await supabase.from('reviews').delete().eq('user_id', user.id).eq('movie_id', movieId);
    setUserReview(null);
    setReviews(prev => prev.filter(r => r.user_id !== user.id));
  };

  return { reviews, userReview, upsert, deleteReview, refetch: fetchReviews };
}

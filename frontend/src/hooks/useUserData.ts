'use client';

import { useState, useEffect, useCallback } from 'react';
import { reviews as reviewsDb } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { Review } from '@/types';

// useWatchlist lives in '@/context/WatchlistContext' and
// useFavorites in '@/context/FavoritesContext' (shared single fetch each).

export function useReviews(movieId?: number) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!movieId) return;
    const withProfiles = await reviewsDb.listForMovie(movieId);
    setReviews(withProfiles);
    if (user) {
      setUserReview(withProfiles.find(r => r.user_id === user.id) || null);
    }
  }, [movieId, user]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const upsert = async (payload: { rating: number; content: string; movie_title: string; movie_poster: string | null; movie_type: 'movie' | 'tv' }) => {
    if (!user || !movieId) return;
    const { error } = await reviewsDb.upsert(user.id, movieId, payload);
    if (!error) {
      await fetchReviews();
    }
    return { error };
  };

  const deleteReview = async () => {
    if (!user || !movieId) return;
    await reviewsDb.remove(user.id, movieId);
    setUserReview(null);
    setReviews(prev => prev.filter(r => r.user_id !== user.id));
  };

  return { reviews, userReview, upsert, deleteReview, refetch: fetchReviews };
}

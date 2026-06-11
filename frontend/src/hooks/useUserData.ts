'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reviews as reviewsDb } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { Review } from '@/types';

// useWatchlist lives in '@/context/WatchlistContext' and
// useFavorites in '@/context/FavoritesContext' (shared TanStack Query cache each).

export function useReviews(movieId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['reviews', movieId];

  const { data: reviews = [], refetch } = useQuery({
    queryKey,
    queryFn: () => reviewsDb.listForMovie(movieId!),
    enabled: !!movieId,
  });

  const userReview = user ? reviews.find(r => r.user_id === user.id) || null : null;

  const upsert = async (payload: { rating: number; content: string; movie_title: string; movie_poster: string | null; movie_type: 'movie' | 'tv' }) => {
    if (!user || !movieId) return;
    const { error } = await reviewsDb.upsert(user.id, movieId, payload);
    if (!error) {
      await refetch();
      // the user's own-review list (watchlist dropdowns) is stale now too
      queryClient.invalidateQueries({ queryKey: ['myReviews', user.id] });
    }
    return { error };
  };

  const deleteReview = async () => {
    if (!user || !movieId) return;
    await reviewsDb.remove(user.id, movieId);
    queryClient.setQueryData<Review[]>(queryKey, (prev = []) => prev.filter(r => r.user_id !== user.id));
    queryClient.invalidateQueries({ queryKey: ['myReviews', user.id] });
  };

  return { reviews, userReview, upsert, deleteReview, refetch };
}

// All reviews the signed-in user has written, for the watchlist dropdowns.
export function useMyReviews() {
  const { user } = useAuth();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['myReviews', user?.id],
    queryFn: () => reviewsDb.listByUser(user!.id),
    enabled: !!user,
  });
  const byMovieId = new Map(reviews.map(r => [r.movie_id, r]));
  return { reviews, byMovieId, loading: !!user && isLoading };
}

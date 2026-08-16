'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieTitle } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import type { Movie } from '@/types';

export function useTitleActions(movie: Movie) {
  const router = useRouter();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const favorites = useFavorites();
  const { toast } = useToast();
  const isTV = movie.media_type === 'tv' || (!movie.title && Boolean(movie.name));
  const type: 'movie' | 'tv' = isTV ? 'tv' : 'movie';
  const title = getMovieTitle(movie);
  const href = `/${type}/${movie.id}`;
  const inWatchlist = watchlist.isInList(movie.id);
  const inFavorites = favorites.isInList(movie.id);

  const payload = useMemo(() => ({
    movie_id: movie.id,
    movie_title: title,
    movie_poster: movie.poster_path,
    movie_type: type,
  } as const), [movie.id, movie.poster_path, title, type]);

  const toggleWatchlist = useCallback(async () => {
    if (!user) { router.push('/login'); return; }
    if (inWatchlist) {
      await watchlist.remove(movie.id);
      toast(`Removed ${title} from Watched`);
    } else {
      await watchlist.add(payload);
      toast(`Marked ${title} as watched`);
    }
  }, [inWatchlist, movie.id, payload, router, title, toast, user, watchlist]);

  const toggleFavorite = useCallback(async () => {
    if (!user) { router.push('/login'); return; }
    if (inFavorites) {
      await favorites.remove(movie.id);
      toast(`Removed ${title} from Favorites`);
    } else {
      await favorites.add(payload);
      toast(`Added ${title} to Favorites`);
    }
  }, [favorites, inFavorites, movie.id, payload, router, title, toast, user]);

  return { isTV, type, href, title, inWatchlist, inFavorites, toggleWatchlist, toggleFavorite };
}

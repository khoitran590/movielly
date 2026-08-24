'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getMovieTitle } from '@/lib/api';
import { watchlist as watchlistDb } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import type { Movie } from '@/types';
import { titleTypeFor } from '@/lib/titleIdentity';

export function useTitleActions(movie: Movie) {
  const router = useRouter();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const favorites = useFavorites();
  const { toast } = useToast();
  const type = titleTypeFor(movie);
  const isTV = type === 'tv';
  const title = getMovieTitle(movie);
  const href = `/${type}/${movie.id}`;
  const watchEntry = watchlist.items.find(item => item.movie_id === movie.id && item.movie_type === type);
  const inWatchlist = watchEntry?.title_status === 'watched';
  const inWantToWatch = watchEntry?.title_status === 'planned';
  const inFavorites = favorites.isInList(type, movie.id);

  const payload = useMemo(() => ({
    movie_id: movie.id,
    movie_title: title,
    movie_poster: movie.poster_path,
    movie_type: type,
  } as const), [movie.id, movie.poster_path, title, type]);

  const toggleWatchlist = useCallback(async () => {
    if (!user) { router.push('/login'); return; }
    try {
      if (inWatchlist) {
        await watchlist.remove(type, movie.id);
        toast(`Removed ${title} from Watched`);
      } else if (inWantToWatch) {
        await watchlistDb.updateStatus(user.id, type, movie.id, 'watched');
        await watchlist.refetch();
        toast(`Marked ${title} as watched`);
      } else {
        await watchlist.add({ ...payload, title_status: 'watched', watched_at: new Date().toISOString() });
        toast(`Marked ${title} as watched`);
      }
    } catch {
      toast(`Couldn’t update Watched — please try again`);
    }
  }, [inWantToWatch, inWatchlist, movie.id, payload, router, title, toast, type, user, watchlist]);

  const toggleWantToWatch = useCallback(async () => {
    if (!user) { router.push('/login'); return; }
    try {
      if (inWantToWatch) {
        await watchlist.remove(type, movie.id);
        toast(`Removed ${title} from Want to watch`);
      } else if (inWatchlist) {
        await watchlistDb.updateStatus(user.id, type, movie.id, 'planned');
        await watchlist.refetch();
        toast(`Moved ${title} to Want to watch`);
      } else {
        await watchlist.add({ ...payload, title_status: 'planned', watched_at: null });
        toast(`Added ${title} to Want to watch`);
      }
    } catch {
      toast('Couldn’t update Want to watch — please try again');
    }
  }, [inWantToWatch, inWatchlist, movie.id, payload, router, title, toast, type, user, watchlist]);

  const toggleFavorite = useCallback(async () => {
    if (!user) { router.push('/login'); return; }
    try {
      if (inFavorites) {
        await favorites.remove(type, movie.id);
        toast(`Removed ${title} from Favorites`);
      } else {
        await favorites.add(payload);
        toast(`Added ${title} to Favorites`);
      }
    } catch {
      toast(`Couldn’t update Favorites — please try again`);
    }
  }, [favorites, inFavorites, movie.id, payload, router, title, toast, type, user]);

  return { isTV, type, href, title, inWatchlist, inWantToWatch, inFavorites, toggleWatchlist, toggleWantToWatch, toggleFavorite };
}

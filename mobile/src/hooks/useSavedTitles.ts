import type { FavoriteItem, Movie, TitleType, WatchlistItem } from '@movielly/core';
import { titleIdentity } from '@movielly/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoriteRepo, watchlistRepo } from '@/lib/repositories';
import { useAuth } from '@/providers/AuthProvider';

export function useSavedTitles(kind: 'watchlist' | 'favorites') {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = [kind, user?.id];
  const repo = kind === 'watchlist' ? watchlistRepo : favoriteRepo;
  const query = useQuery({ queryKey: key, queryFn: () => repo.list(user!.id), enabled: Boolean(user) });
  const mutation = useMutation({
    mutationFn: async ({ movie, type, remove }: { movie: Movie; type: TitleType; remove: boolean }) => {
      if (!user) throw new Error('Sign in to save titles.');
      if (remove) return repo.remove(user.id, type, movie.id);
      return repo.add(user.id, { movie_id: movie.id, movie_title: movie.title || movie.name || 'Untitled', movie_poster: movie.poster_path, movie_type: type });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  const items = (query.data || []) as (WatchlistItem | FavoriteItem)[];
  const contains = (type: TitleType, id: number) => items.some(item => titleIdentity(item.movie_type, item.movie_id) === titleIdentity(type, id));
  return { ...query, items, contains, toggle: (movie: Movie, type: TitleType) => mutation.mutateAsync({ movie, type, remove: contains(type, movie.id) }), toggling: mutation.isPending };
}

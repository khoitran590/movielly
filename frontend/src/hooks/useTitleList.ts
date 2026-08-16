'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlist, favorites } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { WatchlistItem, FavoriteItem } from '@/types';

type TitleItem = WatchlistItem | FavoriteItem;
type NewTitleItem = Omit<TitleItem, 'id' | 'user_id' | 'added_at'>;

const sources = { watchlist, favorites } as const;
const EMPTY_TITLE_ITEMS: TitleItem[] = [];
const membershipCache = new WeakMap<TitleItem[], Set<number>>();

function movieIdsFor(items: TitleItem[]) {
  const cached = membershipCache.get(items);
  if (cached) return cached;
  const ids = new Set(items.map(item => item.movie_id));
  membershipCache.set(items, ids);
  return ids;
}

// Watchlist and favorites share one implementation: a React Query cache entry
// per user, updated in place on add/remove. Query-key dedupe means every
// MovieCard shares a single fetch — no context provider needed.
export function useTitleList<T extends TitleItem>(kind: 'watchlist' | 'favorites') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [kind, user?.id];

  const { data: items = EMPTY_TITLE_ITEMS as T[], refetch } = useQuery({
    queryKey,
    queryFn: () => sources[kind].list(user!.id) as Promise<T[]>,
    enabled: !!user,
  });
  const movieIds = movieIdsFor(items);

  const addMutation = useMutation({
    mutationFn: (item: NewTitleItem) => sources[kind].add(user!.id, item),
    onSuccess: (data) => {
      if (data) queryClient.setQueryData<T[]>(queryKey, (prev = []) => [data as T, ...prev]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (movieId: number) => sources[kind].remove(user!.id, movieId),
    onSuccess: (_data, movieId) => {
      queryClient.setQueryData<T[]>(queryKey, (prev = []) => prev.filter(i => i.movie_id !== movieId));
    },
  });

  const add = useCallback(async (item: NewTitleItem) => {
    if (!user) return;
    // guard against duplicates
    if (movieIds.has(item.movie_id)) return;
    await addMutation.mutateAsync(item);
  }, [user, movieIds, addMutation]);

  const remove = useCallback(async (movieId: number) => {
    if (!user) return;
    await removeMutation.mutateAsync(movieId);
  }, [user, removeMutation]);

  const isInList = useCallback((movieId: number) => movieIds.has(movieId), [movieIds]);

  const refetchVoid = useCallback(async () => { await refetch(); }, [refetch]);

  return { items, isInList, add, remove, refetch: refetchVoid };
}

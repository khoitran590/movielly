'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlist, favorites } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { WatchlistItem, FavoriteItem } from '@/types';
import { titleIdentity, type TitleType } from '@/lib/titleIdentity';

type TitleItem = WatchlistItem | FavoriteItem;
export type NewTitleItem = {
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: TitleType;
  title_status?: 'planned' | 'watched';
  watched_at?: string | null;
};

const sources = { watchlist, favorites } as const;
const EMPTY_TITLE_ITEMS: TitleItem[] = [];
const membershipCache = new WeakMap<TitleItem[], Set<string>>();

function titleIdsFor(items: TitleItem[]) {
  const cached = membershipCache.get(items);
  if (cached) return cached;
  const ids = new Set(items.map(item => titleIdentity(item.movie_type, item.movie_id)));
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

  const { data: items = EMPTY_TITLE_ITEMS as T[], refetch, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => sources[kind].list(user!.id) as Promise<T[]>,
    enabled: !!user,
  });
  const titleIds = titleIdsFor(items);

  const addMutation = useMutation({
    mutationFn: (item: NewTitleItem) => sources[kind].add(user!.id, item as never),
    onSuccess: (data) => {
      if (data) queryClient.setQueryData<T[]>(queryKey, (prev = []) => [data as T, ...prev]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ movieType, movieId }: { movieType: TitleType; movieId: number }) => sources[kind].remove(user!.id, movieType, movieId),
    onSuccess: (_data, { movieType, movieId }) => {
      queryClient.setQueryData<T[]>(queryKey, (prev = []) => prev.filter(i => titleIdentity(i.movie_type, i.movie_id) !== titleIdentity(movieType, movieId)));
    },
  });

  const add = useCallback(async (item: NewTitleItem) => {
    if (!user) return;
    // guard against duplicates
    if (titleIds.has(titleIdentity(item.movie_type, item.movie_id))) return;
    await addMutation.mutateAsync(item);
  }, [user, titleIds, addMutation]);

  const remove = useCallback(async (movieType: TitleType, movieId: number) => {
    if (!user) return;
    await removeMutation.mutateAsync({ movieType, movieId });
  }, [user, removeMutation]);

  const isInList = useCallback((movieType: TitleType, movieId: number) => titleIds.has(titleIdentity(movieType, movieId)), [titleIds]);

  const refetchVoid = useCallback(async () => { await refetch(); }, [refetch]);

  return { items, isInList, add, remove, refetch: refetchVoid, isLoading, isError };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { movies as movieApi } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import type { Genre } from '@/types';

// Profiles store favourite genres as bare TMDB movie-genre ids, so anything
// rendering them needs the id → name catalogue. It changes about never, hence
// the reference-data stale time.
export function useGenreCatalog() {
  const { data = [], isLoading, isError, refetch } = useQuery<Genre[]>({
    queryKey: ['genre-catalog', 'movie'],
    queryFn: ({ signal }) => movieApi.genres('movie', signal),
    staleTime: QUERY_STALE_TIME.referenceData,
  });

  const nameOf = (id: number) => data.find(genre => genre.id === id)?.name ?? null;

  return { genres: data, nameOf, isLoading, isError, refetch };
}

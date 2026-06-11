'use client';

// Watchlist (movies/shows the user has watched), backed by TanStack Query —
// the query cache replaces the old context provider, every consumer shares
// one fetch per user. Kept at this path so existing imports keep working.
import { useTitleList } from '@/hooks/useTitleList';
import type { WatchlistItem } from '@/types';

export const useWatchlist = () => useTitleList<WatchlistItem>('watchlist');

'use client';

// Favorites, backed by TanStack Query — the query cache replaces the old
// context provider, every consumer shares one fetch per user. Kept at this
// path so existing imports keep working.
import { useTitleList } from '@/hooks/useTitleList';
import type { FavoriteItem } from '@/types';

export const useFavorites = () => useTitleList<FavoriteItem>('favorites');

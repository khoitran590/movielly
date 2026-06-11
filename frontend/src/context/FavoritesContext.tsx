'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favorites as db } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { FavoriteItem } from '@/types';

interface FavoritesContextValue {
  items: FavoriteItem[];
  isInList: (movieId: number) => boolean;
  add: (item: Omit<FavoriteItem, 'id' | 'user_id' | 'added_at'>) => Promise<void>;
  remove: (movieId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  items: [],
  isInList: () => false,
  add: async () => {},
  remove: async () => {},
  refetch: async () => {},
});

// Single source of truth for the user's favorites, shared across every MovieCard.
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);

  const fetchItems = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setItems((await db.list(user.id)) as FavoriteItem[]);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const add = useCallback(async (item: Omit<FavoriteItem, 'id' | 'user_id' | 'added_at'>) => {
    if (!user) return;
    if (items.some(i => i.movie_id === item.movie_id)) return;
    const data = await db.add(user.id, item);
    if (data) setItems(prev => [data as FavoriteItem, ...prev]);
  }, [user, items]);

  const remove = useCallback(async (movieId: number) => {
    if (!user) return;
    await db.remove(user.id, movieId);
    setItems(prev => prev.filter(i => i.movie_id !== movieId));
  }, [user]);

  const isInList = useCallback((movieId: number) => items.some(i => i.movie_id === movieId), [items]);

  return (
    <FavoritesContext.Provider value={{ items, isInList, add, remove, refetch: fetchItems }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

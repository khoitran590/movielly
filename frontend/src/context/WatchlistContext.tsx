'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { watchlist as db } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { WatchlistItem } from '@/types';

interface WatchlistContextValue {
  items: WatchlistItem[];
  isInList: (movieId: number) => boolean;
  add: (item: Omit<WatchlistItem, 'id' | 'user_id' | 'added_at'>) => Promise<void>;
  remove: (movieId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue>({
  items: [],
  isInList: () => false,
  add: async () => {},
  remove: async () => {},
  refetch: async () => {},
});

// Single source of truth for the user's watchlist (movies they've watched),
// so every MovieCard shares one fetch instead of querying individually.
export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);

  const fetchItems = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setItems((await db.list(user.id)) as WatchlistItem[]);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const add = useCallback(async (item: Omit<WatchlistItem, 'id' | 'user_id' | 'added_at'>) => {
    if (!user) return;
    // optimistic guard against duplicates
    if (items.some(i => i.movie_id === item.movie_id)) return;
    const data = await db.add(user.id, item);
    if (data) setItems(prev => [data as WatchlistItem, ...prev]);
  }, [user, items]);

  const remove = useCallback(async (movieId: number) => {
    if (!user) return;
    await db.remove(user.id, movieId);
    setItems(prev => prev.filter(i => i.movie_id !== movieId));
  }, [user]);

  const isInList = useCallback((movieId: number) => items.some(i => i.movie_id === movieId), [items]);

  return (
    <WatchlistContext.Provider value={{ items, isInList, add, remove, refetch: fetchItems }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);

'use client';

import { useQuery } from '@tanstack/react-query';
import { friendships } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

// Polls the count of incoming friend requests for the nav badge. Kept separate
// from useFriends so every page can mount it cheaply (a single head count query).
export function useFriendRequestCount() {
  const { user } = useAuth();
  const { data = 0 } = useQuery({
    queryKey: ['friend-request-count', user?.id],
    queryFn: () => friendships.pendingIncomingCount(user!.id),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return data;
}

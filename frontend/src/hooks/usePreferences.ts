'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { preferences } from '@/lib/db';
import type { UserPreferences } from '@/types';

const DEFAULT_PREFERENCES: UserPreferences = { region: 'US', preferred_provider_ids: [], updated_at: null };

export function usePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['preferences', user?.id] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => preferences.get(user!.id),
    enabled: !!user,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const save = async (region: string, providerIds: number[]) => {
    if (!user) return;
    await preferences.save(user.id, region, providerIds);
    await queryClient.invalidateQueries({ queryKey });
  };

  return { preferences: query.data ?? DEFAULT_PREFERENCES, save, ...query };
}

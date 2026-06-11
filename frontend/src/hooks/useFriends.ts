'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { friendships, profiles, sharedLists, type FriendshipRow } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { FriendEntry, FriendProfile } from '@/types';

type ActionResult = { ok: boolean; message?: string };

interface FriendsData {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

const EMPTY: FriendsData = { friends: [], incoming: [], outgoing: [] };

async function fetchFriends(userId: string): Promise<FriendsData> {
  const rows = await friendships.listFor(userId);
  const otherId = (r: FriendshipRow) => (r.requester_id === userId ? r.addressee_id : r.requester_id);

  // Profiles for everyone we have a relationship with
  const ids = [...new Set(rows.map(otherId))];
  let profileMap: Record<string, FriendProfile> = {};
  let tokenMap: Record<string, string> = {};
  if (ids.length) {
    const [profs, shared] = await Promise.all([
      profiles.getMany(ids),
      sharedLists.getTokens(ids),
    ]);
    profileMap = Object.fromEntries(profs.map(p => [p.id, p]));
    tokenMap = Object.fromEntries(shared.map(s => [s.user_id, s.share_token]));
  }

  const toEntry = (r: FriendshipRow): FriendEntry => {
    const oid = otherId(r);
    return {
      friendshipId: r.id,
      profile: profileMap[oid] || { id: oid, username: 'Unknown', avatar_url: null },
      since: r.created_at,
      shareToken: tokenMap[oid] || null,
    };
  };

  return {
    friends: rows.filter(r => r.status === 'accepted').map(toEntry),
    incoming: rows.filter(r => r.status === 'pending' && r.addressee_id === userId).map(toEntry),
    outgoing: rows.filter(r => r.status === 'pending' && r.requester_id === userId).map(toEntry),
  };
}

export function useFriends() {
  const { user } = useAuth();

  const { data = EMPTY, isLoading, refetch } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => fetchFriends(user!.id),
    enabled: !!user,
  });

  const refetchVoid = useCallback(async () => { await refetch(); }, [refetch]);

  const addFriend = useCallback(async (username: string): Promise<ActionResult> => {
    if (!user) return { ok: false, message: 'Not signed in' };
    const name = username.trim().replace(/^@/, '');
    if (!name) return { ok: false, message: 'Enter a username' };

    const target = await profiles.findByUsername(name);
    if (!target) return { ok: false, message: `No user named "${name}"` };
    if (target.id === user.id) return { ok: false, message: "You can't add yourself" };

    // Existing relationship in either direction?
    const existing = await friendships.between(user.id, target.id);
    if (existing) {
      if (existing.status === 'accepted') return { ok: false, message: `You're already friends with ${target.username}` };
      if (existing.requester_id === user.id) return { ok: false, message: 'Request already sent' };
      // Incoming pending from them -> accept it
      const { error } = await friendships.accept(existing.id);
      if (error) return { ok: false, message: 'Could not accept request' };
      await refetch();
      return { ok: true, message: `You and ${target.username} are now friends` };
    }

    const { error } = await friendships.request(user.id, target.id);
    if (error) return { ok: false, message: 'Could not send request' };
    await refetch();
    return { ok: true, message: `Friend request sent to ${target.username}` };
  }, [user, refetch]);

  const accept = useCallback(async (friendshipId: string): Promise<ActionResult> => {
    const { error } = await friendships.accept(friendshipId);
    if (error) return { ok: false, message: 'Could not accept' };
    await refetch();
    return { ok: true };
  }, [refetch]);

  const remove = useCallback(async (friendshipId: string): Promise<ActionResult> => {
    const { error } = await friendships.remove(friendshipId);
    if (error) return { ok: false, message: 'Could not remove' };
    await refetch();
    return { ok: true };
  }, [refetch]);

  return {
    friends: data.friends,
    incoming: data.incoming,
    outgoing: data.outgoing,
    loading: !!user && isLoading,
    addFriend,
    accept,
    remove,
    refetch: refetchVoid,
  };
}

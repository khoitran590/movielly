'use client';

import { useState, useEffect, useCallback } from 'react';
import { friendships, profiles, sharedLists, type FriendshipRow } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import type { FriendEntry, FriendProfile } from '@/types';

type ActionResult = { ok: boolean; message?: string };

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setFriends([]); setIncoming([]); setOutgoing([]); setLoading(false); return; }
    setLoading(true);

    const rows = await friendships.listFor(user.id);
    const otherId = (r: FriendshipRow) => (r.requester_id === user.id ? r.addressee_id : r.requester_id);

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

    setFriends(rows.filter(r => r.status === 'accepted').map(toEntry));
    setIncoming(rows.filter(r => r.status === 'pending' && r.addressee_id === user.id).map(toEntry));
    setOutgoing(rows.filter(r => r.status === 'pending' && r.requester_id === user.id).map(toEntry));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
      await fetchAll();
      return { ok: true, message: `You and ${target.username} are now friends` };
    }

    const { error } = await friendships.request(user.id, target.id);
    if (error) return { ok: false, message: 'Could not send request' };
    await fetchAll();
    return { ok: true, message: `Friend request sent to ${target.username}` };
  }, [user, fetchAll]);

  const accept = useCallback(async (friendshipId: string): Promise<ActionResult> => {
    const { error } = await friendships.accept(friendshipId);
    if (error) return { ok: false, message: 'Could not accept' };
    await fetchAll();
    return { ok: true };
  }, [fetchAll]);

  const remove = useCallback(async (friendshipId: string): Promise<ActionResult> => {
    const { error } = await friendships.remove(friendshipId);
    if (error) return { ok: false, message: 'Could not remove' };
    await fetchAll();
    return { ok: true };
  }, [fetchAll]);

  return { friends, incoming, outgoing, loading, addFriend, accept, remove, refetch: fetchAll };
}

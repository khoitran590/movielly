'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { FriendEntry, FriendProfile } from '@/types';

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

type ActionResult = { ok: boolean; message?: string };

export function useFriends() {
  const { user } = useAuth();
  const supabase = createClient();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setFriends([]); setIncoming([]); setOutgoing([]); setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const rows = (data || []) as FriendshipRow[];
    const otherId = (r: FriendshipRow) => (r.requester_id === user.id ? r.addressee_id : r.requester_id);

    // Profiles for everyone we have a relationship with
    const ids = [...new Set(rows.map(otherId))];
    let profileMap: Record<string, FriendProfile> = {};
    let tokenMap: Record<string, string> = {};
    if (ids.length) {
      const [{ data: profs }, { data: shared }] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', ids),
        supabase.from('shared_lists').select('user_id, share_token').in('user_id', ids),
      ]);
      profileMap = Object.fromEntries((profs || []).map(p => [p.id, { id: p.id, username: p.username, avatar_url: p.avatar_url }]));
      tokenMap = Object.fromEntries((shared || []).map(s => [s.user_id, s.share_token]));
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

    const { data: target } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', name)
      .limit(1)
      .maybeSingle();

    if (!target) return { ok: false, message: `No user named "${name}"` };
    if (target.id === user.id) return { ok: false, message: "You can't add yourself" };

    // Existing relationship in either direction?
    const { data: existingRows } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`);

    const existing = (existingRows || [])[0] as FriendshipRow | undefined;
    if (existing) {
      if (existing.status === 'accepted') return { ok: false, message: `You're already friends with ${target.username}` };
      if (existing.requester_id === user.id) return { ok: false, message: 'Request already sent' };
      // Incoming pending from them -> accept it
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { ok: false, message: 'Could not accept request' };
      await fetchAll();
      return { ok: true, message: `You and ${target.username} are now friends` };
    }

    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: target.id });
    if (error) return { ok: false, message: 'Could not send request' };
    await fetchAll();
    return { ok: true, message: `Friend request sent to ${target.username}` };
  }, [user, fetchAll]);

  const accept = useCallback(async (friendshipId: string): Promise<ActionResult> => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) return { ok: false, message: 'Could not accept' };
    await fetchAll();
    return { ok: true };
  }, [fetchAll]);

  const remove = useCallback(async (friendshipId: string): Promise<ActionResult> => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) return { ok: false, message: 'Could not remove' };
    await fetchAll();
    return { ok: true };
  }, [fetchAll]);

  return { friends, incoming, outgoing, loading, addFriend, accept, remove, refetch: fetchAll };
}

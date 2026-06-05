'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserPlus, Check, X, Clock, Heart, UserMinus, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import type { FriendEntry } from '@/types';

function Avatar({ entry }: { entry: FriendEntry }) {
  const name = entry.profile.username || 'User';
  return (
    <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 overflow-hidden">
      {entry.profile.avatar_url ? (
        <img src={entry.profile.avatar_url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-brand-light">{name[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const { user, username: myUsername, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { friends, incoming, outgoing, loading, addFriend, accept, remove } = useFriends();
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSending(true);
    const res = await addFriend(username);
    setSending(false);
    toast(res.message || (res.ok ? 'Done' : 'Failed'), res.ok ? 'success' : 'error');
    if (res.ok) setUsername('');
  };

  const handleAccept = async (entry: FriendEntry) => {
    const res = await accept(entry.friendshipId);
    toast(res.ok ? `You and ${entry.profile.username} are now friends` : res.message || 'Failed', res.ok ? 'success' : 'error');
  };

  const handleRemove = async (entry: FriendEntry, verb: string) => {
    const res = await remove(entry.friendshipId);
    toast(res.ok ? `${verb} ${entry.profile.username}` : res.message || 'Failed', res.ok ? 'success' : 'error');
  };

  if (authLoading || !user) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  const row = (entry: FriendEntry, actions: React.ReactNode) => (
    <div key={entry.friendshipId} className="glass glass-interactive rounded-2xl flex items-center gap-3 p-3">
      <Avatar entry={entry} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 line-clamp-1">{entry.profile.username || 'Unknown'}</p>
        <p className="text-xs text-slate-400">
          {new Date(entry.since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-brand" />
          <h1 className="text-2xl font-bold text-white">Friends</h1>
          <span className="glass text-sm text-slate-300 px-2.5 py-0.5 rounded-full">{friends.length}</span>
        </div>
        {myUsername && (
          <p className="text-sm text-slate-400">
            Friends can add you by your username:{' '}
            <span className="font-medium text-brand-light">@{myUsername}</span>
          </p>
        )}
      </div>

      {/* Add a friend */}
      <form onSubmit={handleAdd} className="glass glass-interactive rounded-full flex items-center gap-2 p-1.5 pl-5">
        <UserPlus className="relative z-[1] w-5 h-5 text-slate-300 shrink-0" />
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Add a friend by username…"
          className="relative z-[1] flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-400 py-2"
        />
        <Button type="submit" loading={sending} size="sm" className="relative z-[1] rounded-full">Send Request</Button>
      </form>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Requests <span className="text-brand-light">({incoming.length})</span>
          </h2>
          {incoming.map(entry => row(entry, (
            <>
              <button onClick={() => handleAccept(entry)} className="flex items-center gap-1 rounded-full bg-brand hover:bg-brand-light text-white text-xs font-medium px-3 py-1.5 transition-colors">
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button onClick={() => handleRemove(entry, 'Declined request from')} className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </>
          )))}
        </section>
      )}

      {/* Friends list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Your Friends</h2>
        {loading ? (
          <div className="glass rounded-2xl h-16 animate-pulse" />
        ) : friends.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 text-sm">No friends yet.</p>
            <p className="text-slate-500 text-xs mt-1">Add someone by their username above to get started.</p>
          </div>
        ) : (
          friends.map(entry => row(entry, (
            <>
              <Link
                href={`/user/${entry.profile.id}`}
                className="flex items-center gap-1 rounded-full glass glass-interactive text-slate-200 text-xs font-medium px-3 py-1.5"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-brand-light" /> Watchlist
              </Link>
              {entry.shareToken && (
                <Link
                  href={`/list/${entry.shareToken}`}
                  className="flex items-center gap-1 rounded-full glass glass-interactive text-slate-200 text-xs font-medium px-3 py-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Favorites
                </Link>
              )}
              <button onClick={() => handleRemove(entry, 'Removed')} className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors" title="Remove friend">
                <UserMinus className="w-4 h-4" />
              </button>
            </>
          )))
        )}
      </section>

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Pending <span className="text-slate-500">({outgoing.length})</span>
          </h2>
          {outgoing.map(entry => row(entry, (
            <>
              <span className="flex items-center gap-1 text-xs text-slate-400 px-2">
                <Clock className="w-3.5 h-3.5" /> Sent
              </span>
              <button onClick={() => handleRemove(entry, 'Cancelled request to')} className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors" title="Cancel request">
                <X className="w-4 h-4" />
              </button>
            </>
          )))}
        </section>
      )}
    </div>
  );
}

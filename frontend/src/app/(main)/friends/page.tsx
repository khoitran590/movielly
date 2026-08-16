'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Check, X, UserMinus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import type { FriendEntry } from '@/types';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

function Avatar({ entry }: { entry: FriendEntry }) {
  const name = entry.profile.username || 'User';
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-seat">
      {entry.profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-ui font-semibold text-fog">{name[0]?.toUpperCase() || '?'}</span>
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
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSending(true);
    const res = await addFriend(username);
    setSending(false);
    toast(res.message || (res.ok ? 'Request sent' : 'Failed'), res.ok ? 'success' : 'error');
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

  if (authLoading || !user) return <PageSpinner />;

  const row = (entry: FriendEntry, actions: React.ReactNode, urgent = false) => (
    <li
      key={entry.friendshipId}
      className={`flex items-center gap-3 rounded-panel bg-velvet p-3 ${urgent ? 'border-l-4 border-ticket' : ''}`}
    >
      <Avatar entry={entry} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-ui font-medium text-screen">{entry.profile.username || 'Unknown'}</p>
        {entry.profile.bio ? (
          <p className="line-clamp-1 text-meta text-fog">{entry.profile.bio}</p>
        ) : (
          <p className="font-mono text-meta text-fog">
            {new Date(entry.since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">{actions}</div>
    </li>
  );

  const quietLink = `rounded-full text-ui text-fog transition-colors hover:text-screen ${focusRing}`;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-8 px-5 py-8 sm:px-8">
      <header className="space-y-2">
        <h1 className="font-display text-display-md text-screen">Friends</h1>
        {myUsername && (
          <p className="text-body text-fog">
            Friends add you as <span className="font-mono text-screen">@{myUsername}</span>
          </p>
        )}
      </header>

      <form onSubmit={handleAdd} className="flex items-center gap-2 rounded-full border border-rail bg-velvet p-1.5 pl-5">
        <UserPlus aria-hidden className="w-4 h-4 shrink-0 text-fog" />
        <input
          ref={usernameRef}
          value={username}
          onChange={e => setUsername(e.target.value)}
          aria-label="Friend’s username"
          placeholder="Add a friend by username"
          className="min-w-0 flex-1 bg-transparent py-2 text-ui text-screen placeholder-fog outline-none"
        />
        <Button type="submit" loading={sending} size="sm">Send request</Button>
      </form>

      {incoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">
            Requests <span className="font-mono normal-case tracking-normal text-ticket">{incoming.length}</span>
          </h2>
          <ul className="space-y-2">
            {incoming.map(entry => row(entry, (
              <>
                <Button size="sm" onClick={() => handleAccept(entry)}>
                  <Check className="w-3.5 h-3.5" /> Accept
                </Button>
                <button
                  onClick={() => handleRemove(entry, 'Declined request from')}
                  aria-label={`Decline request from ${entry.profile.username}`}
                  className={`rounded-full p-2 text-fog transition-colors hover:bg-ticket/10 hover:text-ticket ${focusRing}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ), true))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">Your friends</h2>
        {loading ? (
          <div className="h-16 animate-pulse rounded-panel bg-velvet" />
        ) : friends.length === 0 ? (
          <EmptyState
            title="No friends yet."
            description="Send a username above."
            actionLabel="Add a friend"
            onAction={() => usernameRef.current?.focus()}
            className="py-12"
          />
        ) : (
          <ul className="space-y-2">
            {friends.map(entry => row(entry, (
              <>
                <Link href={`/user/${entry.profile.id}`} className={quietLink}>Watched</Link>
                {entry.shareToken && (
                  <Link href={`/list/${entry.shareToken}`} className={quietLink}>Favorites</Link>
                )}
                <button
                  onClick={() => handleRemove(entry, 'Removed')}
                  aria-label={`Remove ${entry.profile.username}`}
                  className={`rounded-full p-2 text-fog transition-colors hover:bg-ticket/10 hover:text-ticket ${focusRing}`}
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </>
            )))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">
            Pending <span className="font-mono normal-case tracking-normal">{outgoing.length}</span>
          </h2>
          <ul className="space-y-2">
            {outgoing.map(entry => row(entry, (
              <>
                <span className="text-ui text-fog">Sent</span>
                <button
                  onClick={() => handleRemove(entry, 'Cancelled request to')}
                  aria-label={`Cancel request to ${entry.profile.username}`}
                  className={`rounded-full p-2 text-fog transition-colors hover:bg-ticket/10 hover:text-ticket ${focusRing}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )))}
          </ul>
        </section>
      )}
    </div>
  );
}

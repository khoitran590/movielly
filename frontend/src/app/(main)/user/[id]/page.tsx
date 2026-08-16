'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { profiles, friendships, watchlist, sharedLists } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { savedToMovie } from '@/lib/api';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import type { WatchlistItem, FriendProfile } from '@/types';

type View = 'loading' | 'ok' | 'not-friends' | 'notfound';

// Guard: ids come from the URL and are interpolated into PostgREST .or() filters,
// so reject anything that isn't a canonical UUID before querying.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [view, setView] = useState<View>('loading');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;
    if (!UUID_RE.test(id)) { setView('notfound'); return; }
    if (user.id === id) { router.replace('/watchlist'); return; }

    let active = true;
    (async () => {
      setView('loading');
      const prof = await profiles.get(id);
      if (!active) return;
      if (!prof) { setView('notfound'); return; }
      setProfile(prof);

      const friendship = await friendships.acceptedBetween(user.id, id);
      if (!active) return;
      if (!friendship) { setView('not-friends'); return; }

      const [wl, token] = await Promise.all([
        watchlist.list(id),
        sharedLists.getToken(id),
      ]);
      if (!active) return;
      setItems(wl as WatchlistItem[]);
      setShareToken(token);
      setView('ok');
    })();
    return () => { active = false; };
  }, [user, id, router]);

  if (authLoading || !user || view === 'loading') return <PageSpinner />;

  const name = profile?.username || 'User';
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-8 px-5 py-8 sm:px-8">
      <Link href="/friends" className={`inline-flex items-center gap-1.5 rounded-full text-ui text-fog transition-colors hover:text-screen ${focusRing}`}>
        <ChevronLeft className="w-4 h-4" /> Friends
      </Link>

      <header className="flex flex-wrap items-center gap-5">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-velvet">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-display-md text-fog">{initial}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-display-md text-screen">@{name}</h1>
          {profile?.bio && <p className="mt-1 line-clamp-2 text-body text-fog">{profile.bio}</p>}
          {view === 'ok' && (
            <p className="mt-1 font-mono text-meta text-fog">{items.length} watched</p>
          )}
        </div>
        {view === 'ok' && shareToken && (
          <Link
            href={`/list/${shareToken}`}
            className={`ml-auto rounded-full border border-rail px-4 py-2 text-ui font-semibold text-screen transition-colors hover:border-screen ${focusRing}`}
          >
            Their favorites
          </Link>
        )}
      </header>

      {view === 'notfound' && (
        <EmptyState title="No one by that name." actionLabel="Back to friends" actionHref="/friends" />
      )}

      {view === 'not-friends' && (
        <EmptyState
          title="This log is private."
          description={`You and @${name} aren’t friends.`}
          actionLabel="Back to friends"
          actionHref="/friends"
        />
      )}

      {view === 'ok' && (
        items.length === 0 ? (
          <EmptyState title={`@${name} hasn’t watched anything yet.`} actionLabel="Back to friends" actionHref="/friends" />
        ) : (
          <div className={GRID_CLASS}>
            {items.map(item => (
              <MovieCard key={item.id} movie={savedToMovie(item)} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { profiles, friendships, watchlist, sharedLists } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { savedToMovie } from '@/lib/api';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import type { WatchlistItem, FriendProfile } from '@/types';

// Guard: ids come from the URL and are interpolated into PostgREST .or() filters,
// so reject anything that isn't a canonical UUID before querying.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProfileData =
  | { view: 'notfound' }
  | { view: 'not-friends'; profile: FriendProfile }
  | { view: 'ok'; profile: FriendProfile; items: WatchlistItem[]; shareToken: string | null };

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const isValidId = !!id && UUID_RE.test(id);
  const isSelf = !!user && user.id === id;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isSelf) router.replace('/watchlist');
  }, [isSelf, router]);

  const { data, isPending } = useQuery({
    queryKey: ['friend-profile', user?.id, id],
    enabled: !!user && isValidId && !isSelf,
    queryFn: async (): Promise<ProfileData> => {
      const [prof, friendship] = await Promise.all([
        profiles.get(id),
        friendships.acceptedBetween(user!.id, id),
      ]);
      if (!prof) return { view: 'notfound' };
      if (!friendship) return { view: 'not-friends', profile: prof };

      const [wl, token] = await Promise.all([
        watchlist.list(id),
        sharedLists.getToken(id),
      ]);
      return { view: 'ok', profile: prof, items: wl as WatchlistItem[], shareToken: token };
    },
  });

  if (authLoading || !user || isSelf) return <PageSpinner />;

  // Invalid ids never hit the query — render not-found directly.
  const result: ProfileData = isValidId
    ? (data ?? { view: 'notfound' })
    : { view: 'notfound' };

  if (isValidId && isPending) return <PageSpinner />;

  const profile = result.view === 'notfound' ? null : result.profile;
  const name = profile?.username || 'User';
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-8 px-5 py-8 sm:px-8">
      <Link href="/friends" className="focus-ring inline-flex items-center gap-1.5 rounded-full text-ui text-fog transition-colors hover:text-screen">
        <ChevronLeft className="w-4 h-4" /> Friends
      </Link>

      <header className="flex flex-wrap items-center gap-5">
        <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-velvet">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill sizes="72px" className="object-cover" />
          ) : (
            <span className="font-display text-display-md text-fog">{initial}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-display-md text-screen">@{name}</h1>
          {profile?.bio && <p className="mt-1 line-clamp-2 text-body text-fog">{profile.bio}</p>}
          {result.view === 'ok' && (
            <p className="mt-1 font-mono text-meta text-fog">{result.items.length} watched</p>
          )}
        </div>
        {result.view === 'ok' && result.shareToken && (
          <Link
            href={`/list/${result.shareToken}`}
            className="focus-ring ml-auto rounded-full border border-rail px-4 py-2 text-ui font-semibold text-screen transition-colors hover:border-screen"
          >
            Their favorites
          </Link>
        )}
      </header>

      {result.view === 'notfound' && (
        <EmptyState title="No one by that name." actionLabel="Back to friends" actionHref="/friends" />
      )}

      {result.view === 'not-friends' && (
        <EmptyState
          title="This log is private."
          description={`You and @${name} aren’t friends.`}
          actionLabel="Back to friends"
          actionHref="/friends"
        />
      )}

      {result.view === 'ok' && (
        result.items.length === 0 ? (
          <EmptyState title={`@${name} hasn’t watched anything yet.`} actionLabel="Back to friends" actionHref="/friends" />
        ) : (
          <div className={GRID_CLASS}>
            {result.items.map(item => (
              <MovieCard key={item.id} movie={savedToMovie(item)} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

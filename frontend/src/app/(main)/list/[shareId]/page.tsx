'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { lists, getPosterUrl, savedToMovie } from '@/lib/api';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS, PosterSkeleton } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import type { SharedList } from '@/types';

// The public face of the product: a printed program, not an internal list.
export default function SharedListPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { data, isPending: loading, isError, refetch } = useQuery<SharedList>({
    queryKey: ['sharedList', shareId],
    queryFn: ({ signal }) => lists.getShared(shareId, signal),
    enabled: !!shareId,
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
        <div className="h-8 w-56 animate-pulse rounded bg-velvet" />
        <PosterSkeleton />
      </div>
    );
  }

  if (isError) {
    return <EmptyState title="This list is taking an intermission." description="We couldn’t load it right now." actionLabel="Try again" onAction={() => void refetch()} />;
  }

  if (!data) {
    return (
      <EmptyState
        title="This list isn’t in the house."
        description="The link may have expired or been removed."
        actionLabel="Go to Movielly"
        actionHref="/"
      />
    );
  }

  const ownerName = data.owner?.username || 'Someone';
  // Three posters, overlapped and faded behind the header: attention, no clutter.
  const backdropPosters = data.items
    .slice(0, 3)
    .map(i => getPosterUrl(i.movie_poster, 'w342'))
    .filter((u): u is string => !!u);

  return (
    <div className="animate-fade-in">
      <header className="relative overflow-hidden border-b border-rail">
        {backdropPosters.length > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-end gap-0 opacity-25"
            style={{ maskImage: 'linear-gradient(to left, black, transparent 70%)', WebkitMaskImage: 'linear-gradient(to left, black, transparent 70%)' }}
          >
            {backdropPosters.map((src, i) => (
              <Image
                key={`${src}-${i}`}
                src={src}
                alt=""
                width={342}
                height={513}
                sizes="342px"
                className="h-[200%] w-auto -ml-16 object-cover"
              />
            ))}
          </div>
        )}

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-10 sm:px-8">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-velvet">
            {data.owner?.avatar_url ? (
              <Image src={data.owner.avatar_url} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <span className="text-title text-fog">{ownerName[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-ui text-fog">{ownerName}’s favorites</p>
            <h1 className="font-display text-display-md text-screen">{data.title}</h1>
            <p className="mt-1 font-mono text-meta text-fog">
              {data.items.length} {data.items.length === 1 ? 'title' : 'titles'}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-8 sm:px-8">
        {data.items.length === 0 ? (
          <EmptyState title={`${ownerName} hasn’t added favorites.`} actionLabel="Go to Movielly" actionHref="/" />
        ) : (
          <div className={GRID_CLASS}>
            {data.items.map((item, i) => (
              <MovieCard key={item.id} movie={savedToMovie(item)} index={i + 1} />
            ))}
          </div>
        )}

        <p className="text-center text-ui text-fog">
          From{' '}
          <Link href="/" className="font-display italic text-screen hover:underline">Movielly</Link>
        </p>
      </div>
    </div>
  );
}

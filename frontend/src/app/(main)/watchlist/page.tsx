'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useMyReviews } from '@/hooks/useUserData';
import { savedToMovie } from '@/lib/api';
import { titleIdentity } from '@/lib/titleIdentity';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';

// The route stays /watchlist so old links keep working; the feature is, and is
// now called, a watched log.
export default function WatchedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { items, isLoading: listLoading, isError: listError, refetch } = useWatchlist();
  const { byTitleIdentity: reviewsByTitle } = useMyReviews();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user || listLoading) return <PageSpinner />;

  const planned = items.filter(item => item.title_status === 'planned');
  const watched = items.filter(item => item.title_status === 'watched');
  const renderItems = (list: typeof items) => <div className={GRID_CLASS}>{list.map(item => {
    const review = reviewsByTitle.get(titleIdentity(item.movie_type, item.movie_id));
    return <MovieCard key={item.id} movie={savedToMovie(item)} note={review ? `${review.rating}/10` : undefined} />;
  })}</div>;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-8 px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-display-md text-screen">Watched</h1>
        <span className="font-mono text-meta text-fog">
          {watched.length} {watched.length === 1 ? 'title' : 'titles'}
        </span>
        <p className="w-full text-body text-fog">Titles you’ve finished.</p>
      </header>

      {listError ? (
        <EmptyState title="Your watched log is unavailable right now." description="Your saved titles are safe. Please try again." actionLabel="Try again" onAction={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing saved yet." description="Build a watchlist, then mark a title watched when the credits roll." actionLabel="Browse titles" actionHref="/" />
      ) : (
        <div className="space-y-10">
          {planned.length > 0 && <section className="space-y-3"><h2 className="font-display text-title text-screen">Want to watch <span className="font-mono text-meta text-fog">{planned.length}</span></h2>{renderItems(planned)}</section>}
          {watched.length > 0 && <section className="space-y-3"><h2 className="font-display text-title text-screen">Watched <span className="font-mono text-meta text-fog">{watched.length}</span></h2>{renderItems(watched)}</section>}
        </div>
      )}
    </div>
  );
}

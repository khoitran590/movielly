'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useMyReviews } from '@/hooks/useUserData';
import { savedToMovie } from '@/lib/api';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';

// The route stays /watchlist so old links keep working; the feature is, and is
// now called, a watched log.
export default function WatchedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { items, refetch } = useWatchlist();
  const { byMovieId: reviewsByMovie } = useMyReviews();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => { refetch(); }, []);

  if (loading || !user) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-8 px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-display-md text-screen">Watched</h1>
        <span className="font-mono text-meta text-fog">
          {items.length} {items.length === 1 ? 'title' : 'titles'}
        </span>
        <p className="w-full text-body text-fog">Titles you’ve finished.</p>
      </header>

      {items.length === 0 ? (
        <EmptyState title="Nothing watched yet." actionLabel="Browse titles" actionHref="/" />
      ) : (
        <div className={GRID_CLASS}>
          {items.map(item => {
            const review = reviewsByMovie.get(item.movie_id);
            return (
              <MovieCard
                key={item.id}
                movie={savedToMovie(item)}
                note={review ? `${review.rating}/10` : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

import MovieCard from './MovieCard';
import EmptyState from '@/components/ui/EmptyState';
import type { Movie } from '@/types';

interface MovieGridProps {
  movies: Movie[];
  loading?: boolean;
  /** Bodoni headline for the empty state. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  onEmptyAction?: () => void;
  /** Numbers the posters (shared lists, where the owner chose the order). */
  numbered?: boolean;
}

export const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6';

export function PosterSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-poster bg-velvet" />
      ))}
    </div>
  );
}

export default function MovieGrid({
  movies,
  loading = false,
  emptyTitle = 'Nothing here.',
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  onEmptyAction,
  numbered = false,
}: MovieGridProps) {
  if (loading) return <PosterSkeleton />;

  if (movies.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={GRID_CLASS}>
      {movies.map((movie, i) => (
        <MovieCard
          key={`${movie.media_type || 'movie'}-${movie.id}`}
          movie={movie}
          index={numbered ? i + 1 : undefined}
        />
      ))}
    </div>
  );
}

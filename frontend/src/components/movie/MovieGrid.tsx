import MovieCard from './MovieCard';
import type { Movie } from '@/types';
import { Film } from 'lucide-react';

interface MovieGridProps {
  movies: Movie[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function MovieGrid({ movies, loading = false, emptyMessage = 'No movies found.' }: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-700 border border-surface-600 overflow-hidden animate-pulse">
            <div className="aspect-[2/3] bg-surface-600" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-surface-600 rounded w-3/4" />
              <div className="h-2.5 bg-surface-600 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Film className="w-14 h-14 text-slate-600 mb-4" />
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {movies.map(movie => (
        <MovieCard key={`${movie.media_type || 'movie'}-${movie.id}`} movie={movie} />
      ))}
    </div>
  );
}

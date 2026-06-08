'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Tv, Film, BookmarkPlus, BookmarkCheck, Heart } from 'lucide-react';
import { getPosterUrl, getMovieTitle, getYear } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const favorites = useFavorites();
  const { toast } = useToast();

  const isTV = movie.media_type === 'tv' || (!movie.title && !!movie.name);
  const href = isTV ? `/tv/${movie.id}` : `/movie/${movie.id}`;
  const poster = getPosterUrl(movie.poster_path);
  const title = getMovieTitle(movie);
  const year = getYear(movie);
  const inWatchlist = watchlist.isInList(movie.id);
  const inFavorites = favorites.isInList(movie.id);

  const payload = () => ({
    movie_id: movie.id,
    movie_title: title,
    movie_poster: movie.poster_path,
    movie_type: (isTV ? 'tv' : 'movie') as 'tv' | 'movie',
  });

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (inWatchlist) {
      await watchlist.remove(movie.id);
      toast(`Removed “${title}” from watchlist`);
    } else {
      await watchlist.add(payload());
      toast(`Marked “${title}” as watched`);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (inFavorites) {
      await favorites.remove(movie.id);
      toast(`Removed “${title}” from favorites`);
    } else {
      await favorites.add(payload());
      toast(`Added “${title}” to favorites`);
    }
  };

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-surface-700 border border-surface-600 transition-all duration-300 group-hover:border-brand/50 group-hover:shadow-xl group-hover:shadow-brand/10 group-hover:-translate-y-1">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-600">
              {isTV ? <Tv className="w-12 h-12 text-slate-600" /> : <Film className="w-12 h-12 text-slate-600" />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isTV ? 'bg-blue-600/80 text-blue-100' : 'bg-brand/80 text-white'} backdrop-blur-sm`}>
              {isTV ? 'TV' : 'Film'}
            </span>
          </div>
          {movie.vote_average > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Star className="w-3 h-3 fill-gold text-gold" />
              <span className="text-xs font-semibold text-white">{movie.vote_average.toFixed(1)}</span>
            </div>
          )}

          {/* Quick action toggles: favorite (heart) + watched (bookmark) */}
          <div className="absolute bottom-2 right-2 z-[2] flex items-center gap-1.5">
            <button
              onClick={toggleFavorite}
              aria-label={inFavorites ? 'Remove from favorites' : 'Add to favorites'}
              title={inFavorites ? 'In your favorites' : 'Add to favorites'}
              className={`flex items-center justify-center w-9 h-9 rounded-full border backdrop-blur-sm transition-all duration-200 ${
                inFavorites
                  ? 'bg-red-500/90 border-red-400 text-white'
                  : 'bg-black/55 border-white/20 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500/80 hover:border-red-400 max-[640px]:opacity-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${inFavorites ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={toggleWatchlist}
              aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              title={inWatchlist ? 'Watched — in your watchlist' : 'Mark as watched'}
              className={`flex items-center justify-center w-9 h-9 rounded-full border backdrop-blur-sm transition-all duration-200 ${
                inWatchlist
                  ? 'bg-brand/90 border-brand text-white'
                  : 'bg-black/55 border-white/20 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-brand/80 hover:border-brand max-[640px]:opacity-100'
              }`}
            >
              {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-slate-100 line-clamp-1 group-hover:text-brand-light transition-colors">
            {title}
          </h3>
          {year && <p className="text-xs text-slate-500 mt-0.5">{year}</p>}
        </div>
      </div>
    </Link>
  );
}

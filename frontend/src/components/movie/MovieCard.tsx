'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const [isHovered, setIsHovered] = useState(false);

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
      <motion.div
        className="relative flex flex-col gap-2 overflow-hidden rounded-3xl border border-gray-800 bg-black/80 p-2 backdrop-blur-sm shadow-[0_25px_50px_-15px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 35px 60px -15px rgba(0,0,0,0.7)',
          borderColor: 'rgba(255,255,255,0.2)',
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Header row: media type badge + rating */}
        <div className="flex items-center justify-between px-1.5 pt-1">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
              isTV ? 'bg-blue-600/80 text-blue-100' : 'bg-brand/80 text-white'
            }`}
          >
            {isTV ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
            {isTV ? 'TV' : 'Film'}
          </span>
          {movie.vote_average > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
              <Star className="w-3 h-3 fill-gold text-gold" />
              <span className="text-xs font-semibold text-white">{movie.vote_average.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Poster with blurred echo glow behind it */}
        <div className="image relative">
          {poster && (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl opacity-25">
              <motion.div
                className="h-full w-full"
                animate={{ scale: isHovered ? 1.06 : 1 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              >
                <Image
                  src={poster}
                  alt=""
                  aria-hidden
                  fill
                  className="object-cover blur-md scale-125 opacity-80"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </motion.div>
            </div>
          )}
          <motion.div
            className="relative z-10 p-1.5"
            whileHover={{ scale: 1.03 }}
            transition={{ ease: 'easeInOut' }}
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-lg">
              {poster ? (
                <Image
                  src={poster}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-600">
                  {isTV ? <Tv className="w-12 h-12 text-slate-600" /> : <Film className="w-12 h-12 text-slate-600" />}
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
          </motion.div>
        </div>

        {/* Title + year */}
        <div className="relative z-10 px-2 pb-2 text-center">
          <h3 className="text-sm font-bold line-clamp-1 bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-purple-300 transition-colors">
            {title}
          </h3>
          {year && <p className="mt-0.5 text-xs font-light text-neutral-400">{year}</p>}
        </div>
      </motion.div>
    </Link>
  );
}

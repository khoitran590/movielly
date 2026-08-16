'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, BookmarkPlus, BookmarkCheck, Heart } from 'lucide-react';
import { movies as movieApi, getBackdropUrl, getMovieTitle, getYear } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import { useReducedMotion } from '@/hooks/useMedia';
import Modal from '@/components/ui/Modal';
import type { Movie } from '@/types';

const HERO_HEIGHT = 'h-[min(78vh,640px)] md:h-[min(72vh,760px)]';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

const ghostAction =
  `inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(243,237,227,0.25)] bg-ink/40 px-5 text-ui font-semibold text-screen backdrop-blur-sm transition-colors hover:border-screen ${focusRing}`;

export function NowShowingSkeleton() {
  return <div className={`${HERO_HEIGHT} w-full animate-pulse bg-velvet`} />;
}

// The one place the design spends its boldness: the week's top title as a
// full-bleed still, its name set like a festival poster, one primary action.
export default function NowShowing({ movie }: { movie: Movie }) {
  const router = useRouter();
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const favorites = useFavorites();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();
  const [trailerId, setTrailerId] = useState<string | null>(null);

  const isTV = movie.media_type === 'tv' || (!movie.title && !!movie.name);
  const type = isTV ? 'tv' : 'movie';
  const href = `/${type}/${movie.id}`;
  const title = getMovieTitle(movie);
  const year = getYear(movie);
  const backdrop = getBackdropUrl(movie.backdrop_path, 'w1280');

  const { data: primaryTrailer } = useQuery({
    queryKey: ['trailer', type, movie.id],
    queryFn: () => movieApi.trailer(type, movie.id),
  });
  const primaryTrailerId = primaryTrailer?.youtube_video_id ?? null;

  const inWatchlist = watchlist.isInList(movie.id);
  const inFavorites = favorites.isInList(movie.id);

  const payload = () => ({
    movie_id: movie.id,
    movie_title: title,
    movie_poster: movie.poster_path,
    movie_type: type as 'tv' | 'movie',
  });

  const toggleWatchlist = async () => {
    if (!user) { router.push('/login'); return; }
    if (inWatchlist) { await watchlist.remove(movie.id); toast(`Removed ${title} from Watched`); }
    else { await watchlist.add(payload()); toast(`Marked ${title} as watched`); }
  };

  const toggleFavorite = async () => {
    if (!user) { router.push('/login'); return; }
    if (inFavorites) { await favorites.remove(movie.id); toast(`Removed ${title} from Favorites`); }
    else { await favorites.add(payload()); toast(`Added ${title} to Favorites`); }
  };

  const meta = [year, isTV ? 'Series' : 'Film', movie.vote_average > 0 ? `★ ${movie.vote_average.toFixed(1)}` : null]
    .filter(Boolean)
    .join('  ·  ');

  const blurb = movie.overview
    ? movie.overview.length > 140 ? `${movie.overview.slice(0, 139).trimEnd()}…` : movie.overview
    : null;

  // Enter once: backdrop fades, title rises, actions follow.
  const rise = (delay: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className={`relative ${HERO_HEIGHT} w-full overflow-hidden`}>
      {backdrop && (
        <motion.div
          className="absolute inset-0"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Image src={backdrop} alt="" aria-hidden fill priority className="object-cover" sizes="100vw" />
        </motion.div>
      )}
      {/* The backdrop is the background — two scrims keep the title readable. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, #0B0A09 0%, #0B0A09 18%, transparent 62%)' }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, #0B0A09 0%, transparent 55%)' }}
      />

      <div className="relative flex h-full items-end">
        <div className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 sm:pb-14">
          <div className="max-w-[720px]">
            <motion.p
              {...rise(0)}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-tungsten"
            >
              Now Showing
            </motion.p>

            <motion.h1
              {...rise(0.08)}
              className="mt-3 line-clamp-2 font-display text-display-lg text-screen md:text-display-xl"
            >
              {title}
            </motion.h1>

            <motion.p {...rise(0.14)} className="mt-3 font-mono text-meta text-fog">
              {meta}
            </motion.p>

            {blurb && (
              <motion.p {...rise(0.16)} className="mt-3 max-w-[560px] text-body text-fog">
                {blurb}
              </motion.p>
            )}

            <motion.div {...rise(0.2)} className="mt-6 flex flex-wrap items-center gap-3">
              {primaryTrailerId ? (
                <button
                  onClick={() => setTrailerId(primaryTrailerId)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full bg-tungsten px-5 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim ${focusRing}`}
                >
                  <Play className="w-4 h-4 fill-ink" /> Watch trailer
                </button>
              ) : (
                <Link
                  href={href}
                  className={`inline-flex h-10 items-center gap-2 rounded-full bg-tungsten px-5 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim ${focusRing}`}
                >
                  View title
                </Link>
              )}

              <button
                onClick={toggleWatchlist}
                className={`${ghostAction} ${inWatchlist ? 'border-tungsten bg-tungsten text-ink hover:border-tungsten' : ''}`}
              >
                {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                {inWatchlist ? 'Watched' : 'Mark watched'}
              </button>

              <button
                onClick={toggleFavorite}
                aria-label={inFavorites ? 'Remove from favorites' : 'Add to favorites'}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(243,237,227,0.25)] bg-ink/40 text-screen backdrop-blur-sm transition-colors hover:border-ticket ${focusRing} ${
                  inFavorites ? 'border-ticket bg-ticket text-white' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${inFavorites ? 'fill-white' : ''}`} />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <Modal
        open={trailerId !== null}
        onClose={() => setTrailerId(null)}
        title={`${title} — Trailer`}
        maxWidth="max-w-3xl"
      >
        {trailerId && (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
              title={`${title} trailer`}
              className="h-full w-full rounded-poster"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}
      </Modal>
    </section>
  );
}

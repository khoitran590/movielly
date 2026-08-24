'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Play, BookmarkPlus, BookmarkCheck, Heart } from 'lucide-react';
import { movies as movieApi, getBackdropUrl, getYear } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import { useTitleActions } from '@/hooks/useTitleActions';
import Modal from '@/components/ui/Modal';
import type { Movie } from '@/types';

const HERO_HEIGHT = 'h-[min(78vh,640px)] md:h-[min(72vh,760px)]';

const ghostAction =
  'focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(243,237,227,0.25)] bg-ink/40 px-5 text-ui font-semibold text-screen backdrop-blur-sm transition-colors hover:border-screen';

export function NowShowingSkeleton() {
  return <div className={`${HERO_HEIGHT} w-full animate-pulse bg-velvet`} />;
}

// The one place the design spends its boldness: the week's top title as a
// full-bleed still, its name set like a festival poster, one primary action.
export default function NowShowing({ movie }: { movie: Movie }) {
  const [trailerId, setTrailerId] = useState<string | null>(null);

  const { isTV, type, href, title, inWatchlist, inFavorites, toggleWatchlist, toggleFavorite } = useTitleActions(movie);
  const year = getYear(movie);
  const backdrop = getBackdropUrl(movie.backdrop_path, 'w1280');

  const { data: primaryTrailer } = useQuery({
    queryKey: ['trailer', type, movie.id],
    queryFn: ({ signal }) => movieApi.trailer(type, movie.id, signal),
    staleTime: QUERY_STALE_TIME.trailersAndSimilar,
  });
  const primaryTrailerId = primaryTrailer?.youtube_video_id ?? null;

  const meta = [year, isTV ? 'Series' : 'Film', movie.vote_average > 0 ? `★ ${movie.vote_average.toFixed(1)}` : null]
    .filter(Boolean)
    .join('  ·  ');

  const blurb = movie.overview
    ? movie.overview.length > 140 ? `${movie.overview.slice(0, 139).trimEnd()}…` : movie.overview
    : null;

  return (
    <section className={`theme-dark relative ${HERO_HEIGHT} w-full overflow-hidden`}>
      {backdrop && (
        <div className="hero-fade absolute inset-0">
          <Image src={backdrop} alt="" aria-hidden fill priority className="object-cover" sizes="100vw" />
        </div>
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
            <p
              className="hero-enter font-mono text-caption uppercase tracking-[0.16em] text-tungsten"
            >
              Now Showing
            </p>

            <h1
              style={{ animationDelay: '80ms' }}
              className="hero-enter mt-3 line-clamp-2 font-display text-display-lg text-screen md:text-display-xl"
            >
              {title}
            </h1>

            <p style={{ animationDelay: '140ms' }} className="hero-enter mt-3 font-mono text-meta text-fog">
              {meta}
            </p>

            {blurb && (
              <p style={{ animationDelay: '160ms' }} className="hero-enter mt-3 max-w-[560px] text-body text-fog">
                {blurb}
              </p>
            )}

            <div style={{ animationDelay: '200ms' }} className="hero-enter mt-6 flex flex-wrap items-center gap-3">
              {primaryTrailerId ? (
                <button
                  onClick={() => setTrailerId(primaryTrailerId)}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-tungsten px-5 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim"
                >
                  <Play className="w-4 h-4 fill-ink" /> Watch trailer
                </button>
              ) : (
                <Link
                  href={href}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-tungsten px-5 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim"
                >
                  View title
                </Link>
              )}

              <button
                onClick={() => void toggleWatchlist()}
                className={`${ghostAction} ${inWatchlist ? 'border-tungsten bg-tungsten text-ink hover:border-tungsten' : ''}`}
              >
                {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                {inWatchlist ? 'Watched' : 'Mark watched'}
              </button>

              <button
                onClick={() => void toggleFavorite()}
                aria-label={inFavorites ? 'Remove from favorites' : 'Add to favorites'}
                className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(243,237,227,0.25)] bg-ink/40 text-screen backdrop-blur-sm transition-colors hover:border-ticket ${
                  inFavorites ? 'border-ticket bg-ticket text-white' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${inFavorites ? 'fill-white' : ''}`} />
              </button>
            </div>
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

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import type { Movie } from '@/types';

interface PosterRailProps {
  title: string;
  movies: Movie[];
  /** Short editorial hook shown above the rail title. */
  eyebrow?: string;
  /** A little context helps a shelf feel curated instead of generic. */
  description?: string;
  /** "View all" target. Omit to hide the link. */
  href?: string;
  onViewAll?: () => void;
  loading?: boolean;
}

const CARD_WIDTH = 'w-[132px] sm:w-[148px] md:w-[168px]';

export function RailSkeleton({ title }: { title?: string }) {
  return (
    <section className="space-y-3">
      {title && <h2 className="text-body font-semibold text-screen">{title}</h2>}
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${CARD_WIDTH} shrink-0 aspect-[2/3] animate-pulse rounded-poster bg-velvet`} />
        ))}
      </div>
    </section>
  );
}

// A quiet horizontal shelf of posters. Native overflow scroll with snap points,
// chevrons only where there is a real pointer to click them with.
export default function PosterRail({ title, movies, eyebrow, description, href, onViewAll, loading = false }: PosterRailProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const uniqueMovies = Array.from(
    new Map(movies.map(movie => [`${movie.media_type || 'movie'}-${movie.id}`, movie])).values()
  );

  if (loading) return <RailSkeleton title={title} />;
  // A rail that failed to load is omitted entirely rather than shown empty.
  if (uniqueMovies.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="group/rail relative space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          {eyebrow && <p className="font-mono text-caption uppercase tracking-[0.14em] text-tungsten">{eyebrow}</p>}
          <h2 className="text-body font-semibold text-screen">{title}</h2>
          {description && <p className="mt-0.5 text-meta text-fog">{description}</p>}
        </div>
        {href && (
          <Link href={href} className="focus-ring rounded-full text-ui text-fog transition-colors hover:text-screen">
            View all →
          </Link>
        )}
        {!href && onViewAll && (
          <button onClick={onViewAll} className="focus-ring rounded-full text-ui text-fog transition-colors hover:text-screen">
            View all →
          </button>
        )}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          aria-label={title}
          role="region"
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:gap-4"
        >
          {uniqueMovies.map(movie => (
            <div key={`${movie.media_type || 'movie'}-${movie.id}`} className={`${CARD_WIDTH} shrink-0 snap-start`}>
              <MovieCard movie={movie} variant="rail" />
            </div>
          ))}
        </div>

        {(['left', 'right'] as const).map(side => (
          <button
            key={side}
            type="button"
            onClick={() => scrollBy(side === 'right' ? 1 : -1)}
            aria-label={`Scroll ${title} ${side}`}
            className={`focus-ring absolute ${side === 'left' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} top-[42%] z-[3] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-rail bg-ink/90 text-screen opacity-0 transition-opacity hover:bg-seat group-hover/rail:opacity-100 focus-visible:opacity-100 [@media(pointer:fine)]:flex`}
          >
            {side === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </section>
  );
}

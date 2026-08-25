'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film, Tv, BookmarkPlus, BookmarkCheck, Heart, ListPlus } from 'lucide-react';
import { getPosterUrl, getYear } from '@/lib/api';
import { useTitleActions } from '@/hooks/useTitleActions';
import type { Movie } from '@/types';

export type MovieCardVariant = 'poster' | 'rail' | 'row';

interface MovieCardProps {
  movie: Movie;
  variant?: MovieCardVariant;
  /** Ordinal caption on the art — only for lists whose order the owner chose. */
  index?: number;
  /** Short mono line under the meta, e.g. the viewer's own rating. */
  note?: string;
}

// The card is the poster. No panel, no blurred echo, no pills on the art.
export default function MovieCard({ movie, variant = 'poster', index, note }: MovieCardProps) {
  const { isTV, href, title, inWatchlist, inWantToWatch, inFavorites, toggleWatchlist, toggleWantToWatch, toggleFavorite } = useTitleActions(movie);
  const poster = getPosterUrl(movie.poster_path);
  const year = getYear(movie);

  const meta = [year, isTV ? 'Series' : null, movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null]
    .filter(Boolean)
    .join('  ·  ');

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleWatchlist();
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite();
  };

  const handleWantToWatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleWantToWatch();
  };

  if (variant === 'row') {
    return (
      <Link href={href} className="focus-ring group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-seat">
        <span className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-poster bg-velvet">
          {poster
            ? <Image src={poster} alt={title} fill className="object-cover" sizes="40px" />
            : <span className="flex h-full items-center justify-center">{isTV ? <Tv className="w-4 h-4 text-fog" /> : <Film className="w-4 h-4 text-fog" />}</span>}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-ui font-semibold text-screen">{title}</span>
          {year && <span className="block font-mono text-meta text-fog">{year}</span>}
        </span>
      </Link>
    );
  }

  const isRail = variant === 'rail';
  const renderingStyle = isRail
    ? undefined
    : { contentVisibility: 'auto', containIntrinsicSize: '300px 450px' } as React.CSSProperties;

  return (
    <Link href={href} style={renderingStyle} className="focus-ring group block rounded-poster">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-poster bg-velvet transition-shadow group-hover:shadow-poster">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            className="poster-zoom object-cover"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {isTV ? <Tv className="w-8 h-8 text-rail" /> : <Film className="w-8 h-8 text-rail" />}
          </div>
        )}

        {index !== undefined && (
          <span className="absolute left-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-caption text-screen">
            {String(index).padStart(2, '0')}
          </span>
        )}

        <div className="poster-actions absolute bottom-2 right-2 z-[2] flex items-center gap-1.5">
          <button
            onClick={handleFavorite}
            aria-label={inFavorites ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            className={`focus-ring flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              inFavorites
                ? 'border-ticket bg-ticket text-white'
                : 'border-[rgba(243,237,227,0.15)] bg-ink/70 text-screen hover:border-ticket'
            }`}
          >
            <Heart className={`w-4 h-4 ${inFavorites ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={handleWantToWatch}
            aria-label={inWantToWatch ? `Remove ${title} from want to watch` : `Add ${title} to want to watch`}
            className={`focus-ring flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              inWantToWatch
                ? 'border-tungsten bg-seat text-tungsten'
                : 'border-[rgba(243,237,227,0.15)] bg-ink/70 text-screen hover:border-tungsten'
            }`}
          >
            <ListPlus className="w-4 h-4" />
          </button>
          <button
            onClick={handleWatchlist}
            aria-label={inWatchlist ? `Remove ${title} from watched` : `Mark ${title} as watched`}
            className={`focus-ring flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              inWatchlist
                ? 'border-tungsten bg-tungsten text-ink'
                : 'border-[rgba(243,237,227,0.15)] bg-ink/70 text-screen hover:border-tungsten'
            }`}
          >
            {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="line-clamp-1 text-card font-semibold text-screen">{title}</h3>
        {meta && <p className="mt-0.5 font-mono text-meta text-fog">{meta}</p>}
        {note && <p className="mt-0.5 font-mono text-meta text-tungsten">{note}</p>}
      </div>
    </Link>
  );
}

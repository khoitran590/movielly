'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Tv, BookmarkPlus, BookmarkCheck, Heart } from 'lucide-react';
import { getPosterUrl, getMovieTitle, getYear } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
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

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

// The card is the poster. No panel, no blurred echo, no pills on the art.
export default function MovieCard({ movie, variant = 'poster', index, note }: MovieCardProps) {
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

  const meta = [year, isTV ? 'Series' : null, movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null]
    .filter(Boolean)
    .join('  ·  ');

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
      toast(`Removed ${title} from Watched`);
    } else {
      await watchlist.add(payload());
      toast(`Marked ${title} as watched`);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (inFavorites) {
      await favorites.remove(movie.id);
      toast(`Removed ${title} from Favorites`);
    } else {
      await favorites.add(payload());
      toast(`Added ${title} to Favorites`);
    }
  };

  if (variant === 'row') {
    return (
      <Link href={href} className={`group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-seat ${focusRing}`}>
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

  return (
    <Link href={href} className={`group block rounded-poster ${focusRing}`}>
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
          <span className="absolute left-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[11px] text-screen">
            {String(index).padStart(2, '0')}
          </span>
        )}

        {/* Rail cards carry their title over the art on desktop hover. */}
        {isRail && (
          <div className="rail-caption pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-ink via-ink/70 to-transparent p-2 pt-8 md:block">
            <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-screen">{title}</p>
            {meta && <p className="mt-0.5 font-mono text-[11px] text-fog">{meta}</p>}
          </div>
        )}

        <div className="poster-actions absolute bottom-2 right-2 z-[2] flex items-center gap-1.5">
          <button
            onClick={toggleFavorite}
            aria-label={inFavorites ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${focusRing} ${
              inFavorites
                ? 'border-ticket bg-ticket text-white'
                : 'border-[rgba(243,237,227,0.15)] bg-ink/70 text-screen hover:border-ticket'
            }`}
          >
            <Heart className={`w-4 h-4 ${inFavorites ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={toggleWatchlist}
            aria-label={inWatchlist ? `Remove ${title} from watched` : `Mark ${title} as watched`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${focusRing} ${
              inWatchlist
                ? 'border-tungsten bg-tungsten text-ink'
                : 'border-[rgba(243,237,227,0.15)] bg-ink/70 text-screen hover:border-tungsten'
            }`}
          >
            {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Rail titles live on the art from md up; below that, under it. */}
      <div className={`mt-2 ${isRail ? 'md:hidden' : ''}`}>
        <h3 className="line-clamp-1 text-[14px] font-semibold text-screen">{title}</h3>
        {meta && <p className="mt-0.5 font-mono text-meta text-fog">{meta}</p>}
        {note && <p className="mt-0.5 font-mono text-meta text-tungsten">{note}</p>}
      </div>
    </Link>
  );
}

'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import PosterWall from './PosterWall';
import Wordmark from '@/components/layout/Wordmark';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { movies, getPosterUrl } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';

// Two-pane auth: form on the left, the scrolling poster wall on the right.
// On a phone there is no wall, so a single blurred still keeps the screen from
// being a blank ink slab.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { data: posters = [] } = useQuery({
    queryKey: ['authArtwork'],
    queryFn: async ({ signal }) => {
      const [firstPage, secondPage] = await Promise.all([
        movies.popular('movie', 1, signal),
        movies.popular('movie', 2, signal),
      ]);
      return [...firstPage.results, ...secondPage.results]
        .map(movie => getPosterUrl(movie.poster_path, 'w342'))
        .filter((url): url is string => !!url);
    },
    staleTime: QUERY_STALE_TIME.browse,
  });
  const backdrop = posters[0] || null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="relative flex items-center justify-center overflow-hidden px-5 py-12">
        <div className="absolute right-5 top-5 z-10"><ThemeToggle /></div>
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1023px) 100vw, 1px"
            className="pointer-events-none scale-110 object-cover opacity-20 blur-2xl lg:hidden"
          />
        )}
        <div className="relative w-full max-w-md animate-slide-up space-y-8">
          <Wordmark />
          {children}
        </div>
      </div>

      {/* Right — poster wall (desktop only) */}
      <div className="theme-dark relative hidden overflow-hidden border-l border-rail bg-ink lg:block">
        <PosterWall posters={posters} />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-ink/40 to-ink" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/70" />

        <div className="pointer-events-none absolute bottom-12 left-12 right-12 z-10">
          <h2 className="font-display text-display-md leading-tight text-screen">
            What you watch is who you are.
          </h2>
          <p className="mt-3 text-body text-fog">Rate it. Keep it. Pass it to a friend.</p>
        </div>
      </div>
    </div>
  );
}

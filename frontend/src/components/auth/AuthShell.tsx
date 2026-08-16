'use client';

import { useEffect, useState } from 'react';
import PosterWall from './PosterWall';
import Wordmark from '@/components/layout/Wordmark';
import { movies, getPosterUrl } from '@/lib/api';

// Two-pane auth: form on the left, the scrolling poster wall on the right.
// On a phone there is no wall, so a single blurred still keeps the screen from
// being a blank ink slab.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const [backdrop, setBackdrop] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    movies.popular('movie', 1)
      .then(r => {
        const url = getPosterUrl(r.results[0]?.poster_path, 'w780');
        if (active) setBackdrop(url);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="relative flex items-center justify-center overflow-hidden px-5 py-12">
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backdrop}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-2xl lg:hidden"
          />
        )}
        <div className="relative w-full max-w-md animate-slide-up space-y-8">
          <Wordmark />
          {children}
        </div>
      </div>

      {/* Right — poster wall (desktop only) */}
      <div className="relative hidden overflow-hidden border-l border-rail bg-ink lg:block">
        <PosterWall />

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

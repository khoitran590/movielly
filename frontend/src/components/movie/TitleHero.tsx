'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getPosterUrl, getBackdropUrl } from '@/lib/api';
import type { Genre } from '@/types';

interface TitleHeroProps {
  title: string;
  backdropPath: string | null;
  posterPath: string | null;
  /** Plex Mono line, e.g. "2024  ·  2h 46m  ·  ★ 8.4". */
  meta: string;
  voteCount?: number;
  genres?: Genre[];
  tagline?: string | null;
  actions: React.ReactNode;
}

// A still from the film, then the credits. Shared by /movie/[id] and /tv/[id] —
// they differ in data, never in layout.
export default function TitleHero({
  title,
  backdropPath,
  posterPath,
  meta,
  voteCount,
  genres,
  tagline,
  actions,
}: TitleHeroProps) {
  const router = useRouter();
  const backdrop = getBackdropUrl(backdropPath);
  const poster = getPosterUrl(posterPath, 'w342');

  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-[min(70vh,720px)] overflow-hidden">
        {backdrop ? (
          <Image src={backdrop} alt="" aria-hidden fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-velvet" />
        )}
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
      </div>

      <button
        onClick={() => router.back()}
        className="focus-ring absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink/40 px-3 py-1.5 text-ui text-screen backdrop-blur-sm transition-colors hover:bg-ink/70 sm:left-8"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-[min(44vh,400px)] sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          {poster && (
            <div className="w-40 shrink-0 md:w-[200px]">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-poster shadow-poster ring-1 ring-[rgba(243,237,227,0.12)]">
                <Image src={poster} alt={title} fill className="object-cover" sizes="(max-width: 768px) 160px, 200px" />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-3">
            <h1 className="font-display text-display-lg text-screen md:text-display-hero">{title}</h1>

            <p className="font-mono text-meta text-screen">
              {meta}
              {voteCount ? <span className="text-fog"> ({voteCount.toLocaleString()})</span> : null}
            </p>

            {genres && genres.length > 0 && (
              <p className="text-ui text-fog">{genres.map(g => g.name).join('  ·  ')}</p>
            )}

            {tagline && <p className="text-body italic text-fog">{tagline}</p>}

            <div className="flex flex-wrap items-center gap-2 pt-2">{actions}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

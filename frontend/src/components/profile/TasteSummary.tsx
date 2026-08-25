'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getPosterUrl } from '@/lib/api';
import { useGenreCatalog } from '@/hooks/useGenreCatalog';
import type { TopMovie } from '@/types';

interface TasteSummaryProps {
  genres: number[];
  topMovies: TopMovie[];
}

// Read-only view of the two "basic info" blocks a profile now carries:
// the genres someone would defend in an argument, and their all-time top five.
export default function TasteSummary({ genres, topMovies }: TasteSummaryProps) {
  const { nameOf } = useGenreCatalog();
  const named = genres.map(id => ({ id, name: nameOf(id) })).filter(g => g.name);

  if (named.length === 0 && topMovies.length === 0) return null;

  return (
    <div className="space-y-8">
      {named.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-title text-screen">Genres they’d defend in an argument</h2>
          <ul className="flex flex-wrap gap-2">
            {named.map(genre => (
              <li
                key={genre.id}
                className="rounded-full border border-rail bg-velvet px-3 py-1.5 text-ui text-screen"
              >
                {genre.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {topMovies.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-title text-screen">Their all-time top five</h2>
          <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {topMovies.map((movie, index) => {
              const poster = getPosterUrl(movie.poster);
              return (
              <li key={`${movie.type}-${movie.id}`} className="min-w-0 space-y-2">
                <Link
                  href={`/${movie.type}/${movie.id}`}
                  className="focus-ring group relative block aspect-[2/3] overflow-hidden rounded-xl bg-velvet"
                >
                  {poster ? (
                    <Image
                      src={poster}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-caption text-fog">
                      No poster
                    </span>
                  )}
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 font-mono text-caption text-tungsten">
                    {index + 1}
                  </span>
                </Link>
                <p className="line-clamp-2 break-words text-meta text-fog">{movie.title}</p>
              </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

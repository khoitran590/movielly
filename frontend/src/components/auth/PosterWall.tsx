'use client';

import { useEffect, useState } from 'react';
import { movies, getPosterUrl } from '@/lib/api';

// Three vertically-scrolling columns of popular movie posters.
export default function PosterWall() {
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([movies.popular('movie', 1), movies.popular('movie', 2)])
      .then(([a, b]) => {
        const urls = [...a.results, ...b.results]
          .map(m => getPosterUrl(m.poster_path, 'w342'))
          .filter((u): u is string => !!u);
        if (active) setPosters(urls);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (posters.length === 0) return null;

  const columns = [0, 1, 2].map(c => posters.filter((_, i) => i % 3 === c));
  const animations = ['posterScrollUp', 'posterScrollDown', 'posterScrollUp'];
  const durations = ['58s', '74s', '64s'];

  return (
    <div className="absolute inset-0 flex gap-3 p-3">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 overflow-hidden">
          <div
            className="flex flex-col will-change-transform"
            style={{ animation: `${animations[ci]} ${durations[ci]} linear infinite` }}
          >
            {[...col, ...col].map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="w-full mb-3 rounded-xl object-cover aspect-[2/3] border border-surface-600/50 shadow-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

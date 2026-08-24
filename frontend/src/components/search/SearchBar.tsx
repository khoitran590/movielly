'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

type SearchType = 'all' | 'movie' | 'tv';

const readType = (value: string | null): SearchType =>
  value === 'movie' || value === 'tv' ? value : 'all';

export default function SearchBar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';
  const currentType = readType(searchParams.get('type'));
  const [query, setQuery] = useState(currentQuery);
  const [type, setType] = useState<SearchType>(currentType);

  useEffect(() => setQuery(currentQuery), [currentQuery]);
  useEffect(() => setType(currentType), [currentType]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    const value = query.trim();
    if (value) {
      next.set('q', value);
      next.delete('sort');
      next.delete('view');
    }
    else next.delete('q');
    if (type === 'all') next.delete('type');
    else next.set('type', type);
    if (type !== currentType) next.delete('genre');
    const href = next.size ? `/?${next.toString()}` : '/';
    router.push(href);
    onNavigate?.();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search a film or series"
            placeholder="Search a film or series"
            className="focus-ring w-full rounded-full border border-rail bg-velvet py-2 pl-10 pr-4 text-ui text-screen placeholder:text-fog transition-colors focus:border-tungsten"
          />
        </div>
        <label className="sr-only" htmlFor="search-type">Title type</label>
        <select
          id="search-type"
          value={type}
          onChange={(event) => setType(event.target.value as SearchType)}
          className="focus-ring w-24 rounded-full border border-rail bg-velvet px-3 text-ui text-screen transition-colors focus:border-tungsten sm:w-28"
        >
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV shows</option>
        </select>
      </div>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => setQuery(currentQuery), [currentQuery]);

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
    const href = next.size ? `/?${next.toString()}` : '/';
    router.push(href);
    onNavigate?.();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="relative">
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
    </form>
  );
}

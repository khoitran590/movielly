'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, TrendingUp, Film, Tv } from 'lucide-react';
import { movies as movieApi, getMovieTitle } from '@/lib/api';
import MovieGrid from '@/components/movie/MovieGrid';
import type { Movie } from '@/types';

type Tab = 'trending' | 'movies' | 'tv';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [tab, setTab] = useState<Tab>('trending');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResults([]);

    const fetch = async () => {
      try {
        if (query) {
          const type = tab === 'movies' ? 'movie' : tab === 'tv' ? 'tv' : 'multi';
          const data = await movieApi.search(query, 1, type);
          if (!cancelled) {
            setResults(data.results.filter(m => m.media_type !== 'person' && (m.poster_path || m.backdrop_path)));
            setTotalPages(data.total_pages);
          }
        } else {
          if (tab === 'trending') {
            const data = await movieApi.trending('week', 'all');
            if (!cancelled) setResults(data.results.filter(m => m.media_type !== 'person'));
          } else {
            const data = await movieApi.popular(tab === 'movies' ? 'movie' : 'tv');
            if (!cancelled) {
              setResults(data.results.map(m => ({ ...m, media_type: tab === 'movies' ? 'movie' : 'tv' })));
              setTotalPages(data.total_pages);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [query, tab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) { router.push('/'); return; }
    router.push(`/?q=${encodeURIComponent(q)}`);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'movies', label: 'Movies', icon: <Film className="w-4 h-4" /> },
    { id: 'tv', label: 'TV Shows', icon: <Tv className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {!query && (
        <section className="text-center py-12 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Your movie universe,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">organized.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Discover films, write reviews, build your watchlist, and share your favorites.
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex max-w-lg mx-auto gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type="search"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search any movie or TV show..."
                className="w-full bg-surface-700 border border-surface-500 text-slate-100 placeholder-slate-500 rounded-xl py-3 pl-11 pr-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-brand hover:bg-brand-light text-white font-medium rounded-xl transition-colors shadow-lg shadow-brand/25">
              Search
            </button>
          </form>
        </section>
      )}

      {query && (
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-6">
            Results for <span className="text-brand-light">"{query}"</span>
          </h2>
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-surface-600 pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-brand text-brand-light'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <MovieGrid
        movies={results}
        loading={loading}
        emptyMessage={query ? `No results for "${query}"` : 'Nothing to show right now.'}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

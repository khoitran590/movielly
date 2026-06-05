'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, TrendingUp, Film, Tv, Sparkles } from 'lucide-react';
import { movies as movieApi } from '@/lib/api';
import MovieGrid from '@/components/movie/MovieGrid';
import Aurora from '@/components/ui/Aurora';
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
          }
        } else {
          if (tab === 'trending') {
            const data = await movieApi.trending('week', 'all');
            if (!cancelled) setResults(data.results.filter(m => m.media_type !== 'person'));
          } else {
            const data = await movieApi.popular(tab === 'movies' ? 'movie' : 'tv');
            if (!cancelled) {
              setResults(data.results.map(m => ({ ...m, media_type: tab === 'movies' ? 'movie' : 'tv' })));
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
    <>
      <Aurora />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!query && (
          <section className="relative py-10 sm:py-16">
            {/* Hero card — Liquid Glass */}
            <div className="glass glass-brand rounded-[2rem] px-6 sm:px-12 py-12 sm:py-16 text-center overflow-hidden">
              <div className="relative z-[1] space-y-7">
                <div className="glass glass-interactive inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-brand-light" />
                  Discover your next favorite
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
                  Your movie universe,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-fuchsia-400 to-sky-400">
                    crystal clear.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300/90 max-w-xl mx-auto">
                  Search films & shows, write reviews, build your watchlist, and share your favorites.
                </p>

                {/* Glass search bar */}
                <form onSubmit={handleSearch} className="max-w-xl mx-auto">
                  <div className="glass glass-interactive flex items-center gap-2 rounded-full p-1.5 pl-5">
                    <Search className="relative z-[1] w-5 h-5 text-slate-300 shrink-0" />
                    <input
                      ref={inputRef}
                      type="search"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Search any movie or TV show..."
                      className="relative z-[1] flex-1 bg-transparent border-0 outline-none text-base text-slate-100 placeholder-slate-400 py-2.5"
                    />
                    <button
                      type="submit"
                      className="relative z-[1] shrink-0 rounded-full bg-brand hover:bg-brand-light text-white font-medium px-6 py-2.5 text-sm transition-colors shadow-lg shadow-brand/30"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {query && (
          <h2 className="text-xl font-semibold text-slate-100">
            Results for <span className="text-brand-light">&ldquo;{query}&rdquo;</span>
          </h2>
        )}

        {/* Glass segmented control */}
        <div className="flex justify-center sm:justify-start">
          <div className="glass rounded-full p-1.5 inline-flex items-center gap-1">
            {tabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    active
                      ? 'glass glass-interactive text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <MovieGrid
          movies={results}
          loading={loading}
          emptyMessage={query ? `No results for "${query}"` : 'Nothing to show right now.'}
        />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Film, Tv, Sparkles, SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import { movies as movieApi } from '@/lib/api';
import MovieGrid from '@/components/movie/MovieGrid';
import { LampContainer } from '@/components/ui/lamp';
import { GlassEffect } from '@/components/ui/liquid-glass';
import type { Movie } from '@/types';

type Tab = 'trending' | 'movies' | 'tv';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [tab, setTab] = useState<Tab>('trending');
  const [genre, setGenre] = useState<number | null>(null);
  const [genreOpen, setGenreOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const genreRef = useRef<HTMLDivElement>(null);

  const mediaType: 'movie' | 'tv' = tab === 'tv' ? 'tv' : 'movie';

  useEffect(() => { setInput(query); }, [query]);

  // Genre list for the active media type (cached per type); reset the
  // selection when the type changes.
  const { data: genres = [] } = useQuery({
    queryKey: ['genres', mediaType],
    queryFn: () => movieApi.genres(mediaType),
    staleTime: 24 * 60 * 60 * 1000, // genre lists are effectively static
  });
  useEffect(() => { setGenre(null); }, [mediaType]);

  // Close the genre menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) setGenreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Browse results — React Query keys on the full filter state, so previously
  // visited tab/genre/search combinations come back instantly from cache.
  const { data: results = [], isPending: loading } = useQuery({
    queryKey: ['browse', { query, tab, genre }],
    queryFn: async (): Promise<Movie[]> => {
      if (query) {
        const type = tab === 'movies' ? 'movie' : tab === 'tv' ? 'tv' : 'multi';
        const data = await movieApi.search(query, 1, type);
        let res = data.results.filter(m => m.media_type !== 'person' && (m.poster_path || m.backdrop_path));
        if (genre) res = res.filter(m => (m.genre_ids || []).includes(genre));
        return res;
      }
      if (genre) {
        const data = await movieApi.discover(mediaType, genre);
        return data.results.map(m => ({ ...m, media_type: mediaType }));
      }
      if (tab === 'trending') {
        const data = await movieApi.trending('week', 'all');
        return data.results.filter(m => m.media_type !== 'person');
      }
      const data = await movieApi.popular(mediaType);
      return data.results.map(m => ({ ...m, media_type: mediaType }));
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'movies', label: 'Movies', icon: <Film className="w-4 h-4" /> },
    { id: 'tv', label: 'TV Shows', icon: <Tv className="w-4 h-4" /> },
  ];

  const selectedGenreName = genre ? genres.find(g => g.id === genre)?.name : null;

  const searchBar = (
    <form onSubmit={handleSearch} className="mx-auto w-full max-w-2xl">
      <GlassEffect className="rounded-full w-full">
        <div className="flex items-center gap-1 p-1.5 pl-5 w-full font-normal">
          <Search className="w-5 h-5 text-slate-200 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search any movie or TV show..."
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-white placeholder-slate-300 py-2.5"
          />

          {/* Genre filter */}
          <div ref={genreRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setGenreOpen(v => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all duration-300 ${
                genre ? 'bg-white/25 text-white' : 'text-slate-200 hover:bg-white/15 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline max-w-[7rem] truncate">{selectedGenreName || 'Genre'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${genreOpen ? 'rotate-180' : ''}`} />
            </button>

            {genreOpen && (
              <div className="absolute right-0 top-12 w-56 z-50">
                <GlassEffect className="rounded-2xl w-full">
                  <div className="max-h-80 overflow-y-auto p-1.5">
                    <button
                      type="button"
                      onClick={() => { setGenre(null); setGenreOpen(false); }}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm text-white hover:bg-white/15 transition-colors"
                    >
                      All genres
                      {!genre && <Check className="w-4 h-4 text-white" />}
                    </button>
                    {genres.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { setGenre(g.id); setGenreOpen(false); }}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm text-white hover:bg-white/15 transition-colors text-left"
                      >
                        {g.name}
                        {genre === g.id && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    ))}
                  </div>
                </GlassEffect>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-full bg-brand hover:bg-brand-light text-white font-medium px-5 sm:px-6 py-2.5 text-sm transition-colors shadow-lg shadow-brand/30"
          >
            Search
          </button>
        </div>
      </GlassEffect>
    </form>
  );

  return (
    <>
      {/* Lamp hero: light beam reveal over the headline + search (logged-out & no active search) */}
      {!query && (
        <LampContainer className="min-h-[52rem] [&>div:last-child]:-translate-y-64">
          <motion.div
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
            className="flex w-full flex-col items-center space-y-6 text-center"
          >
            <div className="glass glass-interactive inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-brand-light" />
              Discover your next favorite
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
              Your cinema and TV shows universe<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-sky-300 to-blue-300 drop-shadow-[0_0_20px_rgba(186,230,253,0.35)]">
                All in one place.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300/90 max-w-xl mx-auto">
              Search films &amp; shows, write reviews, track what you&apos;ve watched, and share your favorites.
            </p>
            {searchBar}
          </motion.div>
        </LampContainer>
      )}

      {/* When the lamp hero is shown, overlap its empty lower region so the
          grid starts right under the search bar. */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 ${!query ? 'relative z-10 -mt-48' : ''}`}>
        {query && (
          <div className="space-y-5">
            {searchBar}
            <h2 className="text-xl font-semibold text-slate-100">
              Results for <span className="text-brand-light">&ldquo;{query}&rdquo;</span>
              {selectedGenreName && <span className="text-slate-400 text-base font-normal"> · {selectedGenreName}</span>}
            </h2>
          </div>
        )}

        {/* Segmented control — same liquid-glass material as the dock */}
        <div className="flex justify-center sm:justify-start">
          <GlassEffect className="rounded-full">
            <div className="flex items-center gap-1 p-1.5 font-normal">
              {tabs.map(t => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      active ? 'bg-white/25 text-white' : 'text-slate-200 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </GlassEffect>
        </div>

        <MovieGrid
          movies={results}
          loading={loading}
          emptyMessage={
            query
              ? `No results for "${query}"${selectedGenreName ? ` in ${selectedGenreName}` : ''}`
              : 'Nothing to show right now.'
          }
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

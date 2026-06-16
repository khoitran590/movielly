'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Film, Tv, Sparkles, SlidersHorizontal, Check, ChevronDown, Star } from 'lucide-react';
import { movies as movieApi } from '@/lib/api';
import MovieGrid from '@/components/movie/MovieGrid';
import { LampContainer } from '@/components/ui/lamp';
import { GlassEffect } from '@/components/ui/liquid-glass';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Movie } from '@/types';

type Tab = 'trending' | 'movies' | 'tv';
type TypeFilter = 'all' | 'movie' | 'tv';
type SortKey = 'popularity' | 'rating_desc' | 'rating_asc';

const SORT_OPTIONS: { id: SortKey; label: string; sortBy: string }[] = [
  { id: 'popularity', label: 'Most popular', sortBy: 'popularity.desc' },
  { id: 'rating_desc', label: 'Rating: best to worst', sortBy: 'vote_average.desc' },
  { id: 'rating_asc', label: 'Rating: worst to best', sortBy: 'vote_average.asc' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);

const movieYear = (m: Movie) => {
  const date = m.release_date || m.first_air_date;
  return date ? Number(date.slice(0, 4)) : null;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [tab, setTab] = useState<Tab>('trending');
  const [genre, setGenre] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [year, setYear] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('popularity');
  const [filterOpen, setFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The type filter (when set) wins over the tab when deciding which catalog
  // to browse and which genre list to show.
  const mediaType: 'movie' | 'tv' =
    typeFilter !== 'all' ? typeFilter : tab === 'tv' ? 'tv' : 'movie';

  useEffect(() => { setInput(query); }, [query]);

  // Genre list for the active media type (cached per type); reset the
  // selection when the type changes.
  const { data: genres = [] } = useQuery({
    queryKey: ['genres', mediaType],
    queryFn: () => movieApi.genres(mediaType),
    staleTime: 24 * 60 * 60 * 1000, // genre lists are effectively static
  });
  useEffect(() => { setGenre(null); }, [mediaType]);

  const sortBy = SORT_OPTIONS.find(o => o.id === sort)!.sortBy;

  // Order a result list by the active sort. Discover requests are sorted
  // server-side, but search results (and the rating order applied on top of
  // them) are sorted here.
  const applySort = (list: Movie[]): Movie[] => {
    if (sort === 'rating_desc') return [...list].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    if (sort === 'rating_asc') return [...list].sort((a, b) => (a.vote_average ?? 0) - (b.vote_average ?? 0));
    return list;
  };

  // Browse results — React Query keys on the full filter state, so previously
  // visited tab/genre/search combinations come back instantly from cache.
  const { data: results = [], isPending: loading } = useQuery({
    queryKey: ['browse', { query, tab, genre, typeFilter, year, sort }],
    queryFn: async (): Promise<Movie[]> => {
      if (query) {
        const type =
          typeFilter !== 'all' ? typeFilter : tab === 'movies' ? 'movie' : tab === 'tv' ? 'tv' : 'multi';
        const data = await movieApi.search(query, 1, type);
        let res = data.results.filter(m => m.media_type !== 'person' && (m.poster_path || m.backdrop_path));
        if (typeFilter !== 'all') res = res.filter(m => (m.media_type || typeFilter) === typeFilter);
        if (genre) res = res.filter(m => (m.genre_ids || []).includes(genre));
        if (year) res = res.filter(m => movieYear(m) === year);
        return applySort(res);
      }
      if (genre || year || typeFilter !== 'all' || sort !== 'popularity') {
        const data = await movieApi.discover(mediaType, genre, year, sortBy);
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
  const sortIsCustom = sort !== 'popularity';
  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) + (genre ? 1 : 0) + (year ? 1 : 0) + (sortIsCustom ? 1 : 0);
  const sortShortLabel = sort === 'rating_desc' ? 'Top rated' : sort === 'rating_asc' ? 'Lowest rated' : null;
  const filterLabel =
    [typeFilter !== 'all' ? (typeFilter === 'tv' ? 'TV' : 'Movies') : null, selectedGenreName, year, sortShortLabel]
      .filter(Boolean)
      .join(' · ') || 'Filters';

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

          {/* Filters: type (movie/TV), genre, year, sort by rating */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all duration-300 ${
                  activeFilterCount ? 'bg-white/25 text-white' : 'text-slate-200 hover:bg-white/15 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[10rem] truncate">{filterLabel}</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={10}
              className="w-72 border-0 bg-transparent p-0 shadow-none"
            >
              <GlassEffect className="rounded-2xl w-full">
                <div className="max-h-[26rem] overflow-y-auto p-3 space-y-3">
                  {/* Type */}
                  <div>
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Type</p>
                    <div className="flex gap-1.5">
                      {([
                        { id: 'all', label: 'All' },
                        { id: 'movie', label: 'Movies' },
                        { id: 'tv', label: 'TV Shows' },
                      ] as { id: TypeFilter; label: string }[]).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTypeFilter(t.id)}
                          className={`flex-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
                            typeFilter === t.id ? 'bg-white/25 text-white' : 'text-slate-200 hover:bg-white/15'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort by rating */}
                  <div>
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Sort by</p>
                    <div className="space-y-0.5">
                      {SORT_OPTIONS.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setSort(o.id)}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm text-white hover:bg-white/15 transition-colors text-left"
                        >
                          <span className="flex items-center gap-2">
                            {o.id !== 'popularity' && <Star className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                            {o.label}
                          </span>
                          {sort === o.id && <Check className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year */}
                  <div>
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Year</p>
                    <select
                      value={year ?? ''}
                      onChange={e => setYear(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white outline-none hover:bg-white/15 transition-colors [&>option]:bg-surface-800 [&>option]:text-white"
                    >
                      <option value="">Any year</option>
                      {YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Genre */}
                  <div>
                    <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Genre</p>
                    <div className="max-h-44 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setGenre(null)}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm text-white hover:bg-white/15 transition-colors"
                      >
                        All genres
                        {!genre && <Check className="w-4 h-4 text-white" />}
                      </button>
                      {genres.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGenre(g.id)}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm text-white hover:bg-white/15 transition-colors text-left"
                        >
                          {g.name}
                          {genre === g.id && <Check className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setTypeFilter('all'); setGenre(null); setYear(null); setSort('popularity'); }}
                      className="w-full rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </GlassEffect>
            </PopoverContent>
          </Popover>

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

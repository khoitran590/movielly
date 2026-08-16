'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Check, ChevronDown, X } from 'lucide-react';
import { movies as movieApi } from '@/lib/api';
import MovieGrid from '@/components/movie/MovieGrid';
import PosterRail from '@/components/movie/PosterRail';
import NowShowing, { NowShowingSkeleton } from '@/components/home/NowShowing';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import type { Movie } from '@/types';

type TypeFilter = 'all' | 'movie' | 'tv';
type SortKey = 'popularity' | 'rating_desc' | 'rating_asc';
/** Which rail's "View all" put the page into grid mode. */
type ViewAll = null | 'trending' | 'movie' | 'tv';

const SORT_OPTIONS: { id: SortKey; label: string; sortBy: string }[] = [
  { id: 'popularity', label: 'Most popular', sortBy: 'popularity.desc' },
  { id: 'rating_desc', label: 'Rating: best to worst', sortBy: 'vote_average.desc' },
  { id: 'rating_asc', label: 'Rating: worst to best', sortBy: 'vote_average.asc' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

const movieYear = (m: Movie) => {
  const date = m.release_date || m.first_air_date;
  return date ? Number(date.slice(0, 4)) : null;
};

// One option row inside the filter popover.
function OptionRow({ label, selected, onClick }: { label: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-ui transition-colors hover:bg-seat ${
        selected ? 'text-screen' : 'text-fog'
      } ${focusRing}`}
    >
      {label}
      {selected && <Check className="w-4 h-4 shrink-0 text-tungsten" />}
    </button>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-tungsten/40 bg-tungsten/10 px-3 py-1 text-ui text-tungsten transition-colors hover:border-tungsten ${focusRing}`}
    >
      {label}
      <X className="w-3.5 h-3.5" />
    </button>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [genre, setGenre] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [year, setYear] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('popularity');
  const [viewAll, setViewAll] = useState<ViewAll>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { user } = useAuth();
  const watchlist = useWatchlist();
  const favorites = useFavorites();

  useEffect(() => { setInput(query); }, [query]);

  const mediaType: 'movie' | 'tv' =
    typeFilter !== 'all' ? typeFilter : viewAll === 'tv' ? 'tv' : 'movie';

  const { data: genres = [] } = useQuery({
    queryKey: ['genres', mediaType],
    queryFn: () => movieApi.genres(mediaType),
    staleTime: 24 * 60 * 60 * 1000, // genre lists are effectively static
  });
  useEffect(() => { setGenre(null); }, [mediaType]);

  const selectedGenreName = genre ? genres.find(g => g.id === genre)?.name : null;
  const sortIsCustom = sort !== 'popularity';
  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) + (genre ? 1 : 0) + (year ? 1 : 0) + (sortIsCustom ? 1 : 0);
  // A query, a filter, or a "View all" turns the page from rails into a grid.
  const resultsMode = !!query || activeFilterCount > 0 || viewAll !== null;

  const sortBy = SORT_OPTIONS.find(o => o.id === sort)!.sortBy;

  const applySort = (list: Movie[]): Movie[] => {
    if (sort === 'rating_desc') return [...list].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    if (sort === 'rating_asc') return [...list].sort((a, b) => (a.vote_average ?? 0) - (b.vote_average ?? 0));
    return list;
  };

  // ── Idle home: one hero + three rails ──────────────────────────────
  const { data: trending = [], isPending: trendingLoading } = useQuery({
    queryKey: ['trending', 'week', 'all'],
    queryFn: async () => (await movieApi.trending('week', 'all')).results.filter(m => m.media_type !== 'person'),
    enabled: !resultsMode,
  });

  const { data: popularFilms = [], isPending: filmsLoading } = useQuery({
    queryKey: ['popular', 'movie'],
    queryFn: async () => (await movieApi.popular('movie')).results.map(m => ({ ...m, media_type: 'movie' as const })),
    enabled: !resultsMode,
  });

  const { data: popularSeries = [], isPending: seriesLoading } = useQuery({
    queryKey: ['popular', 'tv'],
    queryFn: async () => (await movieApi.popular('tv')).results.map(m => ({ ...m, media_type: 'tv' as const })),
    enabled: !resultsMode,
  });

  // Now Showing: the first trending title that has a still to fill the screen,
  // falling back to popular films.
  const featured = trending.find(m => m.backdrop_path) || popularFilms.find(m => m.backdrop_path) || null;
  const trendingRail = featured ? trending.filter(m => m.id !== featured.id) : trending;

  // ── Your shelf: similar titles to the most recent thing they saved ──
  const shelfSeed = favorites.items[0] || watchlist.items[0] || null;
  const { data: shelf = [] } = useQuery({
    queryKey: ['similar', shelfSeed?.movie_type, shelfSeed?.movie_id],
    queryFn: async () => {
      const type = shelfSeed!.movie_type;
      const list = await movieApi.similar(type, shelfSeed!.movie_id);
      return list.map(m => ({ ...m, media_type: type }));
    },
    enabled: !resultsMode && !!user && !!shelfSeed,
  });

  // ── Results grid ────────────────────────────────────────────────────
  const { data: results = [], isPending: resultsLoading } = useQuery({
    queryKey: ['browse', { query, genre, typeFilter, year, sort, viewAll }],
    queryFn: async (): Promise<Movie[]> => {
      if (query) {
        const type = typeFilter !== 'all' ? typeFilter : 'multi';
        const data = await movieApi.search(query, 1, type);
        let res = data.results.filter(m => m.media_type !== 'person' && (m.poster_path || m.backdrop_path));
        if (typeFilter !== 'all') res = res.filter(m => (m.media_type || typeFilter) === typeFilter);
        if (genre) res = res.filter(m => (m.genre_ids || []).includes(genre));
        if (year) res = res.filter(m => movieYear(m) === year);
        return applySort(res);
      }
      if (viewAll === 'trending' && activeFilterCount === 0) {
        const data = await movieApi.trending('week', 'all');
        return data.results.filter(m => m.media_type !== 'person');
      }
      const data = await movieApi.discover(mediaType, genre, year, sortBy);
      return data.results.map(m => ({ ...m, media_type: mediaType }));
    },
    enabled: resultsMode,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setGenre(null);
    setYear(null);
    setSort('popularity');
    setViewAll(null);
  };

  const sortShortLabel = sort === 'rating_desc' ? 'Top rated' : sort === 'rating_asc' ? 'Lowest rated' : null;

  const heading = query
    ? <>Results for <span className="text-tungsten">“{query}”</span></>
    : viewAll === 'trending' ? 'Trending this week'
    : typeFilter === 'tv' || viewAll === 'tv' ? 'Series'
    : typeFilter === 'movie' || viewAll === 'movie' ? 'Films'
    : 'Browse';

  const searchBar = (
    <form onSubmit={handleSearch} className="mx-auto w-full max-w-[640px]">
      <div className="flex items-center gap-1 rounded-full border border-rail bg-velvet p-1.5 pl-5">
        <Search aria-hidden className="w-4 h-4 shrink-0 text-fog" />
        <input
          type="search"
          value={input}
          onChange={e => setInput(e.target.value)}
          aria-label="Search a film or series"
          placeholder="Search a film or series"
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-ui text-screen placeholder-fog outline-none"
        />

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-ui transition-colors ${
                activeFilterCount ? 'text-tungsten' : 'text-fog hover:text-screen'
              } ${focusRing}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown aria-hidden className={`w-3.5 h-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-72 rounded-panel border border-rail bg-velvet p-0 text-screen"
          >
            <div className="max-h-[26rem] space-y-4 overflow-y-auto p-3">
              <div>
                <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fog">Type</p>
                <div className="flex gap-1.5">
                  {([
                    { id: 'all', label: 'All' },
                    { id: 'movie', label: 'Films' },
                    { id: 'tv', label: 'Series' },
                  ] as { id: TypeFilter; label: string }[]).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id)}
                      className={`flex-1 rounded-full px-3 py-1.5 text-ui transition-colors ${
                        typeFilter === t.id ? 'bg-tungsten text-ink' : 'text-fog hover:bg-seat hover:text-screen'
                      } ${focusRing}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fog">Sort by</p>
                {SORT_OPTIONS.map(o => (
                  <OptionRow key={o.id} label={o.label} selected={sort === o.id} onClick={() => setSort(o.id)} />
                ))}
              </div>

              <div>
                <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fog">Year</p>
                <div className="max-h-44 overflow-y-auto pr-1">
                  <OptionRow label="Any year" selected={!year} onClick={() => setYear(null)} />
                  {YEARS.map(y => (
                    <OptionRow
                      key={y}
                      label={<span className="font-mono">{y}</span>}
                      selected={year === y}
                      onClick={() => setYear(y)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fog">Genre</p>
                <div className="max-h-44 overflow-y-auto pr-1">
                  <OptionRow label="All genres" selected={!genre} onClick={() => setGenre(null)} />
                  {genres.map(g => (
                    <OptionRow key={g.id} label={g.name} selected={genre === g.id} onClick={() => setGenre(g.id)} />
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`w-full rounded-lg px-3 py-2 text-ui text-fog transition-colors hover:bg-seat hover:text-screen ${focusRing}`}
                >
                  Clear filters
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="submit"
          className={`shrink-0 rounded-full bg-tungsten px-5 py-2 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim ${focusRing}`}
        >
          Search
        </button>
      </div>
    </form>
  );

  const chips = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {viewAll === 'trending' && <FilterChip label="Trending" onRemove={() => setViewAll(null)} />}
      {typeFilter !== 'all' && (
        <FilterChip
          label={typeFilter === 'tv' ? 'Series' : 'Films'}
          // "Popular films" sets both, so clearing the chip must clear both —
          // otherwise the grid would stay up with nothing explaining why.
          onRemove={() => { setTypeFilter('all'); if (viewAll !== 'trending') setViewAll(null); }}
        />
      )}
      {selectedGenreName && <FilterChip label={selectedGenreName} onRemove={() => setGenre(null)} />}
      {year && <FilterChip label={String(year)} onRemove={() => setYear(null)} />}
      {sortShortLabel && <FilterChip label={sortShortLabel} onRemove={() => setSort('popularity')} />}
    </div>
  );

  const hasChips =
    viewAll === 'trending' || typeFilter !== 'all' || !!selectedGenreName || !!year || !!sortShortLabel;

  return (
    <>
      {!resultsMode && (
        featured
          ? <NowShowing movie={featured} />
          : (trendingLoading || filmsLoading) ? <NowShowingSkeleton /> : null
      )}

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-6 sm:px-8">
        {resultsMode && (
          <h1 className="font-display text-display-md text-screen">{heading}</h1>
        )}

        {searchBar}
        {hasChips && chips}

        {resultsMode ? (
          <MovieGrid
            movies={results}
            loading={resultsLoading}
            emptyTitle={query ? `Nothing under “${query}”.` : 'Nothing matches those filters.'}
            emptyActionLabel={query ? 'Clear search' : 'Clear filters'}
            emptyActionHref={query ? '/' : undefined}
            onEmptyAction={query ? undefined : clearFilters}
          />
        ) : (
          <div className="space-y-10">
            {shelfSeed && shelf.length > 0 && (
              <PosterRail title={`Because you saved ${shelfSeed.movie_title}`} movies={shelf} />
            )}
            <PosterRail
              title="Trending this week"
              movies={trendingRail.slice(0, 16)}
              loading={trendingLoading}
              onViewAll={() => setViewAll('trending')}
            />
            <PosterRail
              title="Popular films"
              movies={popularFilms.slice(0, 16)}
              loading={filmsLoading}
              onViewAll={() => { setTypeFilter('movie'); setViewAll('movie'); }}
            />
            <PosterRail
              title="Popular series"
              movies={popularSeries.slice(0, 16)}
              loading={seriesLoading}
              onViewAll={() => { setTypeFilter('tv'); setViewAll('tv'); }}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<NowShowingSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

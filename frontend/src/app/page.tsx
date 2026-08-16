'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { movies as movieApi } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import MovieGrid, { PosterSkeleton } from '@/components/movie/MovieGrid';
import PosterRail from '@/components/movie/PosterRail';
import NowShowing, { NowShowingSkeleton } from '@/components/home/NowShowing';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import type { Genre, Movie } from '@/types';

type TypeFilter = 'all' | 'movie' | 'tv';
type SortKey = 'popularity' | 'rating_desc' | 'rating_asc';

const SORT_OPTIONS: { id: SortKey; label: string; sortBy: string }[] = [
  { id: 'popularity', label: 'Most popular', sortBy: 'popularity.desc' },
  { id: 'rating_desc', label: 'Rating: best to worst', sortBy: 'vote_average.desc' },
  { id: 'rating_asc', label: 'Rating: worst to best', sortBy: 'vote_average.asc' },
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_DECADE = Math.floor(CURRENT_YEAR / 10) * 10;
const YEAR_OPTIONS = [
  { value: `${CURRENT_DECADE}s`, label: `${CURRENT_DECADE}s` },
  { value: `${CURRENT_DECADE - 10}s`, label: `${CURRENT_DECADE - 10}s` },
  { value: `${CURRENT_DECADE - 20}s`, label: `${CURRENT_DECADE - 20}s` },
  { value: `${CURRENT_DECADE - 30}s`, label: `${CURRENT_DECADE - 30}s` },
  { value: 'older', label: 'Older' },
];

const parseType = (value: string | null): TypeFilter =>
  value === 'movie' || value === 'tv' ? value : 'all';

const parseSort = (value: string | null): SortKey =>
  value === 'rating_desc' || value === 'rating_asc' ? value : 'popularity';

const parseGenre = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseYear = (value: string | null) => {
  if (!value) return null;
  if (value === 'older' || /^\d{4}s$/.test(value)) return value;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1874 && parsed <= CURRENT_YEAR + 5 ? String(parsed) : null;
};

const movieYear = (movie: Movie) => {
  const date = movie.release_date || movie.first_air_date;
  return date ? Number(date.slice(0, 4)) : null;
};

function yearRange(value: string | null) {
  if (!value) return {};
  if (/^\d{4}$/.test(value)) return { year: Number(value) };
  if (value === 'older') return { dateFrom: '1874-01-01', dateTo: `${CURRENT_DECADE - 31}-12-31` };
  const start = Number(value.slice(0, 4));
  return { dateFrom: `${start}-01-01`, dateTo: `${Math.min(start + 9, CURRENT_YEAR + 5)}-12-31` };
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter ${label}`}
      className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-tungsten/40 bg-tungsten/10 px-3 py-1 text-ui text-tungsten transition-colors hover:border-tungsten"
    >
      {label}<X className="h-3.5 w-3.5" />
    </button>
  );
}

interface FilterControlsProps {
  typeFilter: TypeFilter;
  sort: SortKey;
  year: string | null;
  genre: number | null;
  genres: Genre[];
  query: string;
  onChange: (key: 'type' | 'sort' | 'year' | 'genre', value: string | null) => void;
  onClear: () => void;
  activeCount: number;
}

function FilterControls({
  typeFilter,
  sort,
  year,
  genre,
  genres,
  query,
  onChange,
  onClear,
  activeCount,
}: FilterControlsProps) {
  const [exactYear, setExactYear] = useState(/^\d{4}$/.test(year ?? '') ? year ?? '' : '');

  useEffect(() => {
    setExactYear(/^\d{4}$/.test(year ?? '') ? year ?? '' : '');
  }, [year]);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-fog">Type</p>
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'all', label: 'All' },
            { id: 'movie', label: 'Films' },
            { id: 'tv', label: 'Series' },
          ] as { id: TypeFilter; label: string }[]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange('type', option.id === 'all' ? null : option.id)}
              className={`focus-ring rounded-full px-4 py-2 text-ui transition-colors ${
                typeFilter === option.id ? 'bg-tungsten text-ink' : 'border border-rail text-fog hover:bg-seat hover:text-screen'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-fog">Genre</p>
        <div className="flex flex-wrap gap-2">
          {genres.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange('genre', genre === option.id ? null : String(option.id))}
              className={`focus-ring rounded-full border px-3 py-1.5 text-ui transition-colors ${
                genre === option.id
                  ? 'border-tungsten bg-tungsten/10 text-tungsten'
                  : 'border-rail text-fog hover:bg-seat hover:text-screen'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-fog">Year</p>
        <div className="flex flex-wrap items-center gap-2">
          {YEAR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('year', year === option.value ? null : option.value)}
              className={`focus-ring rounded-full border px-3 py-1.5 font-mono text-ui transition-colors ${
                year === option.value
                  ? 'border-tungsten bg-tungsten/10 text-tungsten'
                  : 'border-rail text-fog hover:bg-seat hover:text-screen'
              }`}
            >
              {option.label}
            </button>
          ))}
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const valid = /^\d{4}$/.test(exactYear) && Number(exactYear) >= 1874 && Number(exactYear) <= CURRENT_YEAR + 5;
              if (valid) onChange('year', exactYear);
            }}
          >
            <input
              type="number"
              inputMode="numeric"
              min="1874"
              max={CURRENT_YEAR + 5}
              value={exactYear}
              onChange={(event) => setExactYear(event.target.value.slice(0, 4))}
              placeholder="Exact year"
              aria-label="Exact year"
              className="focus-ring w-28 rounded-full border border-rail bg-ink px-3 py-1.5 font-mono text-ui text-screen placeholder:text-fog"
            />
            <button type="submit" className="focus-ring rounded-full border border-rail px-3 py-1.5 text-ui text-fog hover:bg-seat hover:text-screen">Apply</button>
          </form>
        </div>
      </div>

      {!query && (
        <div>
          <label htmlFor="browse-sort" className="mb-2 block text-caption font-semibold uppercase tracking-wider text-fog">Sort by</label>
          <select
            id="browse-sort"
            value={sort}
            onChange={(event) => onChange('sort', event.target.value === 'popularity' ? null : event.target.value)}
            className="focus-ring rounded-full border border-rail bg-ink px-4 py-2 text-ui text-screen"
          >
            {SORT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </div>
      )}

      {activeCount > 0 && (
        <button type="button" onClick={onClear} className="focus-ring text-ui text-fog underline-offset-4 hover:text-screen hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q')?.trim() ?? '';
  const typeFilter = parseType(searchParams.get('type'));
  const genre = parseGenre(searchParams.get('genre'));
  const year = parseYear(searchParams.get('year'));
  const sort = parseSort(searchParams.get('sort'));
  const view = searchParams.get('view') === 'trending' ? 'trending' : null;
  const [filterOpen, setFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const watchlist = useWatchlist();
  const favorites = useFavorites();

  const mediaType: 'movie' | 'tv' = typeFilter === 'tv' ? 'tv' : 'movie';
  const { data: genres = [] } = useQuery({
    queryKey: ['genres', mediaType],
    queryFn: ({ signal }) => movieApi.genres(mediaType, signal),
    staleTime: QUERY_STALE_TIME.referenceData,
  });

  const selectedGenreName = genre ? genres.find((item) => item.id === genre)?.name : null;
  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) + (genre ? 1 : 0) + (year ? 1 : 0) + (!query && sort !== 'popularity' ? 1 : 0);
  const resultsMode = Boolean(query || activeFilterCount > 0 || view);
  const sortBy = SORT_OPTIONS.find((option) => option.id === sort)?.sortBy ?? 'popularity.desc';

  const updateParam = (key: 'type' | 'sort' | 'year' | 'genre', value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'type') next.delete('genre');
    if (key !== 'sort') next.delete('view');
    router.replace(next.size ? `/?${next.toString()}` : '/');
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams.toString());
    ['type', 'genre', 'year', 'sort', 'view'].forEach((key) => next.delete(key));
    router.replace(next.size ? `/?${next.toString()}` : '/');
  };

  const { data: trending = [], isPending: trendingLoading } = useQuery({
    queryKey: ['trending', 'week', 'all'],
    queryFn: async ({ signal }) => (await movieApi.trending('week', 'all', 1, signal)).results.filter((movie) => movie.media_type !== 'person'),
    enabled: !resultsMode,
    staleTime: QUERY_STALE_TIME.browse,
  });

  const { data: popularFilms = [], isPending: filmsLoading } = useQuery({
    queryKey: ['popular', 'movie'],
    queryFn: async ({ signal }) => (await movieApi.popular('movie', 1, signal)).results.map((movie) => ({ ...movie, media_type: 'movie' as const })),
    enabled: !resultsMode,
    staleTime: QUERY_STALE_TIME.browse,
  });

  const { data: popularSeries = [], isPending: seriesLoading } = useQuery({
    queryKey: ['popular', 'tv'],
    queryFn: async ({ signal }) => (await movieApi.popular('tv', 1, signal)).results.map((movie) => ({ ...movie, media_type: 'tv' as const })),
    enabled: !resultsMode,
    staleTime: QUERY_STALE_TIME.browse,
  });

  const featured = trending.find((movie) => movie.backdrop_path) || popularFilms.find((movie) => movie.backdrop_path) || null;
  const trendingRail = featured ? trending.filter((movie) => movie.id !== featured.id) : trending;
  const shelfSeed = favorites.items[0] || watchlist.items[0] || null;
  const { data: shelf = [] } = useQuery({
    queryKey: ['similar', shelfSeed?.movie_type, shelfSeed?.movie_id],
    queryFn: async ({ signal }) => {
      const type = shelfSeed!.movie_type;
      return (await movieApi.similar(type, shelfSeed!.movie_id, signal)).map((movie) => ({ ...movie, media_type: type }));
    },
    enabled: !resultsMode && Boolean(user && shelfSeed),
    staleTime: QUERY_STALE_TIME.trailersAndSimilar,
  });

  const resultsQuery = useInfiniteQuery({
    queryKey: ['browse', { query, genre, typeFilter, year, sort, view }],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      if (query) {
        const type = typeFilter === 'all' ? 'multi' : typeFilter;
        const data = await movieApi.search(query, pageParam, type, signal);
        const results = data.results.filter((movie) => {
          if (movie.media_type === 'person' || (!movie.poster_path && !movie.backdrop_path)) return false;
          if (genre && !(movie.genre_ids ?? []).includes(genre)) return false;
          if (year) {
            const value = movieYear(movie);
            if (!value) return false;
            if (/^\d{4}$/.test(year) && value !== Number(year)) return false;
            if (/^\d{4}s$/.test(year) && (value < Number(year.slice(0, 4)) || value > Number(year.slice(0, 4)) + 9)) return false;
            if (year === 'older' && value >= CURRENT_DECADE - 30) return false;
          }
          return true;
        });
        return { ...data, results };
      }
      if (view === 'trending') {
        return movieApi.trending('week', typeFilter === 'all' ? 'all' : typeFilter, pageParam, signal);
      }
      const data = await movieApi.discover({
        type: mediaType,
        genreId: genre,
        sortBy,
        page: pageParam,
        ...yearRange(year),
        signal,
      });
      return { ...data, results: data.results.map((movie) => ({ ...movie, media_type: mediaType })) };
    },
    getNextPageParam: (lastPage) => lastPage.page < Math.min(lastPage.total_pages, 500) ? lastPage.page + 1 : undefined,
    enabled: resultsMode,
    staleTime: query ? QUERY_STALE_TIME.search : QUERY_STALE_TIME.browse,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = resultsQuery;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: '300px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const results = resultsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const uniqueResults = Array.from(new Map(results.map((movie) => [`${movie.media_type ?? mediaType}-${movie.id}`, movie])).values());
  const controls = (
    <FilterControls
      typeFilter={typeFilter}
      sort={sort}
      year={year}
      genre={genre}
      genres={genres}
      query={query}
      onChange={updateParam}
      onClear={clearFilters}
      activeCount={activeFilterCount}
    />
  );

  const heading = query
    ? <>Results for <span className="text-tungsten">“{query}”</span></>
    : view === 'trending' ? 'Trending this week'
      : typeFilter === 'tv' ? 'Series'
        : typeFilter === 'movie' ? 'Films'
          : 'Browse';

  return (
    <>
      {!resultsMode && (featured ? <NowShowing movie={featured} /> : (trendingLoading || filmsLoading) ? <NowShowingSkeleton /> : null)}

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
        {resultsMode && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-display text-display-md text-screen">{heading}</h1>
              <div className="md:hidden">
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className="focus-ring flex items-center gap-2 rounded-full border border-rail px-3 py-2 text-ui text-fog">
                      <SlidersHorizontal className="h-4 w-4" /> Filters
                      {activeFilterCount > 0 && <span className="font-mono text-tungsten">{activeFilterCount}</span>}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={8} className="max-h-[70vh] w-[min(92vw,360px)] overflow-y-auto rounded-panel border border-rail bg-velvet p-4 text-screen">
                    {controls}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="hidden rounded-panel border border-rail bg-velvet p-5 md:block">{controls}</div>
            <div className="flex flex-wrap items-center gap-2">
              {view && <FilterChip label="Trending" onRemove={() => { const next = new URLSearchParams(searchParams.toString()); next.delete('view'); router.replace(next.size ? `/?${next}` : '/'); }} />}
              {typeFilter !== 'all' && <FilterChip label={typeFilter === 'tv' ? 'Series' : 'Films'} onRemove={() => updateParam('type', null)} />}
              {selectedGenreName && <FilterChip label={selectedGenreName} onRemove={() => updateParam('genre', null)} />}
              {year && <FilterChip label={year === 'older' ? `Before ${CURRENT_DECADE - 30}` : year} onRemove={() => updateParam('year', null)} />}
              {!query && sort !== 'popularity' && <FilterChip label={sort === 'rating_desc' ? 'Top rated' : 'Lowest rated'} onRemove={() => updateParam('sort', null)} />}
            </div>
          </div>
        )}

        {resultsMode ? (
          <div className="space-y-5">
            <MovieGrid
              movies={uniqueResults}
              loading={resultsQuery.isPending}
              emptyTitle={query ? `Nothing under “${query}”.` : 'Nothing matches those filters.'}
              emptyActionLabel={query ? 'Clear search' : 'Clear filters'}
              emptyActionHref={query ? '/' : undefined}
              onEmptyAction={query ? undefined : clearFilters}
            />
            {isFetchingNextPage && <PosterSkeleton count={6} />}
            <div ref={sentinelRef} className="flex min-h-12 justify-center">
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="focus-ring rounded-full border border-rail px-5 py-2 text-ui font-semibold text-screen transition-colors hover:bg-seat disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {shelfSeed && shelf.length > 0 && <PosterRail title={`Because you saved ${shelfSeed.movie_title}`} movies={shelf} />}
            <PosterRail title="Trending this week" movies={trendingRail.slice(0, 16)} loading={trendingLoading} href="/?view=trending" />
            <PosterRail title="Popular films" movies={popularFilms.slice(0, 16)} loading={filmsLoading} href="/?type=movie" />
            <PosterRail title="Popular series" movies={popularSeries.slice(0, 16)} loading={seriesLoading} href="/?type=tv" />
          </div>
        )}
      </div>
    </>
  );
}

export default function HomePage() {
  return <Suspense fallback={<NowShowingSkeleton />}><HomeContent /></Suspense>;
}

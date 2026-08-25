'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { movies as movieApi, getPosterUrl } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import { useGenreCatalog } from '@/hooks/useGenreCatalog';
import { useAuth } from '@/context/AuthContext';
import { profiles } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import type { Movie, TopMovie } from '@/types';

export const MAX_GENRES = 5;
export const MAX_TOP_MOVIES = 5;

const sameList = <T,>(a: T[], b: T[], key: (item: T) => string) =>
  a.length === b.length && a.every((item, i) => key(item) === key(b[i]));

const movieKey = (movie: TopMovie) => `${movie.type}-${movie.id}`;

const toTopMovie = (movie: Movie): TopMovie | null => {
  const type = movie.media_type === 'tv' || (!movie.title && movie.name) ? 'tv' : 'movie';
  const title = movie.title || movie.name;
  if (!title) return null;
  return { id: movie.id, title, poster: movie.poster_path ?? null, type };
};

// The "Your taste" section of Edit profile: pick the genres you'd defend in an
// argument, then build the five films you'd rescue from a burning hard drive.
export default function TasteEditor() {
  const { user, favoriteGenres, topMovies, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { genres, isLoading: genresLoading, isError: genresError, refetch: refetchGenres } = useGenreCatalog();

  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<TopMovie[]>([]);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelectedGenres(favoriteGenres), [favoriteGenres]);
  useEffect(() => setSelectedMovies(topMovies), [topMovies]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['taste-search', debounced],
    queryFn: ({ signal }) => movieApi.search(debounced, 1, 'multi', signal),
    enabled: debounced.length > 1,
    staleTime: QUERY_STALE_TIME.search,
    select: response => response.results.filter(item => item.media_type !== 'person').slice(0, 8),
  });

  const listFull = selectedMovies.length >= MAX_TOP_MOVIES;

  const dirty = useMemo(
    () =>
      !sameList(selectedGenres, favoriteGenres, String) ||
      !sameList(selectedMovies, topMovies, movieKey),
    [selectedGenres, selectedMovies, favoriteGenres, topMovies],
  );

  const toggleGenre = (id: number) =>
    setSelectedGenres(current => {
      if (current.includes(id)) return current.filter(genreId => genreId !== id);
      if (current.length >= MAX_GENRES) {
        toast('Five genres is the limit — even you have a type', 'error');
        return current;
      }
      return [...current, id];
    });

  const addMovie = (movie: Movie) => {
    const entry = toTopMovie(movie);
    if (!entry) return;
    setSelectedMovies(current => {
      if (current.some(item => movieKey(item) === movieKey(entry))) return current;
      if (current.length >= MAX_TOP_MOVIES) {
        toast('Your top five is full — bump something first', 'error');
        return current;
      }
      return [...current, entry];
    });
    setQuery('');
  };

  const removeMovie = (key: string) =>
    setSelectedMovies(current => current.filter(item => movieKey(item) !== key));

  const move = (index: number, delta: number) =>
    setSelectedMovies(current => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await profiles.update(user.id, {
        favorite_genres: selectedGenres,
        top_movies: selectedMovies,
      });
      if (error) { toast('Could not save your taste', 'error'); return; }
      await refreshProfile();
      toast('Taste saved. Bold choices.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 rounded-panel border border-rail bg-velvet p-6">
      <div>
        <h2 className="font-display text-title text-screen">Your taste</h2>
        <p className="mt-1 text-body text-fog">
          The part of your profile friends actually read. No wrong answers — only revealing ones.
        </p>
      </div>

      {/* Genres */}
      <fieldset className="space-y-2">
        <legend className="text-ui font-medium text-fog">Genres you’d defend in an argument</legend>
        <p className="text-meta text-fog">
          Pick up to {MAX_GENRES}. Nobody’s judging if “Horror” and “Romance” are both on there.
        </p>
        {genresLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-seat" />
        ) : genresError ? (
          <button type="button" onClick={() => void refetchGenres()} className="focus-ring text-ui text-tungsten hover:underline">
            Couldn’t load genres. Try again.
          </button>
        ) : (
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {genres.map(genre => {
              const selected = selectedGenres.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleGenre(genre.id)}
                  className={`focus-ring rounded-full border px-3 py-1.5 text-ui transition-colors ${
                    selected
                      ? 'border-tungsten bg-tungsten/10 text-tungsten'
                      : 'border-rail text-fog hover:bg-seat hover:text-screen'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Top five */}
      <div className="space-y-3">
        <div>
          <p className="text-ui font-medium text-fog">Your all-time top five</p>
          <p className="mt-1 text-meta text-fog">
            The five you’d rescue from a burning hard drive. Search, tap, reorder — {selectedMovies.length}/{MAX_TOP_MOVIES} chosen.
          </p>
        </div>

        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            disabled={listFull}
            aria-label="Search a film or series to add to your top five"
            placeholder={listFull ? 'Top five is full — bump one to add another' : 'Search a film or series…'}
            className="focus-ring w-full rounded-full border border-rail bg-seat py-2.5 pl-10 pr-4 text-ui text-screen placeholder:text-fog transition-colors focus:border-tungsten disabled:opacity-60"
          />
        </div>

        {debounced.length > 1 && !listFull && (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-rail bg-seat p-1">
            {isFetching && results.length === 0 && (
              <li className="px-3 py-2 text-meta text-fog">Searching…</li>
            )}
            {!isFetching && results.length === 0 && (
              <li className="px-3 py-2 text-meta text-fog">Nothing by that name.</li>
            )}
            {results.map(item => {
              const entry = toTopMovie(item);
              if (!entry) return null;
              const poster = getPosterUrl(entry.poster, 'w185');
              const already = selectedMovies.some(movie => movieKey(movie) === movieKey(entry));
              return (
                <li key={movieKey(entry)}>
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => addMovie(item)}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-velvet disabled:opacity-50"
                  >
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-velvet">
                      {poster && <Image src={poster} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ui text-screen">{entry.title}</span>
                      <span className="block font-mono text-caption text-fog">
                        {entry.type === 'tv' ? 'Series' : 'Film'}
                        {already ? ' · already in your five' : ''}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {selectedMovies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-rail px-4 py-6 text-center text-meta text-fog">
            Nothing here yet. Suspiciously undecided.
          </p>
        ) : (
          <ol className="space-y-2">
            {selectedMovies.map((movie, index) => {
              const poster = getPosterUrl(movie.poster, 'w185');
              return (
              <li key={movieKey(movie)} className="flex items-center gap-3 rounded-xl border border-rail bg-seat p-2">
                <span className="w-5 shrink-0 text-center font-mono text-caption text-tungsten">{index + 1}</span>
                <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-velvet">
                  {poster && <Image src={poster} alt="" fill sizes="40px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui text-screen">{movie.title}</span>
                  <span className="block font-mono text-caption text-fog">{movie.type === 'tv' ? 'Series' : 'Film'}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${movie.title} up`}
                    className="focus-ring rounded-full p-1.5 text-fog transition-colors hover:text-screen disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === selectedMovies.length - 1}
                    aria-label={`Move ${movie.title} down`}
                    className="focus-ring rounded-full p-1.5 text-fog transition-colors hover:text-screen disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMovie(movieKey(movie))}
                    aria-label={`Remove ${movie.title} from your top five`}
                    className="focus-ring rounded-full p-1.5 text-fog transition-colors hover:text-ticket"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={!dirty}>
          {saving ? 'Saving…' : 'Save taste'}
        </Button>
      </div>
    </section>
  );
}

import type { Genre, Movie, SharedList, TmdbResponse, TrailerItem, WatchProvider, WatchProviders, WatchRegion } from './types';

export interface MovieApiConfig { baseUrl: string; tmdbImageBaseUrl?: string }

function query(params: Record<string, string | number | null | undefined>) {
  const output = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') output.set(key, String(value)); });
  const value = output.toString();
  return value ? `?${value}` : '';
}

export function createMovieApi({ baseUrl, tmdbImageBaseUrl = 'https://image.tmdb.org/t/p' }: MovieApiConfig) {
  const root = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${root}${path}`, init);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
  }
  return {
    getPosterUrl: (path: string | null, size = 'w500') => path ? `${tmdbImageBaseUrl}/${size}${path}` : null,
    getBackdropUrl: (path: string | null, size = 'w1280') => path ? `${tmdbImageBaseUrl}/${size}${path}` : null,
    getProviderLogo: (path: string | null, size = 'w92') => path ? `${tmdbImageBaseUrl}/${size}${path}` : null,
    search: (text: string, page = 1, type = 'multi', signal?: AbortSignal) => request<TmdbResponse<Movie>>(`/api/movies/search${query({ query: text, page, type })}`, { signal }),
    trending: (timeWindow: 'day' | 'week' = 'week', mediaType = 'all', page = 1, signal?: AbortSignal) => request<TmdbResponse<Movie>>(`/api/movies/trending${query({ time_window: timeWindow, media_type: mediaType, page })}`, { signal }),
    popular: (type: 'movie' | 'tv' = 'movie', page = 1, signal?: AbortSignal) => request<TmdbResponse<Movie>>(`/api/movies/popular${query({ type, page })}`, { signal }),
    discover: (options: { type: 'movie' | 'tv'; genreId?: number | null; year?: number | null; sortBy?: string | null; page?: number; signal?: AbortSignal }) => request<TmdbResponse<Movie>>(`/api/movies/discover${query({ type: options.type, with_genres: options.genreId, year: options.year, sort_by: options.sortBy, page: options.page ?? 1 })}`, { signal: options.signal }),
    genres: (type: 'movie' | 'tv' = 'movie', signal?: AbortSignal) => request<{ genres: Genre[] }>(`/api/movies/genres${query({ type })}`, { signal }).then(data => data.genres),
    details: (type: 'movie' | 'tv', id: number, signal?: AbortSignal) => request<Movie>(`/api/movies/${type}/${id}`, { signal }),
    trailers: (type: 'movie' | 'tv', id: number, signal?: AbortSignal) => request<{ trailers: TrailerItem[] }>(`/api/movies/${type}/${id}/trailers`, { signal }).then(data => data.trailers),
    similar: (type: 'movie' | 'tv', id: number, signal?: AbortSignal) => request<{ results: Movie[] }>(`/api/movies/${type}/${id}/similar`, { signal }).then(data => data.results),
    providers: (type: 'movie' | 'tv', id: number, region = 'US', signal?: AbortSignal) => request<WatchProviders>(`/api/movies/${type}/${id}/providers${query({ region })}`, { signal }),
    providerRegions: (signal?: AbortSignal) => request<{ results: WatchRegion[] }>('/api/movies/provider-regions', { signal }).then(data => data.results),
    providerCatalog: (region: string, type: 'movie' | 'tv' = 'movie', signal?: AbortSignal) => request<{ results: WatchProvider[] }>(`/api/movies/provider-catalog${query({ region, type })}`, { signal }).then(data => data.results),
    shareList: (token: string, title?: string) => request<{ share_token: string }>('/api/lists/share', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title }) }),
    sharedList: (token: string, signal?: AbortSignal) => request<SharedList>(`/api/lists/${encodeURIComponent(token)}`, { signal }),
  };
}

export function serializeQuery(params: Record<string, string | number | null | undefined>) { return query(params); }

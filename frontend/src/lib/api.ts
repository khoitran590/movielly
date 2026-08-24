import axios from 'axios';
import type { Movie, TmdbResponse, TrailerItem, Genre, WatchProviders, SharedList, WatchProvider, WatchRegion } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10_000,
});

const TMDB_IMG = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

export const getPosterUrl = (path: string | null, size = 'w500') =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

export const getBackdropUrl = (path: string | null, size = 'w1280') =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

export const getMovieTitle = (movie: Movie) => movie.title || movie.name || 'Untitled';

export const getYear = (movie: Movie) => {
  const date = movie.release_date || movie.first_air_date;
  return date ? new Date(date).getFullYear() : null;
};

// Saved rows (watchlist, favorites, shared lists) store just enough to draw a
// poster. Lift one into a Movie stub so collections can reuse MovieCard.
export const savedToMovie = (item: {
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: 'movie' | 'tv';
}): Movie => ({
  id: item.movie_id,
  title: item.movie_type === 'tv' ? undefined : item.movie_title,
  name: item.movie_type === 'tv' ? item.movie_title : undefined,
  overview: '',
  poster_path: item.movie_poster,
  backdrop_path: null,
  vote_average: 0,
  vote_count: 0,
  media_type: item.movie_type,
});

export const movies = {
  search: (query: string, page = 1, type = 'multi', signal?: AbortSignal) =>
    api.get<TmdbResponse<Movie>>('/api/movies/search', { params: { query, page, type }, signal }).then(r => r.data),

  trending: (timeWindow: 'day' | 'week' = 'week', mediaType = 'all', page = 1, signal?: AbortSignal) =>
    api.get<TmdbResponse<Movie>>('/api/movies/trending', { params: { time_window: timeWindow, media_type: mediaType, page }, signal }).then(r => r.data),

  getMovie: (id: number, signal?: AbortSignal) =>
    api.get<Movie>(`/api/movies/movie/${id}`, { signal }).then(r => r.data),

  getTv: (id: number, signal?: AbortSignal) =>
    api.get<Movie>(`/api/movies/tv/${id}`, { signal }).then(r => r.data),

  popular: (type: 'movie' | 'tv' = 'movie', page = 1, signal?: AbortSignal) =>
    api.get<TmdbResponse<Movie>>('/api/movies/popular', { params: { type, page }, signal }).then(r => r.data),

  genres: (type: 'movie' | 'tv' = 'movie', signal?: AbortSignal) =>
    api.get<{ genres: Genre[] }>('/api/movies/genres', { params: { type }, signal }).then(r => r.data.genres),

  discover: ({
    type,
    genreId,
    year,
    dateFrom,
    dateTo,
    sortBy,
    page = 1,
    signal,
  }: {
    type: 'movie' | 'tv';
    genreId?: number | null;
    year?: number | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    sortBy?: string | null;
    page?: number;
    signal?: AbortSignal;
  }) =>
    api.get<TmdbResponse<Movie>>('/api/movies/discover', {
      params: {
        type,
        ...(genreId ? { with_genres: genreId } : {}),
        ...(year ? { year } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
        ...(sortBy ? { sort_by: sortBy } : {}),
        page,
      },
      signal,
    }).then(r => r.data),

  trailer: (type: 'movie' | 'tv', id: number, signal?: AbortSignal) =>
    api.get<{ youtube_video_id: string | null; title: string | null; source: string | null }>(
      `/api/movies/${type}/${id}/trailer`, { signal }
    ).then(r => r.data),

  trailers: (type: 'movie' | 'tv', id: number, signal?: AbortSignal) =>
    api.get<{ trailers: TrailerItem[] }>(
      `/api/movies/${type}/${id}/trailers`, { signal }
    ).then(r => r.data.trailers),

  similar: (type: 'movie' | 'tv', id: number, signal?: AbortSignal) =>
    api.get<{ results: Movie[] }>(
      `/api/movies/${type}/${id}/similar`, { signal }
    ).then(r => r.data.results),

  providers: (type: 'movie' | 'tv', id: number, region = 'US', signal?: AbortSignal) =>
    api.get<WatchProviders>(
      `/api/movies/${type}/${id}/providers`, { params: { region }, signal }
    ).then(r => r.data),

  providerRegions: (signal?: AbortSignal) =>
    api.get<{ results: WatchRegion[] }>('/api/movies/provider-regions', { signal }).then(r => r.data.results),

  providerCatalog: (region: string, type: 'movie' | 'tv' = 'movie', signal?: AbortSignal) =>
    api.get<{ results: WatchProvider[] }>('/api/movies/provider-catalog', { params: { region, type }, signal }).then(r => r.data.results),
};

// TMDB provider logos live on the same image CDN as posters.
export const getProviderLogo = (path: string | null, size = 'w92') =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

export const lists = {
  share: (token: string, title?: string) =>
    api.post('/api/lists/share', { title }, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),

  getShared: (shareToken: string, signal?: AbortSignal) =>
    api.get<SharedList>(`/api/lists/${shareToken}`, { signal }).then(r => r.data),
};

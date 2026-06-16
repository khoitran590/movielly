import axios from 'axios';
import type { Movie, TmdbResponse, TrailerItem, Genre, WatchProviders } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
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

export const movies = {
  search: (query: string, page = 1, type = 'multi') =>
    api.get<TmdbResponse<Movie>>('/api/movies/search', { params: { query, page, type } }).then(r => r.data),

  trending: (timeWindow: 'day' | 'week' = 'week', mediaType = 'all') =>
    api.get<TmdbResponse<Movie>>('/api/movies/trending', { params: { time_window: timeWindow, media_type: mediaType } }).then(r => r.data),

  getMovie: (id: number) =>
    api.get<Movie>(`/api/movies/movie/${id}`).then(r => r.data),

  getTv: (id: number) =>
    api.get<Movie>(`/api/movies/tv/${id}`).then(r => r.data),

  popular: (type: 'movie' | 'tv' = 'movie', page = 1) =>
    api.get<TmdbResponse<Movie>>('/api/movies/popular', { params: { type, page } }).then(r => r.data),

  genres: (type: 'movie' | 'tv' = 'movie') =>
    api.get<{ genres: Genre[] }>('/api/movies/genres', { params: { type } }).then(r => r.data.genres),

  discover: (type: 'movie' | 'tv', genreId?: number | null, year?: number | null, sortBy?: string | null, page = 1) =>
    api.get<TmdbResponse<Movie>>('/api/movies/discover', {
      params: {
        type,
        ...(genreId ? { with_genres: genreId } : {}),
        ...(year ? { year } : {}),
        ...(sortBy ? { sort_by: sortBy } : {}),
        page,
      },
    }).then(r => r.data),

  trailer: (type: 'movie' | 'tv', id: number) =>
    api.get<{ youtube_video_id: string | null; title: string | null; source: string | null }>(
      `/api/movies/${type}/${id}/trailer`
    ).then(r => r.data),

  trailers: (type: 'movie' | 'tv', id: number) =>
    api.get<{ trailers: TrailerItem[] }>(
      `/api/movies/${type}/${id}/trailers`
    ).then(r => r.data.trailers),

  similar: (type: 'movie' | 'tv', id: number) =>
    api.get<{ results: Movie[] }>(
      `/api/movies/${type}/${id}/similar`
    ).then(r => r.data.results),

  providers: (type: 'movie' | 'tv', id: number, region = 'US') =>
    api.get<WatchProviders>(
      `/api/movies/${type}/${id}/providers`, { params: { region } }
    ).then(r => r.data),
};

// TMDB provider logos live on the same image CDN as posters.
export const getProviderLogo = (path: string | null, size = 'w92') =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

export const lists = {
  share: (token: string, title?: string) =>
    api.post('/api/lists/share', { title }, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),

  getShared: (shareToken: string) =>
    api.get(`/api/lists/${shareToken}`).then(r => r.data),
};

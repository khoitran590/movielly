import type { Movie, SavedTitle, TitleType } from './types';

export const titleIdentity = (type: TitleType, id: number) => `${type}:${id}`;
export const titleTypeFor = (movie: Pick<Movie, 'media_type' | 'title' | 'name'>): TitleType => movie.media_type === 'tv' || (!movie.title && Boolean(movie.name)) ? 'tv' : 'movie';
export const getMovieTitle = (movie: Pick<Movie, 'title' | 'name'>) => movie.title || movie.name || 'Untitled';
export const getYear = (movie: Pick<Movie, 'release_date' | 'first_air_date'>) => {
  const value = movie.release_date || movie.first_air_date;
  return value ? Number(value.slice(0, 4)) || null : null;
};
export const savedToMovie = (item: Pick<SavedTitle, 'movie_id' | 'movie_title' | 'movie_poster' | 'movie_type'>): Movie => ({
  id: item.movie_id,
  title: item.movie_type === 'movie' ? item.movie_title : undefined,
  name: item.movie_type === 'tv' ? item.movie_title : undefined,
  overview: '', poster_path: item.movie_poster, backdrop_path: null, vote_average: 0, vote_count: 0, media_type: item.movie_type,
});

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const MAX_BIO_LENGTH = 280;
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
export function validateUsername(value: string) { return USERNAME_RE.test(value) ? null : 'Username must be 3–20 letters, numbers, or underscores.'; }
export function validateBio(value: string) { return value.length <= MAX_BIO_LENGTH ? null : `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`; }
export function validateRating(value: number) { return Number.isInteger(value) && value >= 1 && value <= 10 ? null : 'Rating must be from 1 to 10.'; }
export function authErrorMessage(raw?: string | null) {
  const msg = (raw || '').toLowerCase();
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('invalid login credentials')) return 'That email or password doesn’t look right.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email first — check your inbox for the link.';
  if (msg.includes('already registered') || msg.includes('already exists')) return 'An account with this email already exists — try logging in.';
  if (msg.includes('password should be at least') || msg.includes('at least 6')) return 'Please choose a password of at least 6 characters.';
  if (msg.includes('invalid email')) return 'Please enter a valid email address.';
  if (msg.includes('rate limit') || msg.includes('for security purposes')) return 'Too many attempts — please wait a moment and try again.';
  if (msg.includes('expired')) return 'That link has expired. Please request a new one.';
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Network problem — check your connection and try again.';
  return raw || 'Something went wrong. Please try again.';
}

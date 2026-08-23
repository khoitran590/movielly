import { describe, it, expect } from 'vitest';
import { getMovieTitle, getYear, savedToMovie } from './api';
import type { Movie } from '@/types';

// A minimal Movie factory — only the fields under test matter.
const movie = (over: Partial<Movie> = {}): Movie =>
  ({ id: 1, overview: '', poster_path: null, backdrop_path: null, vote_average: 0, vote_count: 0, ...over } as Movie);

describe('getMovieTitle', () => {
  it('prefers title (films)', () => {
    expect(getMovieTitle(movie({ title: 'Dune', name: 'ignored' }))).toBe('Dune');
  });
  it('falls back to name (series)', () => {
    expect(getMovieTitle(movie({ name: 'Severance' }))).toBe('Severance');
  });
  it('defaults to Untitled when neither is present', () => {
    expect(getMovieTitle(movie())).toBe('Untitled');
  });
});

describe('getYear', () => {
  it('reads the year from release_date', () => {
    expect(getYear(movie({ release_date: '2021-10-22' }))).toBe(2021);
  });
  it('falls back to first_air_date', () => {
    expect(getYear(movie({ first_air_date: '2022-02-18' }))).toBe(2022);
  });
  it('returns null when there is no date', () => {
    expect(getYear(movie())).toBeNull();
  });
});

describe('savedToMovie', () => {
  it('maps a saved film row into a Movie stub with title set', () => {
    const result = savedToMovie({ movie_id: 42, movie_title: 'Heat', movie_poster: '/p.jpg', movie_type: 'movie' });
    expect(result).toMatchObject({ id: 42, title: 'Heat', name: undefined, media_type: 'movie', poster_path: '/p.jpg' });
  });
  it('maps a saved series row into name (not title)', () => {
    const result = savedToMovie({ movie_id: 7, movie_title: 'Fargo', movie_poster: null, movie_type: 'tv' });
    expect(result).toMatchObject({ id: 7, title: undefined, name: 'Fargo', media_type: 'tv' });
  });
});

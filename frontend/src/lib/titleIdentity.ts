import type { Movie } from '@/types';

export type TitleType = 'movie' | 'tv';

/**
 * TMDB IDs are only unique within a media type. Keep this representation in
 * one place so cache membership, review maps, and query keys cannot collapse
 * a film and a series that happen to share a numeric ID.
 */
export function titleIdentity(type: TitleType, id: number) {
  return `${type}:${id}`;
}

export function titleTypeFor(movie: Pick<Movie, 'media_type' | 'title' | 'name'>): TitleType {
  return movie.media_type === 'tv' || (!movie.title && Boolean(movie.name)) ? 'tv' : 'movie';
}

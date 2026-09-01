import { describe, expect, it } from 'vitest';
import { authErrorMessage, savedToMovie, serializeQuery, titleIdentity, validateBio, validateRating, validateUsername } from './index';

describe('shared core', () => {
  it('keeps movie and TV identities separate', () => expect(titleIdentity('movie', 12)).not.toBe(titleIdentity('tv', 12)));
  it('serializes only defined query parameters', () => expect(serializeQuery({ type: 'movie', page: 2, year: null })).toBe('?type=movie&page=2'));
  it('converts saved TV rows', () => expect(savedToMovie({ movie_id: 1, movie_title: 'Show', movie_poster: null, movie_type: 'tv' })).toMatchObject({ id: 1, name: 'Show', media_type: 'tv' }));
  it('validates profile and review fields', () => {
    expect(validateUsername('movie_fan')).toBeNull();
    expect(validateUsername('x')).toBeTruthy();
    expect(validateBio('a'.repeat(281))).toBeTruthy();
    expect(validateRating(10)).toBeNull();
    expect(validateRating(0)).toBeTruthy();
  });
  it('maps auth errors', () => expect(authErrorMessage('Invalid login credentials')).toContain('email or password'));
});

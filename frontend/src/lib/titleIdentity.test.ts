import { describe, expect, it } from 'vitest';
import { titleIdentity } from './titleIdentity';

describe('titleIdentity', () => {
  it('keeps a movie and TV title with the same TMDB ID independent', () => {
    const saved = new Set([titleIdentity('movie', 42), titleIdentity('tv', 42)]);
    expect(saved).toEqual(new Set(['movie:42', 'tv:42']));
  });
});

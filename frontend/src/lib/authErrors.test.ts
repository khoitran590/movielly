import { describe, it, expect } from 'vitest';
import { authErrorMessage } from './authErrors';
import { timeAgo } from './utils';

describe('authErrorMessage', () => {
  it('maps invalid credentials to friendly copy', () => {
    expect(authErrorMessage('Invalid login credentials')).toMatch(/doesn’t look right/);
  });
  it('maps an already-registered email', () => {
    expect(authErrorMessage('User already registered')).toMatch(/already exists/);
  });
  it('falls back to a generic message when empty', () => {
    expect(authErrorMessage('')).toMatch(/went wrong/);
    expect(authErrorMessage(null)).toMatch(/went wrong/);
  });
  it('passes through an unrecognized message', () => {
    expect(authErrorMessage('Some novel error')).toBe('Some novel error');
  });
});

describe('timeAgo', () => {
  it('returns "just now" for very recent times', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });
  it('formats hours and days compactly', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe('3h');
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe('2d');
  });
  it('returns empty string for an invalid date', () => {
    expect(timeAgo('not-a-date')).toBe('');
  });
});

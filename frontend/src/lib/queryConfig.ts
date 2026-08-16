const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Keep client freshness aligned with the public API's cache tiers. User-owned
// data uses the shorter QueryClient default and mutation invalidation instead.
export const QUERY_STALE_TIME = {
  search: 10 * MINUTE,
  browse: 30 * MINUTE,
  details: HOUR,
  trailersAndSimilar: 6 * HOUR,
  referenceData: 24 * HOUR,
} as const;

// Tiny in-memory TTL cache for TMDB proxy responses.
//
// TMDB data (genres, trending, popular, trailers…) changes slowly, so caching
// avoids re-fetching on every page view. On serverless (Vercel) the cache only
// lives as long as the warm instance — still a big win for bursts of traffic.

const MAX_ENTRIES = 500;
const store = new Map();
const inFlight = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  // Map iterates in insertion order, so the first key is the oldest entry.
  if (store.size >= MAX_ENTRIES) {
    store.delete(store.keys().next().value);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

function setPublicCacheHeaders(res, ttlSeconds, options) {
  const browserTtlSeconds = options.browserTtlSeconds ?? Math.min(ttlSeconds, 60);
  const staleWhileRevalidateSeconds = options.staleWhileRevalidateSeconds ?? ttlSeconds;
  const staleIfErrorSeconds = options.staleIfErrorSeconds ?? 24 * 60 * 60;

  // Browsers get a short cache lifetime. Vercel's CDN can safely retain the
  // same public response for the full upstream TTL and serve stale data while
  // it refreshes or TMDB is temporarily unavailable.
  res.set('Cache-Control', `public, max-age=${browserTtlSeconds}`);
  res.set(
    'Vercel-CDN-Cache-Control',
    `public, max-age=${ttlSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}, stale-if-error=${staleIfErrorSeconds}`
  );
}

// Express middleware: serve a cached JSON body when present, otherwise let the
// route run and capture whatever it sends via res.json(). Only 2xx responses
// are cached or marked publicly cacheable, so errors never get stuck.
function cacheResponse(ttlSeconds, options = {}) {
  const ttlMs = ttlSeconds * 1000;
  return (req, res, next) => {
    const key = req.originalUrl;
    const hit = get(key);
    if (hit !== undefined) {
      setPublicCacheHeaders(res, ttlSeconds, options);
      res.set('X-Cache', 'HIT');
      return res.json(hit);
    }

    // A cold cache can receive many identical requests at once. Let the first
    // request populate the cache and have the rest share its response instead
    // of stampeding the same upstream endpoint.
    const existingRequest = inFlight.get(key);
    if (existingRequest) {
      res.set('X-Cache', 'COALESCED');
      existingRequest.then(({ body, statusCode }) => {
        res.statusCode = statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          setPublicCacheHeaders(res, ttlSeconds, options);
        }
        res.json(body);
      });
      return;
    }

    let settleRequest;
    const pendingRequest = new Promise(resolve => { settleRequest = resolve; });
    inFlight.set(key, pendingRequest);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusCode = res.statusCode;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(key, body, ttlMs);
        setPublicCacheHeaders(res, ttlSeconds, options);
      }
      if (inFlight.get(key) === pendingRequest) {
        inFlight.delete(key);
        settleRequest({ body, statusCode });
      }
      return originalJson(body);
    };

    // If the client disconnects before the route responds, release coalesced
    // callers instead of leaving a permanently pending entry.
    if (typeof res.once === 'function') {
      res.once('close', () => {
        if (inFlight.get(key) !== pendingRequest) return;
        inFlight.delete(key);
        settleRequest({ body: { error: 'Upstream request interrupted' }, statusCode: 503 });
      });
    }

    res.set('X-Cache', 'MISS');
    next();
  };
}

module.exports = { cacheResponse };

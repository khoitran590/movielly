// Tiny in-memory TTL cache for TMDB proxy responses.
//
// TMDB data (genres, trending, popular, trailers…) changes slowly, so caching
// avoids re-fetching on every page view. On serverless (Vercel) the cache only
// lives as long as the warm instance — still a big win for bursts of traffic.

const MAX_ENTRIES = 500;
const store = new Map();

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

// Express middleware: serve a cached JSON body when present, otherwise let the
// route run and capture whatever it sends via res.json(). Only 2xx responses
// are cached so errors never get stuck.
function cacheResponse(ttlSeconds) {
  const ttlMs = ttlSeconds * 1000;
  return (req, res, next) => {
    const key = req.originalUrl;
    const hit = get(key);
    if (hit !== undefined) {
      res.set('X-Cache', 'HIT');
      return res.json(hit);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(key, body, ttlMs);
      }
      return originalJson(body);
    };
    res.set('X-Cache', 'MISS');
    next();
  };
}

module.exports = { cacheResponse };

const test = require('node:test');
const assert = require('node:assert/strict');
const { cacheResponse } = require('../src/lib/cache');

function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(k, v) { this.headers[k] = v; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
}

test('serves the second identical request from cache', () => {
  const mw = cacheResponse(60);
  const req = { originalUrl: '/api/test/one' };

  const res1 = fakeRes();
  let ranRoute = false;
  mw(req, res1, () => { ranRoute = true; res1.json({ n: 1 }); });
  assert.equal(ranRoute, true);
  assert.equal(res1.headers['X-Cache'], 'MISS');
  assert.equal(res1.headers['Cache-Control'], 'public, max-age=60');
  assert.equal(
    res1.headers['Vercel-CDN-Cache-Control'],
    'public, max-age=60, stale-while-revalidate=60, stale-if-error=86400'
  );

  const res2 = fakeRes();
  ranRoute = false;
  mw(req, res2, () => { ranRoute = true; });
  assert.equal(ranRoute, false, 'route should not run on a cache hit');
  assert.equal(res2.headers['X-Cache'], 'HIT');
  assert.equal(res2.headers['Cache-Control'], 'public, max-age=60');
  assert.deepEqual(res2.body, { n: 1 });
});

test('does not cache error responses', () => {
  const mw = cacheResponse(60);
  const req = { originalUrl: '/api/test/error' };

  const res1 = fakeRes();
  mw(req, res1, () => { res1.statusCode = 500; res1.json({ error: 'boom' }); });

  const res2 = fakeRes();
  let ranRoute = false;
  mw(req, res2, () => { ranRoute = true; });
  assert.equal(ranRoute, true, 'errors must not be served from cache');
  assert.equal(res2.headers['X-Cache'], 'MISS');
  assert.equal(res1.headers['Cache-Control'], undefined, 'errors must not be publicly cacheable');
});

test('supports a shorter browser TTL than the CDN TTL', () => {
  const mw = cacheResponse(3600, { browserTtlSeconds: 30 });
  const req = { originalUrl: '/api/test/cache-policy' };
  const res = fakeRes();

  mw(req, res, () => res.json({ ok: true }));

  assert.equal(res.headers['Cache-Control'], 'public, max-age=30');
  assert.equal(
    res.headers['Vercel-CDN-Cache-Control'],
    'public, max-age=3600, stale-while-revalidate=3600, stale-if-error=86400'
  );
});

test('coalesces concurrent requests for the same uncached resource', async () => {
  const mw = cacheResponse(60);
  const req = { originalUrl: '/api/test/concurrent' };
  let routeRuns = 0;

  const res1 = fakeRes();
  mw(req, res1, () => {
    routeRuns += 1;
    setTimeout(() => res1.json({ shared: true }), 10);
  });

  const res2 = fakeRes();
  mw(req, res2, () => { routeRuns += 1; });

  await new Promise(resolve => setTimeout(resolve, 20));

  assert.equal(routeRuns, 1);
  assert.equal(res1.headers['X-Cache'], 'MISS');
  assert.equal(res2.headers['X-Cache'], 'COALESCED');
  assert.deepEqual(res2.body, { shared: true });
  assert.equal(res2.headers['Cache-Control'], 'public, max-age=60');
});

test('shares concurrent errors without caching them', async () => {
  const mw = cacheResponse(60);
  const req = { originalUrl: '/api/test/concurrent-error' };
  let routeRuns = 0;

  const res1 = fakeRes();
  mw(req, res1, () => {
    routeRuns += 1;
    setTimeout(() => {
      res1.statusCode = 502;
      res1.json({ error: 'upstream failed' });
    }, 10);
  });

  const res2 = fakeRes();
  mw(req, res2, () => { routeRuns += 1; });
  await new Promise(resolve => setTimeout(resolve, 20));

  assert.equal(routeRuns, 1);
  assert.equal(res2.statusCode, 502);
  assert.equal(res2.headers['Cache-Control'], undefined);

  const res3 = fakeRes();
  mw(req, res3, () => { routeRuns += 1; });
  assert.equal(routeRuns, 2, 'a failed request must not populate the cache');
});

test('expires entries after the TTL', async () => {
  const mw = cacheResponse(0.05); // 50ms TTL
  const req = { originalUrl: '/api/test/ttl' };

  const res1 = fakeRes();
  mw(req, res1, () => res1.json({ fresh: true }));

  await new Promise(r => setTimeout(r, 80));

  const res2 = fakeRes();
  let ranRoute = false;
  mw(req, res2, () => { ranRoute = true; });
  assert.equal(ranRoute, true, 'expired entries must re-run the route');
});

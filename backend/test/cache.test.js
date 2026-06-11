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

  const res2 = fakeRes();
  ranRoute = false;
  mw(req, res2, () => { ranRoute = true; });
  assert.equal(ranRoute, false, 'route should not run on a cache hit');
  assert.equal(res2.headers['X-Cache'], 'HIT');
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

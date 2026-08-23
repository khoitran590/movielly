// HTTP-level tests: routes -> middleware -> controllers -> services, with all
// external HTTP (TMDB, YouTube oEmbed) intercepted by nock. No network is hit.

// Provide env before app modules load so tmdb.service / supabase don't exit.
process.env.NODE_ENV = 'test';
process.env.TMDB_API_KEY ||= 'test-tmdb-key';
process.env.SUPABASE_URL ||= 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.TMDB_BASE_URL ||= 'https://api.themoviedb.org/3';

const test = require('node:test');
const assert = require('node:assert');
const nock = require('nock');
const request = require('supertest');
const app = require('../src/app');

const TMDB = 'https://api.themoviedb.org';

test.before(() => {
  nock.disableNetConnect();
  // Allow supertest's own loopback connections.
  nock.enableNetConnect('127.0.0.1');
});

test.afterEach(() => {
  nock.cleanAll();
});

test.after(() => {
  nock.enableNetConnect();
});

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('GET /api/movies/search without a query is rejected 400', async () => {
  const res = await request(app).get('/api/movies/search');
  assert.equal(res.status, 400);
});

test('GET /api/movies/search proxies TMDB and caches the response', async () => {
  const payload = { page: 1, results: [{ id: 1, title: 'Dune' }], total_pages: 1 };
  const scope = nock(TMDB)
    .get('/3/search/multi')
    .query(true)
    .reply(200, payload);

  const first = await request(app).get('/api/movies/search?query=dune');
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.results, payload.results);
  assert.equal(first.headers['x-cache'], 'MISS');

  // Second identical request is served from cache — no second TMDB call.
  const second = await request(app).get('/api/movies/search?query=dune');
  assert.equal(second.status, 200);
  assert.equal(second.headers['x-cache'], 'HIT');
  assert.ok(scope.isDone(), 'TMDB should have been called exactly once');
});

test('GET /api/movies/genres proxies the TMDB genre list', async () => {
  nock(TMDB)
    .get('/3/genre/movie/list')
    .query(true)
    .reply(200, { genres: [{ id: 28, name: 'Action' }] });

  const res = await request(app).get('/api/movies/genres?type=movie');
  assert.equal(res.status, 200);
  assert.equal(res.body.genres[0].name, 'Action');
});

test('TMDB 404 is surfaced as 404 (not reported as a server error)', async () => {
  nock(TMDB)
    .get('/3/movie/999999999')
    .query(true)
    .reply(404, { status_message: 'The resource you requested could not be found.' });

  const res = await request(app).get('/api/movies/movie/999999999');
  assert.equal(res.status, 404);
});

test('GET trailer returns the first playable TMDB video', async () => {
  nock(TMDB)
    .get('/3/movie/550/videos')
    .query(true)
    .reply(200, {
      results: [
        { key: 'abc123', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true },
      ],
    });

  // YouTube oEmbed marks the video as playable.
  nock('https://www.youtube.com')
    .get('/oembed')
    .query(true)
    .reply(200, { title: 'Official Trailer' });

  const res = await request(app).get('/api/movies/movie/550/trailer');
  assert.equal(res.status, 200);
  assert.equal(res.body.youtube_video_id, 'abc123');
  assert.equal(res.body.source, 'tmdb');
});

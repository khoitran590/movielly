const test = require('node:test');
const assert = require('node:assert/strict');
const {
  pageNumber,
  validateSearch,
  validateTrending,
  validateDiscover,
  validateRegion,
} = require('../src/middleware/query');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('normalizes valid search parameters', () => {
  const req = { query: { query: '  dune  ', page: '2', type: 'movie' } };
  const res = fakeRes();
  let called = false;
  validateSearch(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.deepEqual(req.query, { query: 'dune', page: 2, type: 'movie' });
});

test('normalizes trending pagination', () => {
  const req = { query: { time_window: 'day', media_type: 'tv', page: '3' } };
  const res = fakeRes();
  let called = false;
  validateTrending(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.deepEqual(req.query, { time_window: 'day', media_type: 'tv', page: 3 });
});

test('rejects invalid page and discover filters', () => {
  assert.equal(pageNumber('0'), null);
  assert.equal(pageNumber('501'), null);

  const req = { query: { type: 'movie', with_genres: '28,not-a-genre' } };
  const res = fakeRes();
  validateDiscover(req, res, () => assert.fail('invalid discovery should not continue'));
  assert.equal(res.statusCode, 400);
});

test('normalizes and validates provider regions', () => {
  const req = { query: { region: 'gb' } };
  const res = fakeRes();
  let called = false;
  validateRegion(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.query.region, 'GB');

  const badReq = { query: { region: 'USA' } };
  validateRegion(badReq, fakeRes(), () => assert.fail('invalid region should not continue'));
});

test('accepts discover date ranges and rejects conflicting year filters', () => {
  const req = { query: { type: 'tv', date_from: '2010-01-01', date_to: '2019-12-31' } };
  const res = fakeRes();
  let called = false;
  validateDiscover(req, res, () => { called = true; });
  assert.equal(called, true);

  const conflict = { query: { year: '2015', date_from: '2010-01-01' } };
  const conflictRes = fakeRes();
  validateDiscover(conflict, conflictRes, () => assert.fail('conflicting filters should not continue'));
  assert.equal(conflictRes.statusCode, 400);
});

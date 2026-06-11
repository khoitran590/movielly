const test = require('node:test');
const assert = require('node:assert/strict');
const { rankSimilar } = require('../src/lib/rankSimilar');

const movie = (id, over = {}) => ({
  id,
  poster_path: `/p${id}.jpg`,
  genre_ids: [],
  vote_average: 0,
  vote_count: 0,
  ...over,
});

test('excludes the base title itself and titles without a poster', () => {
  const results = rankSimilar({
    selfId: '1',
    baseGenreIds: new Set(),
    sources: [{ weight: 1, results: [movie(1), movie(2, { poster_path: null }), movie(3)] }],
  });
  assert.deepEqual(results.map(m => m.id), [3]);
});

test('a title appearing in multiple sources accumulates score', () => {
  const results = rankSimilar({
    selfId: '0',
    baseGenreIds: new Set(),
    sources: [
      { weight: 1, results: [movie(10), movie(20)] },
      { weight: 1, results: [movie(20)] },           // 20 appears twice → ranks first
    ],
  });
  assert.deepEqual(results.map(m => m.id), [20, 10]);
});

test('genre overlap outweighs a small source-weight difference', () => {
  const results = rankSimilar({
    selfId: '0',
    baseGenreIds: new Set([28, 12]),
    sources: [
      { weight: 2, results: [movie(10)] },                          // score 2
      { weight: 1, results: [movie(20, { genre_ids: [28, 12] })] }, // score 1 + 3 = 4
    ],
  });
  assert.equal(results[0].id, 20);
});

test('vote_count breaks score ties', () => {
  const results = rankSimilar({
    selfId: '0',
    baseGenreIds: new Set(),
    sources: [{ weight: 1, results: [movie(10, { vote_count: 5 }), movie(20, { vote_count: 50 })] }],
  });
  assert.deepEqual(results.map(m => m.id), [20, 10]);
});

test('caps results at the limit', () => {
  const many = Array.from({ length: 30 }, (_, i) => movie(i + 1));
  const results = rankSimilar({ selfId: '0', baseGenreIds: new Set(), sources: [{ weight: 1, results: many }] });
  assert.equal(results.length, 12);
});

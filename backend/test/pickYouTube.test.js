const test = require('node:test');
const assert = require('node:assert/strict');
const { pickYouTube } = require('../src/lib/pickYouTube');

const vid = (over = {}) => ({ site: 'YouTube', type: 'Trailer', official: false, key: 'k', name: 'n', ...over });

test('prefers an official trailer over everything else', () => {
  const official = vid({ official: true, key: 'official' });
  const picked = pickYouTube([
    vid({ type: 'Teaser', key: 'teaser' }),
    vid({ key: 'unofficial' }),
    official,
  ]);
  assert.equal(picked.key, 'official');
});

test('falls back to any trailer, then teaser, then any YouTube video', () => {
  assert.equal(pickYouTube([vid({ type: 'Clip', key: 'clip' }), vid({ key: 't' })]).key, 't');
  assert.equal(pickYouTube([vid({ type: 'Clip', key: 'clip' }), vid({ type: 'Teaser', key: 'tease' })]).key, 'tease');
  assert.equal(pickYouTube([vid({ type: 'Clip', key: 'clip' })]).key, 'clip');
});

test('ignores non-YouTube videos entirely', () => {
  assert.equal(pickYouTube([vid({ site: 'Vimeo', official: true })]), null);
});

test('handles empty and missing input', () => {
  assert.equal(pickYouTube([]), null);
  assert.equal(pickYouTube(), null);
});

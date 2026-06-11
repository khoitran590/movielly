const test = require('node:test');
const assert = require('node:assert/strict');
const { pickYouTube, rankYouTube } = require('../src/lib/pickYouTube');

const vid = (over = {}) => ({ site: 'YouTube', type: 'Trailer', official: false, key: 'k', name: 'n', ...over });

test('prefers an official trailer over everything else', () => {
  const picked = pickYouTube([
    vid({ type: 'Teaser', key: 'teaser' }),
    vid({ key: 'unofficial' }),
    vid({ official: true, key: 'official' }),
  ]);
  assert.equal(picked.key, 'official');
});

test('ranks official trailer > trailer > official teaser > teaser', () => {
  const ranked = rankYouTube([
    vid({ type: 'Teaser', key: 't4' }),
    vid({ type: 'Teaser', official: true, key: 't3' }),
    vid({ key: 't2' }),
    vid({ official: true, key: 't1' }),
  ]);
  assert.deepEqual(ranked.map(v => v.key), ['t1', 't2', 't3', 't4']);
});

test('never returns clips, featurettes, or other non-trailer videos', () => {
  const junk = [
    vid({ type: 'Clip', key: 'clip' }),
    vid({ type: 'Featurette', key: 'feat' }),
    vid({ type: 'Behind the Scenes', key: 'bts' }),
  ];
  assert.deepEqual(rankYouTube(junk), []);
  assert.equal(pickYouTube(junk), null);
  // …but a teaser among junk still surfaces
  assert.equal(pickYouTube([...junk, vid({ type: 'Teaser', key: 'tease' })]).key, 'tease');
});

test('ignores non-YouTube videos and videos without a key', () => {
  assert.equal(pickYouTube([vid({ site: 'Vimeo', official: true })]), null);
  assert.equal(pickYouTube([vid({ key: undefined })]), null);
});

test('handles empty and missing input', () => {
  assert.equal(pickYouTube([]), null);
  assert.equal(pickYouTube(), null);
  assert.deepEqual(rankYouTube(), []);
});

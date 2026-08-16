const test = require('node:test');
const assert = require('node:assert/strict');
const { mapWithConcurrency } = require('../src/lib/concurrency');

test('limits concurrent work and preserves input order', async () => {
  let active = 0;
  let peak = 0;

  const results = await mapWithConcurrency([3, 1, 2, 0], 2, async value => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, value * 3));
    active -= 1;
    return value * 2;
  });

  assert.equal(peak, 2);
  assert.deepEqual(results, [6, 2, 4, 0]);
});

test('rejects invalid concurrency limits', async () => {
  await assert.rejects(() => mapWithConcurrency([1], 0, async value => value), RangeError);
});

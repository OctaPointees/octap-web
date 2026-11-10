import assert from 'node:assert/strict';
import { test } from 'node:test';
import { earnMessage, earnProgress } from '../src/lib/earn-progress.ts';

const earn = (id, status, pointsAmount = null) => ({ id, status, pointsAmount });

test('a failed earn is reported as failed, even when nothing else is pending', () => {
  // The member's pending total is zero here: the failed earn's hold was released.
  const progress = earnProgress('mine', [earn('mine', 'FAILED'), earn('old', 'CONFIRMED', 50)]);
  assert.deepEqual(progress, { state: 'failed' });
  assert.match(earnMessage(progress), /did not record/);
  assert.doesNotMatch(earnMessage(progress), /confirmed/);
});

test('only this earn confirming counts as success', () => {
  assert.deepEqual(earnProgress('mine', [earn('mine', 'CONFIRMED', 120)]), {
    state: 'confirmed',
    points: 120,
  });
  assert.equal(earnMessage({ state: 'confirmed', points: 120 }), '120 points confirmed on-chain.');
  // Another earn confirming says nothing about this one.
  assert.deepEqual(earnProgress('mine', [earn('other', 'CONFIRMED', 5)]), { state: 'pending' });
});

test('pending or missing rows stay pending, so the same key is kept', () => {
  assert.deepEqual(earnProgress('mine', [earn('mine', 'PENDING')]), { state: 'pending' });
  assert.deepEqual(earnProgress('mine', []), { state: 'pending' });
  assert.match(earnMessage({ state: 'pending' }), /never earns twice/);
});

test('a reversed earn is reported as reversed', () => {
  assert.deepEqual(earnProgress('mine', [earn('mine', 'REVERSED', 120)]), { state: 'reversed' });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { getAffected, SKILLS } from '../src/index.js';

test('skill detector catalog includes the core hackathon example skills', () => {
  const keys = SKILLS.map((s) => s.key);
  assert.ok(keys.includes('sql'));
  assert.ok(keys.includes('react'));
  assert.ok(keys.includes('mongodb'));
});

test('changed SQL file maps to SQL detector', () => {
  assert.ok(getAffected(['queries/report.sql']).includes('sql'));
});

test('unknown paths do not claim any particular language detector', () => {
  assert.deepEqual(getAffected(['design/mockup.png']), []);
});

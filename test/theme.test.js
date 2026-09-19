import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTheme, resolveTheme } from '../src/theme.js';

test('normalizes only supported persisted theme choices', () => {
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('system'), 'system');
  assert.equal(normalizeTheme('unexpected'), 'system');
  assert.equal(normalizeTheme(null), 'system');
});

test('resolves system preference without overriding explicit choices', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

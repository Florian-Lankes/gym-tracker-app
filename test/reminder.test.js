import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_REMINDER_SETTINGS,
  normalizeReminderSettings,
  shouldShowBackupReminder,
  resetReminderBaseline
} from '../src/reminder.js';

const completed = (id) => ({ id, completedAt: '2026-09-20T10:00:00.000Z', exercises: [] });
const legacyCompleted = (id) => ({ id, performedAt: '2026-09-20T10:00:00.000Z', exercises: [] });
const active = (id) => ({ id, startedAt: '2026-09-20T10:00:00.000Z', performedAt: '2026-09-20T10:00:00.000Z', exercises: [] });

test('defaults safely and migrates missing or invalid reminder settings', () => {
  assert.deepEqual(DEFAULT_REMINDER_SETTINGS, { interval: 10, completedWorkoutIds: [] });
  assert.deepEqual(normalizeReminderSettings(), DEFAULT_REMINDER_SETTINGS);
  assert.deepEqual(normalizeReminderSettings({ interval: 5, completedWorkoutIds: ['one', 'one', '', 2] }), { interval: 5, completedWorkoutIds: ['one'] });
  assert.deepEqual(normalizeReminderSettings({ interval: 99, completedWorkoutIds: 'not-an-array' }), DEFAULT_REMINDER_SETTINGS);
});

test('prompts only after the selected count of completed workouts since export', () => {
  const settings = { interval: 5, completedWorkoutIds: ['old'] };
  const workouts = ['old', 'one', 'two', 'three', 'four'].map(completed).concat(active('active'));

  assert.equal(shouldShowBackupReminder(workouts, settings), false);
  assert.equal(shouldShowBackupReminder([...workouts, completed('five')], settings), true);
  assert.equal(shouldShowBackupReminder([...workouts, completed('five')], { ...settings, interval: 0 }), false);
});

test('resets the baseline only to completed workout IDs after a successful export', () => {
  const workouts = [completed('one'), legacyCompleted('two'), active('draft')];
  assert.deepEqual(resetReminderBaseline(workouts, { interval: 20, completedWorkoutIds: ['old'] }), { interval: 20, completedWorkoutIds: ['one', 'two'] });
});

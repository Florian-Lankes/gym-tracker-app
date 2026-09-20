import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup, mergeBackup } from '../src/backup.js';

const template = {
  id: 'template-1',
  name: 'Push',
  exercises: [{ id: 'exercise-1', name: 'Bench press', setCount: 3, sets: [] }]
};
const legacyWorkout = {
  id: 'workout-1',
  name: 'Legacy workout',
  performedAt: '2026-09-18T10:00:00.000Z',
  exercises: [{ id: 'exercise-2', name: 'Bench press', sets: [{ weight: 60, reps: 8 }] }]
};
const activeSession = {
  id: 'active-1',
  name: 'Push',
  performedAt: '2026-09-20T10:00:00.000Z',
  startedAt: '2026-09-20T10:00:00.000Z',
  exercises: [{ id: 'exercise-3', name: 'Bench press', sets: [{ weight: '', reps: '' }] }]
};

test('exports a readable versioned backup and restores an empty database', () => {
  const backup = createBackup({
    templates: [template],
    workouts: [legacyWorkout],
    activeSession,
    theme: 'dark'
  }, '2026-09-20T12:00:00.000Z');

  assert.equal(backup.format, 'lift-log-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.metadata.app, 'Lift Log');
  assert.deepEqual(parseBackup(JSON.stringify(backup)), backup);
  assert.deepEqual(mergeBackup({ templates: [], workouts: [], activeSession: null, theme: null }, backup), {
    templates: [template],
    workouts: [legacyWorkout],
    activeSession,
    theme: 'dark',
    reminder: { interval: 10, completedWorkoutIds: [] },
    result: { added: 5, skipped: 0 }
  });
});

test('merges by record ID and makes re-importing a backup idempotent', () => {
  const backup = createBackup({ templates: [template], workouts: [legacyWorkout], activeSession, theme: 'light' });
  const existing = { templates: [template], workouts: [legacyWorkout], activeSession, theme: 'dark', reminder: { interval: 10, completedWorkoutIds: [] } };

  assert.deepEqual(mergeBackup(existing, backup), {
    ...existing,
    result: { added: 0, skipped: 5 }
  });
});

test('rejects malformed, unsupported, and incomplete backups without producing import data', () => {
  for (const value of [
    '{not json}',
    JSON.stringify({ format: 'other-app-backup', version: 1, data: {} }),
    JSON.stringify({ format: 'lift-log-backup', version: 2, data: {} }),
    JSON.stringify({ format: 'lift-log-backup', version: 1, data: { templates: [template], workouts: [], activeSession: null, settings: { theme: 'purple' } } })
  ]) {
    assert.equal(parseBackup(value), null);
  }
});

test('rejects records without stable IDs while accepting legacy completed workouts', () => {
  const backup = createBackup({ templates: [], workouts: [legacyWorkout], activeSession: null, theme: 'system' });
  assert.ok(parseBackup(JSON.stringify(backup)));

  backup.data.workouts[0].id = '';
  assert.equal(parseBackup(JSON.stringify(backup)), null);
});

test('backs up reminder settings and migrates existing version 1 backups safely', () => {
  const withReminder = createBackup({
    templates: [], workouts: [legacyWorkout], activeSession: null, theme: 'system',
    reminder: { interval: 5, completedWorkoutIds: ['workout-1'] }
  });
  assert.deepEqual(withReminder.data.settings.reminder, { interval: 5, completedWorkoutIds: ['workout-1'] });
  assert.deepEqual(parseBackup(JSON.stringify(withReminder)).data.settings.reminder, { interval: 5, completedWorkoutIds: ['workout-1'] });

  const existingBackup = createBackup({ templates: [], workouts: [], activeSession: null, theme: 'light' });
  delete existingBackup.data.settings.reminder;
  assert.deepEqual(parseBackup(JSON.stringify(existingBackup)).data.settings.reminder, { interval: 10, completedWorkoutIds: [] });

  const merged = mergeBackup({ templates: [], workouts: [], activeSession: null, theme: null, reminder: null }, withReminder);
  assert.deepEqual(merged.reminder, { interval: 5, completedWorkoutIds: ['workout-1'] });
});

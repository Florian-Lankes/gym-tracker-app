import test from 'node:test';
import assert from 'node:assert/strict';
import { collectCustomExerciseNames, previewExerciseMigration, applyExerciseMigration } from '../src/exercise-migration.js';

const catalog = [
  { name: 'Bench Press', bodyPart: 'Chest' },
  { name: 'Barbell Row', bodyPart: 'Back' }
];

function fixture() {
  return {
    workouts: [{ id: 'workout-1', completedAt: '2026-09-01T10:00:00.000Z', exercises: [
      { id: 'workout-custom', name: 'Old Bench', note: 'keep', sets: [{ weight: 60, reps: 8 }] },
      { id: 'workout-catalog', name: 'Bench Press', sets: [{ weight: 70, reps: 5 }] }
    ] }, { id: 'workout-untouched', completedAt: '2026-09-02T10:00:00.000Z', exercises: [
      { id: 'workout-row', name: 'Barbell Row', sets: [{ weight: 50, reps: 10 }] }
    ] }],
    templates: [{ id: 'template-1', name: 'Push', exercises: [
      { id: 'template-custom', name: ' old bench ', setCount: 3, sets: [] },
      { id: 'template-catalog', name: 'Barbell Row', setCount: 2, sets: [] }
    ] }],
    activeSession: { id: 'active-1', name: 'Active', exercises: [
      { id: 'active-custom', name: 'OLD BENCH', note: 'active note', sets: [{ weight: '', reps: '' }] }
    ] }
  };
}

test('collects only custom names represented across completed workouts, templates, and active session', () => {
  const data = fixture();
  assert.deepEqual(collectCustomExerciseNames(data, catalog), ['Old Bench']);
  assert.deepEqual(data.workouts[0].exercises.map((exercise) => exercise.name), ['Old Bench', 'Bench Press']);
});

test('previews exact affected record counts for a valid selected mapping', () => {
  assert.deepEqual(previewExerciseMigration(fixture(), [{ from: 'old bench', to: 'Bench Press' }], catalog), {
    completedWorkoutExercises: 1,
    templateExercises: 1,
    activeSessionExercises: 1,
    total: 3
  });
});

test('applies a selected mapping immutably while preserving ids, sets, notes, and template order', () => {
  const data = fixture();
  const migrated = applyExerciseMigration(data, [{ from: 'Old Bench', to: 'Bench Press' }], catalog);

  assert.deepEqual(migrated.counts, { completedWorkoutExercises: 1, templateExercises: 1, activeSessionExercises: 1, total: 3 });
  assert.deepEqual(migrated.workouts[0].exercises.map((exercise) => exercise.name), ['Bench Press', 'Bench Press']);
  assert.deepEqual(migrated.templates[0].exercises.map((exercise) => [exercise.id, exercise.name, exercise.setCount]), [['template-custom', 'Bench Press', 3], ['template-catalog', 'Barbell Row', 2]]);
  assert.equal(migrated.activeSession.exercises[0].note, 'active note');
  assert.deepEqual(migrated.workouts[0].exercises[0].sets, [{ weight: 60, reps: 8 }]);
  assert.equal(migrated.workouts[1], data.workouts[1]);
  assert.equal(data.workouts[0].exercises[0].name, 'Old Bench');
  assert.equal(data.activeSession.exercises[0].name, 'OLD BENCH');
});

test('leaves data unchanged for cancel, unselected, invalid, or catalog source mappings', () => {
  const data = fixture();
  for (const mappings of [[], [{ from: 'Old Bench', to: '' }], [{ from: 'Old Bench', to: 'Not in catalog' }], [{ from: 'Bench Press', to: 'Barbell Row' }]]) {
    const migrated = applyExerciseMigration(data, mappings, catalog);
    assert.equal(migrated.changed, false);
    assert.strictEqual(migrated.workouts, data.workouts);
    assert.strictEqual(migrated.templates, data.templates);
    assert.strictEqual(migrated.activeSession, data.activeSession);
    assert.deepEqual(migrated.counts, { completedWorkoutExercises: 0, templateExercises: 0, activeSessionExercises: 0, total: 0 });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkout, addExercise, addSet, moveExercise, calculateSuggestion, exerciseHistory,
  createTemplate, startTemplate, completeWorkout, completedSessions, prepareActiveSession,
  discardActiveSession, copyPreviousSet, adjustSetValue
} from '../src/data.js';

test('builds an ordered workout with multiple weight and reps sets', () => {
  let workout = createWorkout('Push day', '2026-09-19T10:00:00.000Z');
  workout = addExercise(workout, 'Bench Press');
  workout = addSet(workout, workout.exercises[0].id, { weight: 60, reps: 8 });
  workout = addSet(workout, workout.exercises[0].id, { weight: 65, reps: 6 });

  assert.equal(workout.exercises[0].name, 'Bench Press');
  assert.deepEqual(workout.exercises[0].sets, [{ weight: 60, reps: 8 }, { weight: 65, reps: 6 }]);
});

test('copies only the immediately previous set into a later current set', () => {
  const exercise = { id: 'bench', name: 'Bench Press', sets: [{ weight: 60, reps: 8 }, { weight: 65, reps: 6 }, { weight: '', reps: '' }] };
  const workout = { exercises: [exercise] };

  assert.equal(copyPreviousSet(workout, exercise.id, 0), workout);
  const copiedSecond = copyPreviousSet(workout, exercise.id, 1);
  assert.deepEqual(copiedSecond.exercises[0].sets[1], { weight: 60, reps: 8 });
  const copiedThird = copyPreviousSet(copiedSecond, exercise.id, 2);
  assert.deepEqual(copiedThird.exercises[0].sets[2], { weight: 60, reps: 8 });
});

test('adjusts set values by their configured increments without crossing minimums', () => {
  assert.equal(adjustSetValue('', 0.5, 0, 1), 0.5);
  assert.equal(adjustSetValue(60, 0.5, 0, -1), 59.5);
  assert.equal(adjustSetValue(0, 0.5, 0, -1), 0);
  assert.equal(adjustSetValue('', 1, 1, -1), 1);
  assert.equal(adjustSetValue(8, 1, 1, 1), 9);
  assert.equal(adjustSetValue(1, 1, 1, -1), 1);
});

test('moves an exercise within a flexible workout', () => {
  let workout = createWorkout('Full body');
  workout = addExercise(addExercise(workout, 'Squat'), 'Row');
  workout = moveExercise(workout, 1, 0);
  assert.deepEqual(workout.exercises.map((exercise) => exercise.name), ['Row', 'Squat']);
});

test('stores template exercise set counts and accepts legacy string exercises', () => {
  const template = createTemplate('Upper body', [
    { name: 'Bench Press', setCount: 3 },
    { name: 'Row', setCount: 2 },
    'Pull-up'
  ]);

  assert.deepEqual(template.exercises.map(({ name, setCount }) => ({ name, setCount })), [
    { name: 'Bench Press', setCount: 3 },
    { name: 'Row', setCount: 2 },
    { name: 'Pull-up', setCount: 1 }
  ]);
});

test('starts a named template as an independent workout with configured blank set rows', () => {
  const template = createTemplate('Upper body', [{ name: 'Bench Press', setCount: 3 }, { name: 'Row', setCount: 2 }]);
  const session = startTemplate(template, '2026-09-19T10:00:00.000Z');

  assert.equal(session.name, 'Upper body');
  assert.equal(session.templateId, template.id);
  assert.notEqual(session.id, template.id);
  assert.equal(session.startedAt, '2026-09-19T10:00:00.000Z');
  assert.deepEqual(session.exercises.map((exercise) => [exercise.name, exercise.sets.length]), [['Bench Press', 3], ['Row', 2]]);
  assert.deepEqual(session.exercises[0].sets, [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }]);
});

test('reuses an existing active session instead of creating a second session', () => {
  const active = createWorkout('Already lifting', '2026-09-19T10:00:00.000Z');
  const template = createTemplate('Upper body', [{ name: 'Bench Press', setCount: 3 }]);

  assert.equal(prepareActiveSession(active, template), active);
  assert.notEqual(prepareActiveSession(null, template).id, active.id);
});

test('discarding an active session returns no active session without changing completed history', () => {
  const active = createWorkout('Draft');
  const completed = completeWorkout(createWorkout('Saved', '2026-09-19T10:00:00.000Z'), '2026-09-19T10:10:00.000Z');

  assert.equal(discardActiveSession(active), null);
  assert.equal(completedSessions([completed]).length, 1);
});

test('completes a workout with elapsed duration without changing its start time', () => {
  const session = createWorkout('Legs', '2026-09-19T10:00:00.000Z');
  const completed = completeWorkout(session, '2026-09-19T11:02:03.000Z');

  assert.equal(completed.startedAt, '2026-09-19T10:00:00.000Z');
  assert.equal(completed.completedAt, '2026-09-19T11:02:03.000Z');
  assert.equal(completed.durationSeconds, 3723);
});

test('lists completed sessions newest first while retaining legacy workouts', () => {
  const sessions = completedSessions([
    { id: 'legacy', name: 'Old workout', performedAt: '2026-09-17T12:00:00.000Z', exercises: [] },
    { id: 'older', name: 'Earlier', completedAt: '2026-09-18T10:00:00.000Z', durationSeconds: 60, exercises: [] },
    { id: 'newer', name: 'Latest', completedAt: '2026-09-19T10:00:00.000Z', durationSeconds: 120, exercises: [] }
  ]);

  assert.deepEqual(sessions.map((session) => session.id), ['newer', 'older', 'legacy']);
});

test('finds prior exercise values and produces an optional labelled suggestion', () => {
  const workouts = [{
    id: 'old',
    performedAt: '2026-09-18T10:00:00.000Z',
    exercises: [{ id: 'old-bench', name: 'Bench Press', sets: [{ weight: 60, reps: 8 }, { weight: 62.5, reps: 7 }] }]
  }];
  const history = exerciseHistory(workouts, 'Bench Press');

  assert.deepEqual(history, [{ date: 'Sep 18', weight: 62.5, reps: 7, volume: 917.5 }]);
  assert.match(calculateSuggestion(history), /Optional suggestion/);
});

test('orders chart history chronologically across month boundaries', () => {
  const workouts = [
    { id: 'oct', performedAt: '2025-10-01T10:00:00.000Z', exercises: [{ id: '1', name: 'Deadlift', sets: [{ weight: 100, reps: 5 }] }] },
    { id: 'sep', performedAt: '2025-09-30T10:00:00.000Z', exercises: [{ id: '2', name: 'Deadlift', sets: [{ weight: 95, reps: 5 }] }] }
  ];
  assert.deepEqual(exerciseHistory(workouts, 'Deadlift').map((point) => point.date), ['Sep 30', 'Oct 1']);
});

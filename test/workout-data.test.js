import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkout, addExercise, addSet, moveExercise, calculateSuggestion, exerciseHistory,
  createTemplate, startTemplate, completeWorkout, completedSessions
} from '../src/data.js';

test('builds an ordered workout with multiple weight and reps sets', () => {
  let workout = createWorkout('Push day', '2026-09-19T10:00:00.000Z');
  workout = addExercise(workout, 'Bench Press');
  workout = addSet(workout, workout.exercises[0].id, { weight: 60, reps: 8 });
  workout = addSet(workout, workout.exercises[0].id, { weight: 65, reps: 6 });

  assert.equal(workout.exercises[0].name, 'Bench Press');
  assert.deepEqual(workout.exercises[0].sets, [{ weight: 60, reps: 8 }, { weight: 65, reps: 6 }]);
});

test('moves an exercise within a flexible workout', () => {
  let workout = createWorkout('Full body');
  workout = addExercise(addExercise(workout, 'Squat'), 'Row');
  workout = moveExercise(workout, 1, 0);
  assert.deepEqual(workout.exercises.map((exercise) => exercise.name), ['Row', 'Squat']);
});

test('starts a named template as an independent workout session', () => {
  const template = createTemplate('Upper body', ['Bench Press', 'Row']);
  const session = startTemplate(template, '2026-09-19T10:00:00.000Z');

  assert.equal(session.name, 'Upper body');
  assert.equal(session.templateId, template.id);
  assert.notEqual(session.id, template.id);
  assert.equal(session.startedAt, '2026-09-19T10:00:00.000Z');
  assert.deepEqual(session.exercises.map((exercise) => exercise.name), ['Bench Press', 'Row']);
});

test('completes a workout with elapsed duration without changing its start time', () => {
  const session = createWorkout('Legs', '2026-09-19T10:00:00.000Z');
  const completed = completeWorkout(session, '2026-09-19T11:02:03.000Z');

  assert.equal(completed.startedAt, '2026-09-19T10:00:00.000Z');
  assert.equal(completed.completedAt, '2026-09-19T11:02:03.000Z');
  assert.equal(completed.durationSeconds, 3723);
});

test('lists only completed sessions newest first while retaining legacy workouts', () => {
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

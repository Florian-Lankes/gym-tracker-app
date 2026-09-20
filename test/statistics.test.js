import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseStatistics, filterCompletedWorkouts } from '../src/statistics.js';

const workouts = [
  {
    id: 'legacy-bench',
    performedAt: '2026-08-20T10:00:00.000Z',
    exercises: [{ id: 'bench-1', name: 'Bench Press', sets: [{ weight: 60, reps: 8 }, { weight: 70, reps: 5 }] }]
  },
  {
    id: 'recent-bench',
    completedAt: '2026-09-18T10:00:00.000Z',
    exercises: [{ id: 'bench-2', name: 'Bench Press', sets: [{ weight: 70, reps: 6 }, { weight: 65, reps: 10 }] }]
  },
  {
    id: 'recent-squat',
    completedAt: '2026-09-19T10:00:00.000Z',
    exercises: [{ id: 'squat-1', name: 'Squat', sets: [{ weight: 100, reps: 5 }] }]
  },
  {
    id: 'draft',
    performedAt: '2026-09-19T12:00:00.000Z',
    startedAt: '2026-09-19T12:00:00.000Z',
    exercises: [{ id: 'draft-bench', name: 'Bench Press', sets: [{ weight: 999, reps: 99 }] }]
  }
];

test('calculates volume, best weight, best reps at that weight, and estimated 1RM from completed sessions', () => {
  const stats = exerciseStatistics(workouts, 'Bench Press');

  assert.equal(stats.totalVolume, 1900);
  assert.deepEqual(stats.bestWeight, { weight: 70, reps: 6 });
  assert.equal(stats.bestRepsAtBestWeight, 6);
  assert.equal(stats.estimatedOneRepMax, 87);
  assert.equal(stats.estimateLabel, 'Estimated 1RM');
  assert.deepEqual(stats.points.map(({ date, weight, reps }) => ({ date, weight, reps })), [
    { date: 'Aug 20', weight: 70, reps: 5 },
    { date: 'Sep 18', weight: 70, reps: 6 }
  ]);
});

test('filters completed local sessions by all time, four weeks, and twelve weeks', () => {
  const now = new Date('2026-09-20T12:00:00.000Z');

  assert.deepEqual(filterCompletedWorkouts(workouts, 'all', now).map((workout) => workout.id), ['legacy-bench', 'recent-bench', 'recent-squat']);
  assert.deepEqual(filterCompletedWorkouts(workouts, '4w', now).map((workout) => workout.id), ['recent-bench', 'recent-squat']);
  assert.deepEqual(filterCompletedWorkouts(workouts, '12w', now).map((workout) => workout.id), ['legacy-bench', 'recent-bench', 'recent-squat']);
});

test('returns empty statistics when an exercise has no completed logged sets', () => {
  assert.deepEqual(exerciseStatistics(workouts, 'Deadlift'), {
    totalVolume: 0,
    bestWeight: null,
    bestRepsAtBestWeight: null,
    estimatedOneRepMax: null,
    estimateLabel: 'Estimated 1RM',
    points: []
  });
});

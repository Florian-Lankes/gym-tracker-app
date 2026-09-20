import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISE_CATALOG, catalogCategories, searchCatalog } from '../src/exercise-catalog.js';

test('ships a local catalog with the approved categories', () => {
  assert.deepEqual(catalogCategories(EXERCISE_CATALOG), [
    'Arms', 'Back', 'Calisthenics', 'Chest', 'Core', 'Full body', 'Legs', 'Shoulders'
  ]);
  assert.ok(EXERCISE_CATALOG.every((exercise) => exercise.name && exercise.category));
});

test('searches catalog names without a network dependency and filters by category', () => {
  assert.deepEqual(searchCatalog(EXERCISE_CATALOG, { query: 'press', category: 'Chest' }).map((exercise) => exercise.name), ['Bench Press', 'Incline Dumbbell Press']);
  assert.deepEqual(searchCatalog(EXERCISE_CATALOG, { category: 'Calisthenics' }).map((exercise) => exercise.name), ['Push-up', 'Dip', 'Pull-up']);
});

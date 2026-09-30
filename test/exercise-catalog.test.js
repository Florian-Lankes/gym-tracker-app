import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISE_CATALOG, OTHER_BODY_PART, bodyPartForExercise, bodyParts, catalogCategories, searchCatalog } from '../src/exercise-catalog.js';

test('ships a local catalog with the approved categories', () => {
  assert.deepEqual(catalogCategories(EXERCISE_CATALOG), [
    'Arms', 'Back', 'Calisthenics', 'Chest', 'Core', 'Full body', 'Legs', 'Shoulders'
  ]);
  assert.ok(EXERCISE_CATALOG.every((exercise) => exercise.name && exercise.category && exercise.bodyPart));
});

test('searches catalog names without a network dependency and filters by category', () => {
  assert.deepEqual(searchCatalog(EXERCISE_CATALOG, { query: 'press', category: 'Chest' }).map((exercise) => exercise.name), ['Bench Press', 'Incline Press', 'Incline Dumbbell Press', 'Dumbbell Bench Press', 'Chest Press Machine']);
  assert.deepEqual(searchCatalog(EXERCISE_CATALOG, { category: 'Calisthenics' }).map((exercise) => exercise.name), ['Push-up', 'Dip', 'Pull-up', 'Chin-up', 'Inverted Row', 'Pike Push-up', 'Burpee']);
});

test('maps catalog exercises to one body part and leaves legacy names reachable as custom', () => {
  assert.ok(bodyParts().includes('Quads'));
  assert.equal(bodyPartForExercise('Hack Squads'), 'Quads');
  assert.equal(bodyPartForExercise('Face pulls'), 'Shoulders');
  assert.equal(bodyPartForExercise('My old exercise'), OTHER_BODY_PART);
  for (const name of ['Bein beuger', 'Hack Squads', 'Split squats', 'Beinstrecken', 'Abductor', 'Wadenheben', 'Incline Press', 'Pull-up', 'Dip', 'Seated Cable Row', 'Lateral Raise', 'Biceps Curl', 'Trizeps Armstrecker', 'Face pulls', 'Flys', 'Triceps Pushdown']) assert.ok(EXERCISE_CATALOG.some((exercise) => exercise.name === name));
});

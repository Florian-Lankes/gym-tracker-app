import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISE_CATALOG, OTHER_BODY_PART, bodyPartForExercise, bodyParts, catalogCategories, searchCatalog } from '../src/exercise-catalog.js';

test('ships a broad local practical gym catalog with primary body-part metadata', () => {
  assert.ok(EXERCISE_CATALOG.length >= 180);
  assert.deepEqual(catalogCategories(EXERCISE_CATALOG), [
    'Arms', 'Back', 'Calisthenics', 'Cardio & conditioning', 'Chest', 'Core', 'Full body', 'Legs', 'Mobility', 'Shoulders'
  ]);
  assert.ok(EXERCISE_CATALOG.every((exercise) => exercise.name && exercise.category && exercise.bodyPart));
  for (const name of ['Cable Crossover', 'Machine Shoulder Press', 'Assisted Pull-up', 'Smith Machine Squat', 'Leg Extension Machine', 'Treadmill Run', 'Rowing Machine', 'Hip Flexor Stretch']) {
    assert.ok(EXERCISE_CATALOG.some((exercise) => exercise.name === name));
  }
});

test('searches catalog names without a network dependency and filters by category', () => {
  const chestPresses = searchCatalog(EXERCISE_CATALOG, { query: 'press', category: 'Chest' });
  assert.ok(chestPresses.length >= 10);
  assert.ok(chestPresses.every((exercise) => exercise.category === 'Chest' && exercise.name.toLocaleLowerCase().includes('press')));
  const calisthenics = searchCatalog(EXERCISE_CATALOG, { category: 'Calisthenics' });
  assert.ok(calisthenics.length >= 20);
  assert.ok(calisthenics.every((exercise) => exercise.category === 'Calisthenics'));
});

test('maps catalog exercises to one body part and leaves legacy names reachable as custom', () => {
  assert.ok(bodyParts().includes('Quads'));
  assert.equal(bodyPartForExercise('Hack Squads'), 'Quads');
  assert.equal(bodyPartForExercise('Face pulls'), 'Shoulders');
  assert.equal(bodyPartForExercise('My old exercise'), OTHER_BODY_PART);
  for (const name of ['Bein beuger', 'Hack Squads', 'Split squats', 'Beinstrecken', 'Abductor', 'Wadenheben', 'Incline Press', 'Pull-up', 'Dip', 'Seated Cable Row', 'Lateral Raise', 'Biceps Curl', 'Trizeps Armstrecker', 'Face pulls', 'Flys', 'Triceps Pushdown']) assert.ok(EXERCISE_CATALOG.some((exercise) => exercise.name === name));
});

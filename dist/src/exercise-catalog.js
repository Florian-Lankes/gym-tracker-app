export const OTHER_BODY_PART = 'Other / custom';

export const EXERCISE_CATALOG = [
  { name: 'Bench Press', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Incline Press', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Dumbbell Bench Press', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Flys', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Cable Fly', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Chest Press Machine', category: 'Chest', bodyPart: 'Chest' },
  { name: 'Push-up', category: 'Calisthenics', bodyPart: 'Chest' },
  { name: 'Dip', category: 'Calisthenics', bodyPart: 'Triceps' },
  { name: 'Pull-up', category: 'Calisthenics', bodyPart: 'Back' },
  { name: 'Chin-up', category: 'Calisthenics', bodyPart: 'Back' },
  { name: 'Inverted Row', category: 'Calisthenics', bodyPart: 'Back' },
  { name: 'Pike Push-up', category: 'Calisthenics', bodyPart: 'Shoulders' },
  { name: 'Burpee', category: 'Calisthenics', bodyPart: 'Full body' },
  { name: 'Barbell Row', category: 'Back', bodyPart: 'Back' },
  { name: 'Dumbbell Row', category: 'Back', bodyPart: 'Back' },
  { name: 'Seated Cable Row', category: 'Back', bodyPart: 'Back' },
  { name: 'Lat Pulldown', category: 'Back', bodyPart: 'Back' },
  { name: 'Straight-arm Pulldown', category: 'Back', bodyPart: 'Back' },
  { name: 'Chest-supported Row', category: 'Back', bodyPart: 'Back' },
  { name: 'T-bar Row', category: 'Back', bodyPart: 'Back' },
  { name: 'Back Extension', category: 'Back', bodyPart: 'Back' },
  { name: 'Overhead Press', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Arnold Press', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Lateral Raise', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Rear Delt Fly', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Face Pull', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Face pulls', category: 'Shoulders', bodyPart: 'Shoulders' },
  { name: 'Barbell Curl', category: 'Arms', bodyPart: 'Biceps' },
  { name: 'Biceps Curl', category: 'Arms', bodyPart: 'Biceps' },
  { name: 'Hammer Curl', category: 'Arms', bodyPart: 'Biceps' },
  { name: 'Preacher Curl', category: 'Arms', bodyPart: 'Biceps' },
  { name: 'Cable Curl', category: 'Arms', bodyPart: 'Biceps' },
  { name: 'Triceps Pushdown', category: 'Arms', bodyPart: 'Triceps' },
  { name: 'Trizeps Armstrecker', category: 'Arms', bodyPart: 'Triceps' },
  { name: 'Overhead Triceps Extension', category: 'Arms', bodyPart: 'Triceps' },
  { name: 'Skull Crusher', category: 'Arms', bodyPart: 'Triceps' },
  { name: 'Squat', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Front Squat', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Hack Squads', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Leg Press', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Beinstrecken', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Bulgarian Split Squat', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Split squats', category: 'Legs', bodyPart: 'Quads' },
  { name: 'Romanian Deadlift', category: 'Legs', bodyPart: 'Hamstrings' },
  { name: 'Bein beuger', category: 'Legs', bodyPart: 'Hamstrings' },
  { name: 'Seated Leg Curl', category: 'Legs', bodyPart: 'Hamstrings' },
  { name: 'Hip Thrust', category: 'Legs', bodyPart: 'Glutes' },
  { name: 'Glute Bridge', category: 'Legs', bodyPart: 'Glutes' },
  { name: 'Abductor', category: 'Legs', bodyPart: 'Glutes' },
  { name: 'Adductor Machine', category: 'Legs', bodyPart: 'Glutes' },
  { name: 'Wadenheben', category: 'Legs', bodyPart: 'Calves' },
  { name: 'Standing Calf Raise', category: 'Legs', bodyPart: 'Calves' },
  { name: 'Seated Calf Raise', category: 'Legs', bodyPart: 'Calves' },
  { name: 'Plank', category: 'Core', bodyPart: 'Core' },
  { name: 'Side Plank', category: 'Core', bodyPart: 'Core' },
  { name: 'Hanging Knee Raise', category: 'Core', bodyPart: 'Core' },
  { name: 'Hanging Leg Raise', category: 'Core', bodyPart: 'Core' },
  { name: 'Cable Crunch', category: 'Core', bodyPart: 'Core' },
  { name: 'Ab Wheel Rollout', category: 'Core', bodyPart: 'Core' },
  { name: 'Dead Bug', category: 'Core', bodyPart: 'Core' },
  { name: 'Deadlift', category: 'Full body', bodyPart: 'Full body' },
  { name: 'Clean and Press', category: 'Full body', bodyPart: 'Full body' },
  { name: 'Farmer Carry', category: 'Full body', bodyPart: 'Full body' },
  { name: 'Kettlebell Swing', category: 'Full body', bodyPart: 'Full body' },
  { name: 'Thruster', category: 'Full body', bodyPart: 'Full body' }
];

export function catalogCategories(catalog = EXERCISE_CATALOG) {
  return [...new Set(catalog.map((exercise) => exercise.category))].sort();
}

export function bodyParts(catalog = EXERCISE_CATALOG) {
  return [...new Set(catalog.map((exercise) => exercise.bodyPart))].sort();
}

export function bodyPartForExercise(name, catalog = EXERCISE_CATALOG) {
  const normalizedName = String(name || '').trim().toLocaleLowerCase();
  return catalog.find((exercise) => exercise.name.toLocaleLowerCase() === normalizedName)?.bodyPart || OTHER_BODY_PART;
}

export function searchCatalog(catalog = EXERCISE_CATALOG, { query = '', category = '' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return catalog.filter((exercise) =>
    (!category || exercise.category === category) &&
    (!normalizedQuery || exercise.name.toLocaleLowerCase().includes(normalizedQuery))
  );
}

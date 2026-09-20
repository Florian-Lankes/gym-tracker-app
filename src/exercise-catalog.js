export const EXERCISE_CATALOG = [
  { name: 'Bench Press', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Push-up', category: 'Calisthenics' },
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Lat Pulldown', category: 'Back' },
  { name: 'Seated Cable Row', category: 'Back' },
  { name: 'Squat', category: 'Legs' },
  { name: 'Romanian Deadlift', category: 'Legs' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Lateral Raise', category: 'Shoulders' },
  { name: 'Face Pull', category: 'Shoulders' },
  { name: 'Biceps Curl', category: 'Arms' },
  { name: 'Triceps Pushdown', category: 'Arms' },
  { name: 'Hammer Curl', category: 'Arms' },
  { name: 'Plank', category: 'Core' },
  { name: 'Hanging Knee Raise', category: 'Core' },
  { name: 'Cable Crunch', category: 'Core' },
  { name: 'Deadlift', category: 'Full body' },
  { name: 'Clean and Press', category: 'Full body' },
  { name: 'Farmer Carry', category: 'Full body' },
  { name: 'Dip', category: 'Calisthenics' },
  { name: 'Pull-up', category: 'Calisthenics' }
];

export function catalogCategories(catalog = EXERCISE_CATALOG) {
  return [...new Set(catalog.map((exercise) => exercise.category))].sort();
}

export function searchCatalog(catalog = EXERCISE_CATALOG, { query = '', category = '' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return catalog.filter((exercise) =>
    (!category || exercise.category === category) &&
    (!normalizedQuery || exercise.name.toLocaleLowerCase().includes(normalizedQuery))
  );
}

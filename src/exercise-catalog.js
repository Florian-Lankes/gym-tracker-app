export const OTHER_BODY_PART = 'Other / custom';

const exercises = (category, bodyPart, names) => names.map((name) => ({ name, category, bodyPart }));

export const EXERCISE_CATALOG = [
  ...exercises('Chest', 'Chest', ['Bench Press', 'Incline Press', 'Incline Dumbbell Press', 'Dumbbell Bench Press', 'Flys', 'Cable Fly', 'Chest Press Machine', 'Decline Bench Press', 'Decline Dumbbell Press', 'Cable Crossover', 'Low Cable Crossover', 'Pec Deck', 'Dumbbell Pullover', 'Smith Machine Bench Press', 'Svend Press', 'Landmine Press']),
  ...exercises('Calisthenics', 'Chest', ['Push-up', 'Wide Push-up', 'Diamond Push-up', 'Decline Push-up', 'Archer Push-up', 'Ring Push-up']),
  ...exercises('Calisthenics', 'Triceps', ['Dip', 'Bench Dip', 'Ring Dip']),
  ...exercises('Calisthenics', 'Back', ['Pull-up', 'Chin-up', 'Inverted Row', 'Australian Pull-up', 'Assisted Pull-up']),
  ...exercises('Calisthenics', 'Shoulders', ['Pike Push-up', 'Handstand Push-up']),
  ...exercises('Calisthenics', 'Full body', ['Burpee', 'Mountain Climber', 'Bear Crawl', 'Crab Walk']),
  ...exercises('Back', 'Back', ['Barbell Row', 'Dumbbell Row', 'Seated Cable Row', 'Lat Pulldown', 'Straight-arm Pulldown', 'Chest-supported Row', 'T-bar Row', 'Back Extension', 'Pendlay Row', 'Meadows Row', 'Single-arm Cable Row', 'Machine Row', 'High Row Machine', 'Neutral-grip Lat Pulldown', 'Close-grip Lat Pulldown', 'Wide-grip Lat Pulldown', 'Rack Pull', 'Good Morning', 'Reverse Hyperextension']),
  ...exercises('Shoulders', 'Shoulders', ['Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press', 'Lateral Raise', 'Rear Delt Fly', 'Face Pull', 'Face pulls', 'Machine Shoulder Press', 'Cable Lateral Raise', 'Front Raise', 'Plate Front Raise', 'Upright Row', 'Reverse Pec Deck', 'Dumbbell Shrug', 'Barbell Shrug', 'Cable Rear Delt Fly', 'Y Raise']),
  ...exercises('Arms', 'Biceps', ['Barbell Curl', 'Biceps Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl', 'EZ-bar Curl', 'Incline Dumbbell Curl', 'Concentration Curl', 'Spider Curl', 'Reverse Curl', 'Bayesian Cable Curl', 'Machine Biceps Curl', 'Zottman Curl']),
  ...exercises('Arms', 'Triceps', ['Triceps Pushdown', 'Trizeps Armstrecker', 'Overhead Triceps Extension', 'Skull Crusher', 'Rope Triceps Pushdown', 'Straight-bar Triceps Pushdown', 'Dumbbell Triceps Kickback', 'Close-grip Bench Press', 'JM Press', 'Machine Triceps Extension']),
  ...exercises('Legs', 'Quads', ['Squat', 'Front Squat', 'Hack Squads', 'Leg Press', 'Beinstrecken', 'Bulgarian Split Squat', 'Split squats', 'Smith Machine Squat', 'Goblet Squat', 'Hack Squat Machine', 'Leg Extension Machine', 'Walking Lunge', 'Reverse Lunge', 'Step-up', 'Sissy Squat', 'Belt Squat', 'Wall Sit']),
  ...exercises('Legs', 'Hamstrings', ['Romanian Deadlift', 'Bein beuger', 'Seated Leg Curl', 'Lying Leg Curl', 'Standing Leg Curl', 'Nordic Hamstring Curl', 'Single-leg Romanian Deadlift', 'Stiff-leg Deadlift', 'Glute-ham Raise']),
  ...exercises('Legs', 'Glutes', ['Hip Thrust', 'Glute Bridge', 'Abductor', 'Adductor Machine', 'Barbell Hip Thrust', 'Cable Pull-through', 'Cable Kickback', 'Frog Pump', 'Curtsy Lunge', 'Banded Lateral Walk']),
  ...exercises('Legs', 'Calves', ['Wadenheben', 'Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise', 'Single-leg Calf Raise', 'Tibialis Raise']),
  ...exercises('Core', 'Core', ['Plank', 'Side Plank', 'Hanging Knee Raise', 'Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel Rollout', 'Dead Bug', 'Crunch', 'Reverse Crunch', 'Bicycle Crunch', 'Russian Twist', 'Pallof Press', 'Wood Chop', 'Decline Sit-up', 'V-up', 'Dragon Flag', 'Bird Dog', 'Suitcase Carry']),
  ...exercises('Full body', 'Full body', ['Deadlift', 'Clean and Press', 'Farmer Carry', 'Kettlebell Swing', 'Thruster', 'Power Clean', 'Hang Clean', 'Clean and Jerk', 'Snatch', 'Dumbbell Snatch', 'Turkish Get-up', 'Sled Push', 'Sled Pull', 'Battle Rope Waves', 'Medicine Ball Slam', 'Box Jump']),
  ...exercises('Cardio & conditioning', 'Cardio', ['Treadmill Walk', 'Treadmill Run', 'Outdoor Run', 'Stationary Bike', 'Spin Bike', 'Elliptical', 'Stair Climber', 'Rowing Machine', 'SkiErg', 'Jump Rope', 'Assault Bike', 'Swimming', 'Incline Treadmill Walk', 'Jogging', 'Cycling']),
  ...exercises('Mobility', 'Mobility', ['Hip Flexor Stretch', 'Hamstring Stretch', 'Quad Stretch', 'Calf Stretch', 'Figure Four Stretch', 'Pigeon Pose', 'Child’s Pose', 'Cat-Cow', 'Thoracic Rotation', 'World’s Greatest Stretch', 'Couch Stretch', '90/90 Hip Switch', 'Ankle Dorsiflexion Mobilization', 'Shoulder Dislocate', 'Wall Slide', 'Band Pull-apart', 'Neck Mobility', 'Wrist Mobility'])
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

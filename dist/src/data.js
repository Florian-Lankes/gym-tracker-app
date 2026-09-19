const uid = () => crypto.randomUUID();

export function createWorkout(name = 'Workout', startedAt = new Date().toISOString()) {
  return { id: uid(), name: name.trim() || 'Workout', performedAt: startedAt, startedAt, exercises: [] };
}

export function createTemplate(name = 'Template', exerciseNames = []) {
  return {
    id: uid(),
    name: name.trim() || 'Template',
    exercises: exerciseNames.map((exerciseName) => ({ id: uid(), name: exerciseName.trim(), sets: [] })).filter((exercise) => exercise.name)
  };
}

export function startTemplate(template, startedAt = new Date().toISOString()) {
  return {
    id: uid(),
    templateId: template.id,
    name: template.name,
    performedAt: startedAt,
    startedAt,
    exercises: template.exercises.map((exercise) => ({ id: uid(), name: exercise.name, sets: [] }))
  };
}

export function completeWorkout(workout, completedAt = new Date().toISOString()) {
  const startedAt = workout.startedAt || workout.performedAt || completedAt;
  return {
    ...workout,
    startedAt,
    completedAt,
    durationSeconds: Math.max(0, Math.round((new Date(completedAt) - new Date(startedAt)) / 1000))
  };
}

export function completedSessions(workouts) {
  return [...workouts].sort((a, b) => new Date(b.completedAt || b.performedAt) - new Date(a.completedAt || a.performedAt));
}

export function addExercise(workout, name) {
  const cleanName = name.trim();
  if (!cleanName) return workout;
  return { ...workout, exercises: [...workout.exercises, { id: uid(), name: cleanName, sets: [] }] };
}

export function addSet(workout, exerciseId, set = { weight: '', reps: '' }) {
  return { ...workout, exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, sets: [...exercise.sets, set] } : exercise) };
}

export function moveExercise(workout, from, to) {
  if (to < 0 || to >= workout.exercises.length || from === to) return workout;
  const exercises = [...workout.exercises];
  const [exercise] = exercises.splice(from, 1);
  exercises.splice(to, 0, exercise);
  return { ...workout, exercises };
}

export function exerciseHistory(workouts, name) {
  return workouts
    .filter((workout) => new Date(workout.performedAt).getTime() <= Date.now())
    .sort((a, b) => new Date(a.performedAt) - new Date(b.performedAt))
    .flatMap((workout) => workout.exercises.filter((exercise) => exercise.name.toLowerCase() === name.toLowerCase() && exercise.sets.length)
      .map((exercise) => {
        const finalSet = exercise.sets.at(-1);
        const volume = exercise.sets.reduce((total, set) => total + Number(set.weight || 0) * Number(set.reps || 0), 0);
        return { date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(workout.performedAt)), weight: Number(finalSet.weight), reps: Number(finalSet.reps), volume };
      }));
}

export function calculateSuggestion(history) {
  if (!history.length) return 'Optional suggestion: log a comfortable first set to create your baseline.';
  const last = history.at(-1);
  return `Optional suggestion: repeat ${last.weight} kg × ${last.reps} and add a little only if it feels right.`;
}

export function latestValues(workouts, name) {
  const history = exerciseHistory(workouts, name);
  return history.length ? history.at(-1) : null;
}

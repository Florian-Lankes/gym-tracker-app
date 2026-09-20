const eventTime = (workout) => workout.completedAt || workout.performedAt;
const isLegacyCompletedWorkout = (workout) => !workout.startedAt && Boolean(workout.performedAt);
const isCompletedWorkout = (workout) => Boolean(workout.completedAt) || isLegacyCompletedWorkout(workout);
const validSet = (set) => Number.isFinite(Number(set.weight)) && Number(set.weight) >= 0 && Number.isFinite(Number(set.reps)) && Number(set.reps) > 0;
const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

export function filterCompletedWorkouts(workouts, period = 'all', now = new Date()) {
  const weeks = period === '4w' ? 4 : period === '12w' ? 12 : null;
  const cutoff = weeks ? now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000 : null;
  return workouts
    .filter(isCompletedWorkout)
    .filter((workout) => !cutoff || new Date(eventTime(workout)).getTime() >= cutoff)
    .sort((a, b) => new Date(eventTime(a)) - new Date(eventTime(b)));
}

export function exerciseStatistics(workouts, name, period = 'all', now = new Date()) {
  const matching = filterCompletedWorkouts(workouts, period, now).flatMap((workout) =>
    workout.exercises
      .filter((exercise) => exercise.name.toLowerCase() === name.toLowerCase())
      .map((exercise) => ({ workout, sets: exercise.sets.filter(validSet) }))
      .filter(({ sets }) => sets.length)
  );
  const sets = matching.flatMap(({ sets: exerciseSets }) => exerciseSets);
  if (!sets.length) return {
    totalVolume: 0,
    bestWeight: null,
    bestRepsAtBestWeight: null,
    estimatedOneRepMax: null,
    estimateLabel: 'Estimated 1RM',
    points: []
  };

  const bestWeightValue = Math.max(...sets.map((set) => Number(set.weight)));
  const bestRepsAtBestWeight = Math.max(...sets.filter((set) => Number(set.weight) === bestWeightValue).map((set) => Number(set.reps)));
  const estimatedOneRepMax = Math.round(Math.max(...sets.map((set) => Number(set.weight) * (1 + Number(set.reps) / 30))));
  const points = matching.map(({ workout, sets: exerciseSets }) => {
    const bestSet = [...exerciseSets].sort((a, b) => Number(b.weight) - Number(a.weight) || Number(b.reps) - Number(a.reps))[0];
    return { date: formatDate(eventTime(workout)), weight: Number(bestSet.weight), reps: Number(bestSet.reps) };
  });

  return {
    totalVolume: sets.reduce((total, set) => total + Number(set.weight) * Number(set.reps), 0),
    bestWeight: { weight: bestWeightValue, reps: bestRepsAtBestWeight },
    bestRepsAtBestWeight,
    estimatedOneRepMax,
    estimateLabel: 'Estimated 1RM',
    points
  };
}

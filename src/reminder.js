const INTERVALS = new Set([0, 5, 10, 20]);

export const DEFAULT_REMINDER_SETTINGS = Object.freeze({ interval: 10, completedWorkoutIds: Object.freeze([]) });

function completedWorkoutIds(workouts) {
  return workouts
    .filter((workout) => Boolean(workout.completedAt) || (!workout.startedAt && Boolean(workout.performedAt)))
    .map((workout) => workout.id)
    .filter((id) => typeof id === 'string' && id.trim());
}

export function normalizeReminderSettings(settings = {}) {
  const interval = INTERVALS.has(settings?.interval) ? settings.interval : DEFAULT_REMINDER_SETTINGS.interval;
  const completedWorkoutIds = [...new Set(Array.isArray(settings?.completedWorkoutIds)
    ? settings.completedWorkoutIds.filter((id) => typeof id === 'string' && id.trim())
    : [])];
  return { interval, completedWorkoutIds };
}

export function shouldShowBackupReminder(workouts, settings) {
  const normalized = normalizeReminderSettings(settings);
  if (!normalized.interval) return false;
  const baseline = new Set(normalized.completedWorkoutIds);
  return completedWorkoutIds(workouts).filter((id) => !baseline.has(id)).length >= normalized.interval;
}

export function resetReminderBaseline(workouts, settings) {
  return { ...normalizeReminderSettings(settings), completedWorkoutIds: [...new Set(completedWorkoutIds(workouts))] };
}

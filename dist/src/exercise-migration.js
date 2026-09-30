const normalizeName = (name) => String(name || '').trim().toLocaleLowerCase();
const emptyCounts = () => ({ completedWorkoutExercises: 0, templateExercises: 0, activeSessionExercises: 0, total: 0 });

function catalogNames(catalog) {
  return new Map(catalog.map((exercise) => [normalizeName(exercise.name), exercise.name]));
}

function exerciseNames(records) {
  return (records || []).flatMap((record) => Array.isArray(record?.exercises) ? record.exercises : []).map((exercise) => exercise?.name).filter((name) => normalizeName(name));
}

export function collectCustomExerciseNames({ workouts = [], templates = [], activeSession = null } = {}, catalog = []) {
  const known = catalogNames(catalog);
  const names = exerciseNames(workouts).concat(exerciseNames(templates), exerciseNames(activeSession ? [activeSession] : []));
  const unique = new Map();
  names.forEach((name) => {
    const normalized = normalizeName(name);
    if (!known.has(normalized) && !unique.has(normalized)) unique.set(normalized, String(name).trim());
  });
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}

function validMappings(data, mappings, catalog) {
  const known = catalogNames(catalog);
  const custom = new Set(collectCustomExerciseNames(data, catalog).map(normalizeName));
  const valid = new Map();
  (Array.isArray(mappings) ? mappings : []).forEach(({ from, to } = {}) => {
    const source = normalizeName(from);
    const target = known.get(normalizeName(to));
    if (source && target && custom.has(source)) valid.set(source, target);
  });
  return valid;
}

function countExercises(records, mappings) {
  return (records || []).flatMap((record) => Array.isArray(record?.exercises) ? record.exercises : []).filter((exercise) => mappings.has(normalizeName(exercise?.name))).length;
}

export function previewExerciseMigration(data = {}, mappings = [], catalog = []) {
  const valid = validMappings(data, mappings, catalog);
  const counts = emptyCounts();
  counts.completedWorkoutExercises = countExercises(data.workouts, valid);
  counts.templateExercises = countExercises(data.templates, valid);
  counts.activeSessionExercises = countExercises(data.activeSession ? [data.activeSession] : [], valid);
  counts.total = counts.completedWorkoutExercises + counts.templateExercises + counts.activeSessionExercises;
  return counts;
}

function renameRecords(records, mappings) {
  return records.map((record) => {
    if (!Array.isArray(record?.exercises)) return record;
    let changed = false;
    const exercises = record.exercises.map((exercise) => {
      const name = mappings.get(normalizeName(exercise?.name));
      if (!name) return exercise;
      changed = true;
      return { ...exercise, name };
    });
    return changed ? { ...record, exercises } : record;
  });
}

export function applyExerciseMigration(data = {}, mappings = [], catalog = []) {
  const valid = validMappings(data, mappings, catalog);
  const counts = previewExerciseMigration(data, mappings, catalog);
  if (!counts.total) return { ...data, counts, changed: false };
  return {
    ...data,
    workouts: renameRecords(data.workouts || [], valid),
    templates: renameRecords(data.templates || [], valid),
    activeSession: data.activeSession ? renameRecords([data.activeSession], valid)[0] : data.activeSession,
    counts,
    changed: true
  };
}

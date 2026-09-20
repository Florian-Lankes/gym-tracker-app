import { normalizeReminderSettings } from './reminder.js';

const BACKUP_FORMAT = 'lift-log-backup';
const BACKUP_VERSION = 1;
const themes = new Set(['system', 'light', 'dark']);

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasId = (value) => typeof value?.id === 'string' && value.id.trim().length > 0;
const isSet = (set) => isObject(set) && ['string', 'number'].includes(typeof set.weight) && ['string', 'number'].includes(typeof set.reps);
const hasOptionalPlainTextNote = (record) => !Object.hasOwn(record, 'note') || typeof record.note === 'string';
const isExercise = (exercise) => isObject(exercise)
  && hasOptionalPlainTextNote(exercise)
  && typeof exercise.name === 'string'
  && Array.isArray(exercise.sets)
  && exercise.sets.every(isSet);
const isRecord = (record) => isObject(record)
  && hasOptionalPlainTextNote(record)
  && hasId(record)
  && typeof record.name === 'string'
  && Array.isArray(record.exercises)
  && record.exercises.every(isExercise);

function clone(value) {
  return structuredClone(value);
}

export function createBackup({ templates, workouts, activeSession, theme, reminder }, exportedAt = new Date().toISOString()) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    metadata: {
      app: 'Lift Log',
      exportedAt
    },
    data: {
      templates: clone(templates),
      workouts: clone(workouts),
      activeSession: clone(activeSession),
      settings: {
        theme: themes.has(theme) ? theme : 'system',
        reminder: normalizeReminderSettings(reminder)
      }
    }
  };
}

export function parseBackup(text) {
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    return null;
  }

  if (!isObject(backup)
    || backup.format !== BACKUP_FORMAT
    || backup.version !== BACKUP_VERSION
    || !isObject(backup.metadata)
    || backup.metadata.app !== 'Lift Log'
    || typeof backup.metadata.exportedAt !== 'string'
    || !isObject(backup.data)) return null;

  const { templates, workouts, activeSession, settings } = backup.data;
  if (!Array.isArray(templates)
    || !Array.isArray(workouts)
    || !templates.every(isRecord)
    || !workouts.every(isRecord)
    || (activeSession !== null && !isRecord(activeSession))
    || !isObject(settings)
    || !themes.has(settings.theme)) return null;

  const idsAreUnique = (records) => new Set(records.map((record) => record.id)).size === records.length;
  if (!idsAreUnique(templates) || !idsAreUnique(workouts)) return null;

  const migrated = clone(backup);
  migrated.data.settings.reminder = normalizeReminderSettings(settings.reminder);
  return migrated;
}

function appendNew(existing, incoming) {
  const ids = new Set(existing.map((record) => record.id));
  const added = incoming.filter((record) => !ids.has(record.id));
  return { records: [...existing, ...clone(added)], added: added.length, skipped: incoming.length - added.length };
}

export function mergeBackup(existing, backup) {
  const templates = appendNew(existing.templates, backup.data.templates);
  const workouts = appendNew(existing.workouts, backup.data.workouts);
  const addActive = backup.data.activeSession && !existing.activeSession;
  const addTheme = !existing.theme && backup.data.settings.theme;
  const addReminder = !existing.reminder && backup.data.settings.reminder;
  const incomingSingletons = Number(Boolean(backup.data.activeSession)) + 2;
  const addedSingletons = Number(Boolean(addActive)) + Number(Boolean(addTheme)) + Number(Boolean(addReminder));

  return {
    templates: templates.records,
    workouts: workouts.records,
    activeSession: addActive ? clone(backup.data.activeSession) : existing.activeSession,
    theme: addTheme || existing.theme,
    reminder: addReminder || existing.reminder,
    result: {
      added: templates.added + workouts.added + addedSingletons,
      skipped: templates.skipped + workouts.skipped + incomingSingletons - addedSingletons
    }
  };
}

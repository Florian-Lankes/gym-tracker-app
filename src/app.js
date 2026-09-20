import { createTemplate, duplicateTemplate, startTemplate, completeWorkout, addSet, latestValues, completedSessions, copyPreviousSet, adjustSetValue, reviseCompletedWorkout, setWorkoutNote, setExerciseNote } from './data.js';
import { loadWorkouts, saveWorkout, deleteWorkout, loadTemplates, saveTemplate, deleteTemplate, loadActiveSession, saveActiveSession, clearActiveSession } from './db.js';
import { normalizeTheme, resolveTheme } from './theme.js';
import { createBackup, mergeBackup, parseBackup } from './backup.js';
import { exerciseStatistics } from './statistics.js';
import { EXERCISE_CATALOG, catalogCategories, searchCatalog } from './exercise-catalog.js';
import { normalizeReminderSettings, resetReminderBaseline, shouldShowBackupReminder } from './reminder.js';

const $ = (selector) => document.querySelector(selector);
let workouts = [], templates = [], activeSession = null, selectedTemplate = null, selectedCompletedWorkout = null;
const views = ['home', 'template', 'template-form', 'workout', 'statistics', 'settings', 'workout-detail', 'completed-workout-form'];
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
const REMINDER_STORAGE_KEY = 'lift-log-backup-reminder';
function loadReminderSettings() {
  try { return normalizeReminderSettings(JSON.parse(localStorage.getItem(REMINDER_STORAGE_KEY))); } catch { return normalizeReminderSettings(); }
}
let reminderSettings = loadReminderSettings();
function persistReminderSettings() { localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminderSettings)); }
function applyTheme(preference) {
  const normalized = normalizeTheme(preference);
  document.documentElement.dataset.theme = resolveTheme(normalized, themeMedia.matches);
  $('#theme-preference').value = normalized;
  document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === 'dark' ? '#0b1514' : '#eef3ef';
}
const savedTheme = normalizeTheme(localStorage.getItem('lift-log-theme'));
applyTheme(savedTheme);
$('#theme-preference').onchange = () => {
  const preference = normalizeTheme($('#theme-preference').value);
  localStorage.setItem('lift-log-theme', preference);
  applyTheme(preference);
};
themeMedia.addEventListener('change', () => {
  if (normalizeTheme(localStorage.getItem('lift-log-theme')) === 'system') applyTheme('system');
});
function showView(name) { $('#home-header').hidden = name !== 'home'; views.forEach((view) => $(`#${view}-view`).hidden = view !== name); if (name === 'home') { renderTemplates(); renderBackupReminder(); } if (name === 'statistics') renderStatistics(); }
function formatWhen(session) { return new Date(session.completedAt || session.performedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function formatDuration(seconds) { if (!Number.isFinite(seconds)) return 'Duration unavailable'; const minutes = Math.round(seconds / 60); return minutes ? `${minutes} min` : 'Under a minute'; }
function persistActive() { return saveActiveSession(activeSession); }

function showDataNotice(message) { $('#data-note').textContent = message; }
function renderBackupReminder() { $('#backup-reminder').hidden = !shouldShowBackupReminder(workouts, reminderSettings); }
function downloadBackup() {
  const exportedReminder = resetReminderBaseline(workouts, reminderSettings);
  const backup = createBackup({
    templates,
    workouts,
    activeSession,
    theme: normalizeTheme(localStorage.getItem('lift-log-theme')),
    reminder: exportedReminder
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  link.download = `lift-log-backup-${backup.metadata.exportedAt.replace(/[.:]/g, '-')}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
  reminderSettings = exportedReminder;
  persistReminderSettings();
  renderBackupReminder();
  showDataNotice('Backup downloaded. Keep this file somewhere you trust.');
}
async function importBackup(file) {
  let backup;
  try {
    backup = parseBackup(await file.text());
  } catch {
    backup = null;
  }
  if (!backup) return showDataNotice('Import result: added 0, skipped 0, invalid 1. Your data was not changed.');

  const savedThemePreference = localStorage.getItem('lift-log-theme');
  const savedReminder = localStorage.getItem(REMINDER_STORAGE_KEY);
  const existing = { templates, workouts, activeSession, theme: savedThemePreference ? normalizeTheme(savedThemePreference) : null, reminder: savedReminder ? reminderSettings : null };
  const merged = mergeBackup(existing, backup);
  const templateIds = new Set(templates.map((template) => template.id));
  const workoutIds = new Set(workouts.map((workout) => workout.id));
  await Promise.all([
    ...merged.templates.filter((template) => !templateIds.has(template.id)).map(saveTemplate),
    ...merged.workouts.filter((workout) => !workoutIds.has(workout.id)).map(saveWorkout),
    merged.activeSession !== activeSession ? saveActiveSession(merged.activeSession) : Promise.resolve()
  ]);
  if (!savedThemePreference) {
    localStorage.setItem('lift-log-theme', merged.theme);
    applyTheme(merged.theme);
  }
  if (!savedReminder) {
    reminderSettings = merged.reminder;
    persistReminderSettings();
    $('#backup-reminder-interval').value = reminderSettings.interval;
  }
  [workouts, templates, activeSession] = await Promise.all([loadWorkouts(), loadTemplates(), loadActiveSession()]);
  showDataNotice(`Import result: added ${merged.result.added}, skipped ${merged.result.skipped}, invalid 0.`);
}

function renderTemplates() {
  const list = $('#template-list'); list.replaceChildren();
  if (!templates.length) list.innerHTML = '<p class="subtle">Create a workout template to get started.</p>';
  templates.forEach((template) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'history-card template-card';
    button.innerHTML = `<strong></strong><span class="subtle"></span>`; button.querySelector('strong').textContent = template.name;
    button.querySelector('span').textContent = template.exercises.map((exercise) => `${exercise.name} · ${Number.parseInt(exercise.setCount, 10) || 1} sets`).join(' / ');
    button.onclick = () => { selectedTemplate = template; renderTemplateDetail(); showView('template'); }; list.append(button);
  });
}
function renderTemplateDetail() {
  $('#template-title').textContent = selectedTemplate.name;
  const list = $('#template-exercise-list');
  list.replaceChildren();
  selectedTemplate.exercises.forEach((exercise) => {
    const row = document.createElement('article');
    row.className = 'template-detail-exercise';
    const name = document.createElement('strong');
    const sets = document.createElement('span');
    name.textContent = exercise.name;
    sets.textContent = `${Number.parseInt(exercise.setCount, 10) || 1} sets`;
    row.append(name, sets);
    list.append(row);
  });
}
function updateTemplateExerciseControls() {
  const rows = [...document.querySelectorAll('.template-exercise')];
  rows.forEach((row, index) => {
    row.querySelector('.move-template-exercise-up').disabled = index === 0;
    row.querySelector('.move-template-exercise-down').disabled = index === rows.length - 1;
  });
}
function appendTemplateExercise(value = {}) {
  const row = document.createElement('div'); row.className = 'template-exercise';
  row.innerHTML = '<label>Exercise<input class="template-exercise-name" maxlength="60" required></label><label>Sets<input class="template-set-count" type="number" min="1" max="20" value="1" required></label><div class="template-exercise-actions"><button type="button" class="move-template-exercise-up" aria-label="Move exercise up">↑</button><button type="button" class="move-template-exercise-down" aria-label="Move exercise down">↓</button><button type="button" class="remove-exercise" aria-label="Remove exercise">×</button></div>';
  row.querySelector('.template-exercise-name').value = value.name || ''; row.querySelector('.template-set-count').value = Number.parseInt(value.setCount, 10) || 1;
  row.querySelector('.remove-exercise').onclick = () => { row.remove(); updateTemplateExerciseControls(); };
  row.querySelector('.move-template-exercise-up').onclick = () => { const previous = row.previousElementSibling; if (previous) { $('#template-exercises').insertBefore(row, previous); updateTemplateExerciseControls(); } };
  row.querySelector('.move-template-exercise-down').onclick = () => { const next = row.nextElementSibling; if (next) { $('#template-exercises').insertBefore(next, row); updateTemplateExerciseControls(); } };
  $('#template-exercises').append(row); updateTemplateExerciseControls();
}
function renderExerciseCatalog() {
  const category = $('#catalog-category').value;
  const query = $('#catalog-search').value;
  const results = $('#catalog-results');
  results.replaceChildren();
  searchCatalog(EXERCISE_CATALOG, { category, query }).forEach((exercise) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'catalog-result';
    const name = document.createElement('strong'); name.textContent = exercise.name;
    const label = document.createElement('span'); label.textContent = exercise.category;
    button.append(name, label);
    button.onclick = () => {
      const existingNames = [...document.querySelectorAll('.template-exercise-name')].map((input) => input.value.trim().toLocaleLowerCase());
      appendTemplateExercise({ name: exercise.name, setCount: 1 });
      $('#template-note').textContent = existingNames.includes(exercise.name.toLocaleLowerCase()) ? `${exercise.name} was added again; duplicate exercises remain separate.` : `${exercise.name} added. Set the number of sets below.`;
    };
    results.append(button);
  });
  if (!results.children.length) results.innerHTML = '<p class="subtle">No matching exercises. Add a custom exercise below.</p>';
}
function openTemplateForm(template = null) {
  $('#template-form').reset(); $('#template-exercises').replaceChildren(); $('#template-id').value = template?.id || ''; $('#template-name').value = template?.name || ''; $('#template-form-heading').textContent = template ? 'Edit template' : 'New template'; $('#template-note').textContent = '';
  const categorySelect = $('#catalog-category'); categorySelect.replaceChildren(new Option('All categories', ''));
  categorySelect.append(...catalogCategories().map((category) => new Option(category, category)));
  (template?.exercises || [{}]).forEach(appendTemplateExercise); renderExerciseCatalog(); showView('template-form');
}
async function startSelectedTemplate() {
  if (activeSession) return renderWorkout();
  activeSession = startTemplate(selectedTemplate); await persistActive(); renderWorkout();
}
function renderWorkout() {
  if (!activeSession) return showView('home');
  $('#workout-title').textContent = activeSession.name; $('#session-start').textContent = `Started ${new Date(activeSession.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`; $('#workout-note').value = activeSession.note || ''; $('#workout-note').oninput = async () => { activeSession = setWorkoutNote(activeSession, $('#workout-note').value); await persistActive(); }; $('#guard-actions').hidden = true; $('#save-workout').hidden = false;
  const list = $('#exercise-list'); list.replaceChildren();
  activeSession.exercises.forEach((exercise) => {
    const card = $('#exercise-template').content.firstElementChild.cloneNode(true); card.querySelector('h3').textContent = exercise.name;
    const previous = latestValues(workouts, exercise.name); card.querySelector('.previous').textContent = previous ? `Last logged: ${previous.weight} kg × ${previous.reps}` : 'No previous log yet';
    const exerciseNote = card.querySelector('.exercise-note'); exerciseNote.value = exercise.note || ''; exerciseNote.oninput = async () => { activeSession = setExerciseNote(activeSession, exercise.id, exerciseNote.value); await persistActive(); };
    const sets = card.querySelector('.sets'); exercise.sets.forEach((set, index) => {
      const row = document.createElement('div'); row.className = 'set-row'; row.innerHTML = `<span>Set ${index + 1}<button type="button" class="copy-set" aria-label="Copy previous set into set ${index + 1}"${index === 0 ? ' disabled' : ''}>Copy previous</button></span><label>kg<div class="numeric-control"><button type="button" data-adjust="weight:-1" aria-label="Decrease weight by 0.5 kilograms">−</button><input type="number" min="0" step="0.5" inputmode="decimal" aria-label="Weight in kilograms"><button type="button" data-adjust="weight:1" aria-label="Increase weight by 0.5 kilograms">+</button></div></label><label>reps<div class="numeric-control"><button type="button" data-adjust="reps:-1" aria-label="Decrease repetitions by 1">−</button><input type="number" min="1" step="1" inputmode="numeric" aria-label="Repetitions"><button type="button" data-adjust="reps:1" aria-label="Increase repetitions by 1">+</button></div></label>`;
      const [weight, reps] = row.querySelectorAll('input'); weight.value = set.weight ?? ''; reps.value = set.reps ?? '';
      const currentSet = () => activeSession.exercises.find((item) => item.id === exercise.id).sets[index];
      weight.oninput = async () => { currentSet().weight = weight.value; await persistActive(); };
      reps.oninput = async () => { currentSet().reps = reps.value; await persistActive(); };
      row.querySelector('.copy-set').onclick = async () => { activeSession = copyPreviousSet(activeSession, exercise.id, index); await persistActive(); renderWorkout(); };
      row.querySelectorAll('[data-adjust]').forEach((button) => { button.onclick = async () => { const [field, direction] = button.dataset.adjust.split(':'); const input = field === 'weight' ? weight : reps; const next = adjustSetValue(input.value, field === 'weight' ? 0.5 : 1, field === 'weight' ? 0 : 1, Number(direction)); input.value = next; currentSet()[field] = next; await persistActive(); }; });
      sets.append(row);
    }); list.append(card);
  }); showView('workout');
}
async function saveCurrentWorkout() {
  if (!activeSession) return; const finished = structuredClone(activeSession);
  finished.exercises.forEach((exercise) => { exercise.sets = exercise.sets.filter((set) => Number(set.weight) >= 0 && Number(set.reps) > 0).map((set) => ({ weight: Number(set.weight), reps: Number(set.reps) })); });
  finished.exercises = finished.exercises.filter((exercise) => exercise.sets.length);
  if (!finished.exercises.length) { $('#save-note').textContent = 'Enter weight and reps for at least one set before saving.'; return; }
  await saveWorkout(completeWorkout(finished)); await clearActiveSession(); activeSession = null; workouts = await loadWorkouts(); showView('home');
}
async function discardCurrentWorkout() { await clearActiveSession(); activeSession = null; showView('home'); }
function chart(points) { const canvas = $('#progress-chart'), ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); $('#chart-empty').hidden = Boolean(points.length); if (!points.length) return; const pad = 32, max = Math.max(...points.map((p) => p.weight), 1), min = Math.min(...points.map((p) => p.weight), max - 1), range = max - min || 1; const x = (i) => pad + i * ((canvas.width - pad * 2) / Math.max(points.length - 1, 1)), y = (p) => canvas.height - pad - ((p.weight - min) / range) * (canvas.height - pad * 2); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--chart').trim(); ctx.lineWidth = 3; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(x(i), y(p)) : ctx.moveTo(x(i), y(p))); ctx.stroke(); }
function renderStatistics() { const names = [...new Set(completedSessions(workouts).flatMap((w) => w.exercises.map((e) => e.name)))].sort(), select = $('#chart-exercise'), chosen = select.value; select.replaceChildren(...names.map((name) => new Option(name, name, false, name === chosen))); if (names.length && !select.value) select.value = names[0]; const stats = exerciseStatistics(workouts, select.value, $('#statistics-period').value); chart(stats.points); const metrics = $('#progress-metrics'); metrics.replaceChildren(); if (stats.bestWeight) { [['Best weight', `${stats.bestWeight.weight} kg × ${stats.bestRepsAtBestWeight}`], ['Total volume', `${stats.totalVolume} kg`], [stats.estimateLabel, `${stats.estimatedOneRepMax} kg`]].forEach(([label, value]) => { const item = document.createElement('div'); item.innerHTML = '<span></span><strong></strong>'; item.querySelector('span').textContent = label; item.querySelector('strong').textContent = value; metrics.append(item); }); } else metrics.innerHTML = '<p class="subtle">Choose an exercise with completed logged sets to see progress.</p>'; const list = $('#overview-list'); list.replaceChildren(); completedSessions(workouts).forEach((session) => { const card = document.createElement('button'); card.type = 'button'; card.className = 'history-card history-button'; card.innerHTML = `<strong></strong><p class="subtle"></p>`; card.querySelector('strong').textContent = session.name; card.querySelector('p').textContent = `${formatWhen(session)} · ${formatDuration(session.durationSeconds)}`; card.onclick = () => { selectedCompletedWorkout = session; renderCompletedWorkoutDetail(); showView('workout-detail'); }; list.append(card); }); if (!workouts.length) list.innerHTML = '<p class="subtle">No completed workouts yet.</p>'; }

function renderCompletedWorkoutDetail() {
  if (!selectedCompletedWorkout) return showView('statistics');
  $('#completed-workout-title').textContent = selectedCompletedWorkout.name;
  $('#completed-workout-when').textContent = `${formatWhen(selectedCompletedWorkout)} · ${formatDuration(selectedCompletedWorkout.durationSeconds)}`;
  const sessionNote = $('#completed-workout-session-note'); sessionNote.hidden = !selectedCompletedWorkout.note; sessionNote.textContent = selectedCompletedWorkout.note || '';
  const list = $('#completed-workout-exercises'); list.replaceChildren();
  selectedCompletedWorkout.exercises.forEach((exercise) => {
    const card = document.createElement('article'); card.className = 'exercise-card';
    const title = document.createElement('h3'); title.textContent = exercise.name;
    const sets = document.createElement('p'); sets.className = 'subtle'; sets.textContent = exercise.sets.map((set, index) => `Set ${index + 1}: ${set.weight} kg × ${set.reps}`).join(' · ');
    card.append(title, sets); if (exercise.note) { const note = document.createElement('p'); note.className = 'workout-note-display'; note.textContent = exercise.note; card.append(note); } list.append(card);
  });
}
function localDateTimeValue(value) { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function appendCompletedWorkoutExercise(exercise = { id: crypto.randomUUID(), name: '', sets: [{ weight: '', reps: '' }] }) {
  const card = document.createElement('fieldset'); card.className = 'completed-exercise-edit';
  card.innerHTML = '<legend>Exercise</legend><label>Name<input class="completed-exercise-name" maxlength="60" required></label><label>Note (optional)<textarea class="completed-exercise-note" maxlength="1000" rows="3"></textarea></label><div class="completed-set-list"></div><button class="secondary add-completed-set" type="button">Add set</button><button class="secondary danger remove-completed-exercise" type="button">Remove exercise</button>';
  card.querySelector('.completed-exercise-name').value = exercise.name;
  card.querySelector('.completed-exercise-note').value = exercise.note || '';
  const appendSet = (set = { weight: '', reps: '' }) => {
    const row = document.createElement('div'); row.className = 'completed-set-edit';
    row.innerHTML = '<label>Weight (kg)<input class="completed-set-weight" type="number" min="0" step="0.5" inputmode="decimal" required></label><label>Reps<input class="completed-set-reps" type="number" min="1" step="1" inputmode="numeric" required></label><button class="remove-completed-set" type="button" aria-label="Remove set">×</button>';
    row.querySelector('.completed-set-weight').value = set.weight ?? ''; row.querySelector('.completed-set-reps').value = set.reps ?? '';
    card.querySelector('.completed-set-list').append(row);
  };
  (exercise.sets.length ? exercise.sets : [{ weight: '', reps: '' }]).forEach(appendSet);
  card.querySelector('.add-completed-set').onclick = () => appendSet();
  card.querySelector('.remove-completed-exercise').onclick = () => card.remove();
  card.addEventListener('click', (event) => { if (event.target.classList.contains('remove-completed-set')) event.target.closest('.completed-set-edit').remove(); });
  $('#completed-workout-edit-exercises').append(card);
}
function openCompletedWorkoutForm() {
  if (!selectedCompletedWorkout) return showView('statistics');
  $('#completed-workout-form-title').textContent = selectedCompletedWorkout.name;
  $('#completed-workout-at').value = localDateTimeValue(selectedCompletedWorkout.completedAt || selectedCompletedWorkout.performedAt);
  $('#completed-workout-session-note-input').value = selectedCompletedWorkout.note || '';
  $('#completed-workout-edit-exercises').replaceChildren(); selectedCompletedWorkout.exercises.forEach(appendCompletedWorkoutExercise);
  $('#completed-workout-note').textContent = ''; showView('completed-workout-form');
}
async function saveCompletedWorkoutChanges(event) {
  event.preventDefault();
  const completedAt = new Date($('#completed-workout-at').value);
  const exercises = [...document.querySelectorAll('.completed-exercise-edit')].map((card) => ({
    id: crypto.randomUUID(), name: card.querySelector('.completed-exercise-name').value.trim(), note: card.querySelector('.completed-exercise-note').value,
    sets: [...card.querySelectorAll('.completed-set-edit')].map((row) => ({ weight: Number(row.querySelector('.completed-set-weight').value), reps: Number(row.querySelector('.completed-set-reps').value) }))
  })).filter((exercise) => exercise.name && exercise.sets.length);
  if (Number.isNaN(completedAt.getTime()) || !exercises.length || exercises.some((exercise) => exercise.sets.some((set) => set.weight < 0 || set.reps <= 0))) { $('#completed-workout-note').textContent = 'Add at least one named exercise with valid weight and reps.'; return; }
  selectedCompletedWorkout = reviseCompletedWorkout(selectedCompletedWorkout, { completedAt: completedAt.toISOString(), exercises });
  selectedCompletedWorkout = setWorkoutNote(selectedCompletedWorkout, $('#completed-workout-session-note-input').value);
  exercises.forEach((exercise) => { selectedCompletedWorkout = setExerciseNote(selectedCompletedWorkout, exercise.id, exercise.note); });
  await saveWorkout(selectedCompletedWorkout); workouts = await loadWorkouts(); renderCompletedWorkoutDetail(); showView('workout-detail');
}
async function confirmCompletedWorkoutDelete() {
  if (!selectedCompletedWorkout) return;
  await deleteWorkout(selectedCompletedWorkout.id); workouts = await loadWorkouts(); selectedCompletedWorkout = null; $('#delete-workout-guard').hidden = true; showView('statistics');
}

$('#new-template').onclick = () => openTemplateForm(); $('#statistics').onclick = () => showView('statistics'); $('#settings').onclick = () => showView('settings'); $('#start-template').onclick = startSelectedTemplate; $('#edit-template').onclick = () => openTemplateForm(selectedTemplate);
$('#duplicate-template').onclick = async () => {
  if (!selectedTemplate) return;
  const duplicate = duplicateTemplate(selectedTemplate, templates.map((template) => template.name));
  await saveTemplate(duplicate);
  templates = await loadTemplates();
  selectedTemplate = templates.find((template) => template.id === duplicate.id);
  renderTemplateDetail();
};
$('#workout-detail-back').onclick = () => showView('statistics');
$('#edit-completed-workout').onclick = openCompletedWorkoutForm;
$('#delete-completed-workout').onclick = () => { if (!selectedCompletedWorkout) return; $('#delete-workout-message').textContent = `Delete “${selectedCompletedWorkout.name}” from ${formatWhen(selectedCompletedWorkout)}? This cannot be undone.`; $('#delete-workout-guard').hidden = false; $('#cancel-delete-workout').focus(); };
$('#cancel-delete-workout').onclick = () => { $('#delete-workout-guard').hidden = true; $('#delete-completed-workout').focus(); };
$('#confirm-delete-workout').onclick = confirmCompletedWorkoutDelete;
$('#completed-workout-form-back').onclick = () => { renderCompletedWorkoutDetail(); showView('workout-detail'); };
$('#add-completed-exercise').onclick = () => appendCompletedWorkoutExercise();
$('#completed-workout-form').onsubmit = saveCompletedWorkoutChanges;

$('#delete-template').onclick = async () => { await deleteTemplate(selectedTemplate.id); templates = await loadTemplates(); showView('home'); };
$('#add-template-exercise').onclick = () => appendTemplateExercise(); $('#template-form').onsubmit = async (event) => { event.preventDefault(); const exercises = [...document.querySelectorAll('.template-exercise')].map((row) => ({ name: row.querySelector('.template-exercise-name').value, setCount: row.querySelector('.template-set-count').value })); const template = createTemplate($('#template-name').value, exercises); if (!template.exercises.length) { $('#template-note').textContent = 'Add at least one exercise.'; return; } const id = $('#template-id').value; await saveTemplate(id ? { ...template, id } : template); templates = await loadTemplates(); selectedTemplate = templates.find((item) => item.id === (id || template.id)); showView('home'); };
$('#catalog-search').oninput = renderExerciseCatalog; $('#catalog-category').onchange = renderExerciseCatalog;
function openWorkoutGuard() { $('#save-workout').hidden = true; $('#guard-actions').hidden = false; $('#guard-save').focus(); }
function closeWorkoutGuard() { $('#guard-actions').hidden = true; $('#save-workout').hidden = false; $('#workout-back').focus(); }
$('#workout-back').onclick = openWorkoutGuard; $('#guard-save').onclick = saveCurrentWorkout; $('#save-workout').onclick = saveCurrentWorkout; $('#guard-discard').onclick = discardCurrentWorkout; $('#guard-cancel').onclick = closeWorkoutGuard;
$('#export-data').onclick = downloadBackup;
$('#import-data').onchange = async () => { const [file] = $('#import-data').files; $('#import-data').value = ''; if (file) await importBackup(file); };
$('#backup-reminder-interval').value = reminderSettings.interval;
$('#backup-reminder-interval').onchange = () => { reminderSettings = normalizeReminderSettings({ ...reminderSettings, interval: Number($('#backup-reminder-interval').value) }); persistReminderSettings(); renderBackupReminder(); };
$('#backup-reminder-settings').onclick = () => showView('settings');
$('#dismiss-backup-reminder').onclick = () => { $('#backup-reminder').hidden = true; };
document.querySelectorAll('[data-back="home"]').forEach((button) => button.onclick = () => showView('home')); $('#chart-exercise').onchange = renderStatistics; $('#statistics-period').onchange = renderStatistics;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); [workouts, templates, activeSession] = await Promise.all([loadWorkouts(), loadTemplates(), loadActiveSession()]); if (activeSession) renderWorkout(); else showView('home');

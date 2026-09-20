import { createTemplate, startTemplate, completeWorkout, addSet, exerciseHistory, latestValues, completedSessions } from './data.js';
import { loadWorkouts, saveWorkout, loadTemplates, saveTemplate, deleteTemplate, loadActiveSession, saveActiveSession, clearActiveSession } from './db.js';
import { normalizeTheme, resolveTheme } from './theme.js';

const $ = (selector) => document.querySelector(selector);
let workouts = [], templates = [], activeSession = null, selectedTemplate = null;
const views = ['home', 'template', 'template-form', 'workout', 'statistics', 'settings'];
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
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
function showView(name) { $('#home-header').hidden = name !== 'home'; views.forEach((view) => $(`#${view}-view`).hidden = view !== name); if (name === 'home') renderTemplates(); if (name === 'statistics') renderStatistics(); }
function formatWhen(session) { return new Date(session.completedAt || session.performedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function formatDuration(seconds) { if (!Number.isFinite(seconds)) return 'Duration unavailable'; const minutes = Math.round(seconds / 60); return minutes ? `${minutes} min` : 'Under a minute'; }
function persistActive() { return saveActiveSession(activeSession); }

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
function appendTemplateExercise(value = {}) {
  const row = document.createElement('div'); row.className = 'template-exercise';
  row.innerHTML = '<label>Exercise<input class="template-exercise-name" maxlength="60" required></label><label>Sets<input class="template-set-count" type="number" min="1" max="20" value="1" required></label><button type="button" class="remove-exercise" aria-label="Remove exercise">×</button>';
  row.querySelector('.template-exercise-name').value = value.name || ''; row.querySelector('.template-set-count').value = Number.parseInt(value.setCount, 10) || 1;
  row.querySelector('.remove-exercise').onclick = () => row.remove(); $('#template-exercises').append(row);
}
function openTemplateForm(template = null) {
  $('#template-form').reset(); $('#template-exercises').replaceChildren(); $('#template-id').value = template?.id || ''; $('#template-name').value = template?.name || ''; $('#template-form-heading').textContent = template ? 'Edit template' : 'New template';
  (template?.exercises || [{}]).forEach(appendTemplateExercise); showView('template-form');
}
async function startSelectedTemplate() {
  if (activeSession) return renderWorkout();
  activeSession = startTemplate(selectedTemplate); await persistActive(); renderWorkout();
}
function renderWorkout() {
  if (!activeSession) return showView('home');
  $('#workout-title').textContent = activeSession.name; $('#session-start').textContent = `Started ${new Date(activeSession.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`; $('#guard-actions').hidden = true; $('#save-workout').hidden = false;
  const list = $('#exercise-list'); list.replaceChildren();
  activeSession.exercises.forEach((exercise) => {
    const card = $('#exercise-template').content.firstElementChild.cloneNode(true); card.querySelector('h3').textContent = exercise.name;
    const previous = latestValues(workouts, exercise.name); card.querySelector('.previous').textContent = previous ? `Last logged: ${previous.weight} kg × ${previous.reps}` : 'No previous log yet';
    const sets = card.querySelector('.sets'); exercise.sets.forEach((set, index) => {
      const row = document.createElement('div'); row.className = 'set-row'; row.innerHTML = `<span>Set ${index + 1}</span><label>kg<input type="number" min="0" step="0.5" inputmode="decimal" aria-label="Weight in kilograms"></label><label>reps<input type="number" min="1" step="1" inputmode="numeric" aria-label="Repetitions"></label>`;
      const [weight, reps] = row.querySelectorAll('input'); weight.value = set.weight ?? ''; reps.value = set.reps ?? '';
      weight.oninput = async () => { set.weight = weight.value; await persistActive(); }; reps.oninput = async () => { set.reps = reps.value; await persistActive(); }; sets.append(row);
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
function chart() { const name = $('#chart-exercise').value; const points = exerciseHistory(workouts, name); const canvas = $('#progress-chart'), ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); $('#chart-empty').hidden = Boolean(points.length); if (!points.length) return; const pad = 32, max = Math.max(...points.map((p) => p.weight), 1), min = Math.min(...points.map((p) => p.weight), max - 1), range = max - min || 1; const x = (i) => pad + i * ((canvas.width - pad * 2) / Math.max(points.length - 1, 1)), y = (p) => canvas.height - pad - ((p.weight - min) / range) * (canvas.height - pad * 2); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--chart').trim(); ctx.lineWidth = 3; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(x(i), y(p)) : ctx.moveTo(x(i), y(p))); ctx.stroke(); }
function renderStatistics() { const names = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.name)))].sort(), select = $('#chart-exercise'), chosen = select.value; select.replaceChildren(...names.map((name) => new Option(name, name, false, name === chosen))); chart(); const list = $('#overview-list'); list.replaceChildren(); completedSessions(workouts).forEach((session) => { const card = document.createElement('article'); card.className = 'history-card'; card.innerHTML = `<strong></strong><p class="subtle"></p>`; card.querySelector('strong').textContent = session.name; card.querySelector('p').textContent = `${formatWhen(session)} · ${formatDuration(session.durationSeconds)}`; list.append(card); }); if (!workouts.length) list.innerHTML = '<p class="subtle">No completed workouts yet.</p>'; }

$('#new-template').onclick = () => openTemplateForm(); $('#statistics').onclick = () => showView('statistics'); $('#settings').onclick = () => showView('settings'); $('#start-template').onclick = startSelectedTemplate; $('#edit-template').onclick = () => openTemplateForm(selectedTemplate);
$('#delete-template').onclick = async () => { await deleteTemplate(selectedTemplate.id); templates = await loadTemplates(); showView('home'); };
$('#add-template-exercise').onclick = () => appendTemplateExercise(); $('#template-form').onsubmit = async (event) => { event.preventDefault(); const exercises = [...document.querySelectorAll('.template-exercise')].map((row) => ({ name: row.querySelector('.template-exercise-name').value, setCount: row.querySelector('.template-set-count').value })); const template = createTemplate($('#template-name').value, exercises); if (!template.exercises.length) { $('#template-note').textContent = 'Add at least one exercise.'; return; } const id = $('#template-id').value; await saveTemplate(id ? { ...template, id } : template); templates = await loadTemplates(); selectedTemplate = templates.find((item) => item.id === (id || template.id)); showView('home'); };
function openWorkoutGuard() { $('#save-workout').hidden = true; $('#guard-actions').hidden = false; $('#guard-save').focus(); }
function closeWorkoutGuard() { $('#guard-actions').hidden = true; $('#save-workout').hidden = false; $('#workout-back').focus(); }
$('#workout-back').onclick = openWorkoutGuard; $('#guard-save').onclick = saveCurrentWorkout; $('#save-workout').onclick = saveCurrentWorkout; $('#guard-discard').onclick = discardCurrentWorkout; $('#guard-cancel').onclick = closeWorkoutGuard;
document.querySelectorAll('[data-back="home"]').forEach((button) => button.onclick = () => showView('home')); $('#chart-exercise').onchange = chart;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); [workouts, templates, activeSession] = await Promise.all([loadWorkouts(), loadTemplates(), loadActiveSession()]); if (activeSession) renderWorkout(); else showView('home');

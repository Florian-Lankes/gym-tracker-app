import {
  createWorkout, createTemplate, startTemplate, completeWorkout, completedSessions,
  addExercise, addSet, moveExercise, exerciseHistory, latestValues, calculateSuggestion
} from './data.js';
import { loadWorkouts, saveWorkout, loadTemplates, saveTemplate, deleteTemplate } from './db.js';

let workouts = [];
let templates = [];
let draft = createWorkout('');
const $ = (selector) => document.querySelector(selector);

function valueOrBlank(value) { return value === undefined || value === null ? '' : value; }
function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return 'Duration unavailable';
  const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const remainder = seconds % 60;
  return [hours && `${hours}h`, minutes && `${minutes}m`, (!hours && !minutes || remainder) && `${remainder}s`].filter(Boolean).join(' ');
}
function formatWhen(session) { return new Date(session.completedAt || session.performedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function restoreValues(name) {
  const previous = latestValues(workouts, name);
  return previous ? { weight: previous.weight, reps: previous.reps } : { weight: '', reps: '' };
}
function resetDraft() {
  draft = createWorkout('');
  $('#workout-name').value = '';
  $('#session-start').textContent = `Session started ${new Date(draft.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  renderExercises();
}
function addNamedExercise() {
  const input = $('#exercise-name'); const name = input.value.trim();
  if (!name) return input.focus();
  draft = addExercise(draft, name);
  const exercise = draft.exercises.at(-1);
  draft = addSet(draft, exercise.id, restoreValues(name));
  input.value = ''; renderExercises();
}
function renderExercises() {
  const list = $('#exercise-list'); list.replaceChildren();
  draft.exercises.forEach((exercise, index) => {
    const card = $('#exercise-template').content.firstElementChild.cloneNode(true);
    card.querySelector('h3').textContent = exercise.name;
    const previous = latestValues(workouts, exercise.name);
    card.querySelector('.previous').textContent = previous ? `Last logged: ${previous.weight} kg × ${previous.reps}` : 'No previous log yet';
    card.querySelector('.suggestion').textContent = calculateSuggestion(exerciseHistory(workouts, exercise.name));
    card.querySelector('.move-up').disabled = index === 0;
    card.querySelector('.move-down').disabled = index === draft.exercises.length - 1;
    card.querySelector('.move-up').onclick = () => { draft = moveExercise(draft, index, index - 1); renderExercises(); };
    card.querySelector('.move-down').onclick = () => { draft = moveExercise(draft, index, index + 1); renderExercises(); };
    card.querySelector('.remove').onclick = () => { draft = { ...draft, exercises: draft.exercises.filter((item) => item.id !== exercise.id) }; renderExercises(); };
    const sets = card.querySelector('.sets');
    exercise.sets.forEach((set, setIndex) => {
      const row = document.createElement('div'); row.className = 'set-row';
      const label = document.createElement('span'); label.textContent = `Set ${setIndex + 1}`;
      const weightLabel = document.createElement('label'); weightLabel.textContent = 'kg';
      const weight = document.createElement('input'); weight.inputMode = 'decimal'; weight.type = 'number'; weight.min = '0'; weight.step = '0.5'; weight.value = valueOrBlank(set.weight); weight.setAttribute('aria-label', 'Weight in kilograms'); weightLabel.append(weight);
      const repsLabel = document.createElement('label'); repsLabel.textContent = 'reps';
      const reps = document.createElement('input'); reps.inputMode = 'numeric'; reps.type = 'number'; reps.min = '1'; reps.step = '1'; reps.value = valueOrBlank(set.reps); reps.setAttribute('aria-label', 'Repetitions'); repsLabel.append(reps);
      weight.oninput = () => { set.weight = weight.value; }; reps.oninput = () => { set.reps = reps.value; };
      row.append(label, weightLabel, repsLabel);
      if (exercise.sets.length > 1) { const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-set'; remove.setAttribute('aria-label', 'Remove set'); remove.textContent = '×'; remove.onclick = () => { exercise.sets.splice(setIndex, 1); renderExercises(); }; row.append(remove); }
      sets.append(row);
    });
    card.querySelector('.add-set').onclick = () => { draft = addSet(draft, exercise.id); renderExercises(); };
    list.append(card);
  });
}
function chart() {
  const name = $('#chart-exercise').value; const points = exerciseHistory(workouts, name); const canvas = $('#progress-chart'); const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); $('#chart-empty').hidden = points.length > 0;
  if (!points.length) return;
  const pad = 32, max = Math.max(...points.map((point) => point.weight), 1), min = Math.min(...points.map((point) => point.weight), max - 1); const range = max - min || 1;
  const x = (i) => pad + i * ((canvas.width - pad * 2) / Math.max(points.length - 1, 1)); const y = (point) => canvas.height - pad - ((point.weight - min) / range) * (canvas.height - pad * 2);
  ctx.strokeStyle = '#d9e55f'; ctx.lineWidth = 3; ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(x(i), y(point)) : ctx.moveTo(x(i), y(point))); ctx.stroke();
  ctx.font = '12px system-ui'; points.forEach((point, i) => { ctx.beginPath(); ctx.fillStyle = '#d9e55f'; ctx.arc(x(i), y(point), 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#102a24'; ctx.fillText(`${point.weight} kg`, x(i) - 13, y(point) - 10); ctx.fillText(point.date, x(i) - 16, canvas.height - 10); });
}
function renderProgress() {
  const names = [...new Set(workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name)))].sort(); const select = $('#chart-exercise'); const chosen = select.value;
  select.replaceChildren(...names.map((name) => new Option(name, name, false, name === chosen)));
  chart();
}
function renderTemplates() {
  const list = $('#template-list'); list.replaceChildren();
  if (!templates.length) { list.innerHTML = '<p class="subtle">Save a template to start future workouts faster.</p>'; return; }
  templates.forEach((template) => {
    const card = document.createElement('article'); card.className = 'history-card';
    const title = document.createElement('strong'); title.textContent = template.name;
    const exercises = document.createElement('p'); exercises.textContent = template.exercises.map((exercise) => exercise.name).join(' · ') || 'No exercises yet';
    const actions = document.createElement('div'); actions.className = 'button-row';
    const start = document.createElement('button'); start.type = 'button'; start.className = 'primary'; start.textContent = 'Start workout'; start.onclick = () => { draft = startTemplate(template); draft.exercises = draft.exercises.map((exercise) => addSet({ exercises: [exercise] }, exercise.id, restoreValues(exercise.name)).exercises[0]); $('#workout-name').value = draft.name; $('#session-start').textContent = `Session started ${new Date(draft.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`; renderExercises(); showView('workout'); };
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'secondary'; edit.textContent = 'Edit'; edit.onclick = () => editTemplate(template);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'secondary'; remove.textContent = 'Delete'; remove.onclick = async () => { await deleteTemplate(template.id); templates = await loadTemplates(); renderTemplates(); };
    actions.append(start, edit, remove); card.append(title, exercises, actions); list.append(card);
  });
}
function editTemplate(template) { $('#template-id').value = template.id; $('#template-name').value = template.name; $('#template-exercises').value = template.exercises.map((exercise) => exercise.name).join('\n'); $('#cancel-template').hidden = false; $('#template-name').focus(); }
function clearTemplateForm() { $('#template-form').reset(); $('#template-id').value = ''; $('#cancel-template').hidden = true; }
function renderOverview() {
  const list = $('#overview-list'); list.replaceChildren(); $('#session-detail').hidden = true;
  const sessions = completedSessions(workouts);
  if (!sessions.length) { list.innerHTML = '<p class="subtle">No completed workouts yet.</p>'; return; }
  sessions.forEach((session) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'history-card session-button';
    const title = document.createElement('strong'); title.textContent = session.name; const when = document.createElement('span'); when.textContent = `${formatWhen(session)} · ${formatDuration(session.durationSeconds)}`;
    button.append(title, when); button.onclick = () => showSessionDetail(session); list.append(button);
  });
}
function showSessionDetail(session) {
  const detail = $('#session-detail'); detail.replaceChildren(); detail.hidden = false;
  const title = document.createElement('h3'); title.textContent = session.name; const meta = document.createElement('p'); meta.className = 'subtle'; meta.textContent = `${formatWhen(session)} · ${formatDuration(session.durationSeconds)}`; detail.append(title, meta);
  session.exercises.forEach((exercise) => { const exerciseTitle = document.createElement('strong'); exerciseTitle.textContent = exercise.name; const sets = document.createElement('p'); sets.textContent = exercise.sets.map((set, index) => `Set ${index + 1}: ${set.weight} kg × ${set.reps}`).join(' · ') || 'No saved sets'; detail.append(exerciseTitle, sets); });
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function showView(view) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  ['workout', 'templates', 'overview', 'progress'].forEach((name) => { $(`#${name}-view`).hidden = name !== view; });
  if (view === 'templates') renderTemplates(); if (view === 'overview') renderOverview(); if (view === 'progress') renderProgress();
}

$('#add-exercise-btn').onclick = addNamedExercise;
$('#exercise-name').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addNamedExercise(); } });
$('#workout-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (!draft.exercises.length) return $('#save-note').textContent = 'Add at least one exercise before completing.';
  draft.name = $('#workout-name').value.trim() || 'Workout';
  draft.exercises.forEach((exercise) => { exercise.sets = exercise.sets.filter((set) => Number(set.weight) >= 0 && Number(set.reps) > 0).map((set) => ({ weight: Number(set.weight), reps: Number(set.reps) })); });
  draft.exercises = draft.exercises.filter((exercise) => exercise.sets.length); if (!draft.exercises.length) return $('#save-note').textContent = 'Enter weight and reps for at least one set.';
  await saveWorkout(completeWorkout(draft)); workouts = await loadWorkouts(); $('#save-note').textContent = 'Workout completed and saved on this device.'; resetDraft(); renderProgress();
});
$('#template-form').addEventListener('submit', async (event) => { event.preventDefault(); const template = createTemplate($('#template-name').value, $('#template-exercises').value.split('\n')); if (!template.exercises.length) return $('#template-note').textContent = 'Add at least one exercise.'; const id = $('#template-id').value; await saveTemplate(id ? { ...template, id } : template); templates = await loadTemplates(); clearTemplateForm(); $('#template-note').textContent = 'Template saved on this device.'; renderTemplates(); });
$('#cancel-template').onclick = clearTemplateForm;
document.querySelectorAll('.tab').forEach((tab) => tab.onclick = () => showView(tab.dataset.view));
$('#chart-exercise').onchange = chart;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
[workouts, templates] = await Promise.all([loadWorkouts(), loadTemplates()]);
resetDraft(); renderProgress(); renderTemplates();

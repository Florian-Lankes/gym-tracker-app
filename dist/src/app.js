import { createWorkout, addExercise, addSet, moveExercise, exerciseHistory, latestValues, calculateSuggestion } from './data.js';
import { loadWorkouts, saveWorkout } from './db.js';

let workouts = [];
let draft = createWorkout('');
const $ = (selector) => document.querySelector(selector);
const dateInput = $('#workout-date');
dateInput.value = new Date().toISOString().slice(0, 10);

function valueOrBlank(value) { return value === undefined || value === null ? '' : value; }
function restoreValues(name) {
  const previous = latestValues(workouts, name);
  return previous ? { weight: previous.weight, reps: previous.reps } : { weight: '', reps: '' };
}
function addNamedExercise() {
  const input = $('#exercise-name');
  const name = input.value.trim();
  if (!name) return input.focus();
  draft = addExercise(draft, name);
  const exercise = draft.exercises.at(-1);
  const previous = restoreValues(name);
  draft = addSet(draft, exercise.id, previous);
  input.value = '';
  renderExercises();
}
function renderExercises() {
  const list = $('#exercise-list');
  list.replaceChildren();
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
      row.innerHTML = `<span>Set ${setIndex + 1}</span><label>kg<input inputmode="decimal" type="number" min="0" step="0.5" value="${valueOrBlank(set.weight)}" aria-label="Weight in kilograms"></label><label>reps<input inputmode="numeric" type="number" min="1" step="1" value="${valueOrBlank(set.reps)}" aria-label="Repetitions"></label>${exercise.sets.length > 1 ? '<button type="button" class="remove-set" aria-label="Remove set">×</button>' : ''}`;
      const [weight, reps] = row.querySelectorAll('input');
      weight.oninput = () => { set.weight = weight.value; };
      reps.oninput = () => { set.reps = reps.value; };
      row.querySelector('.remove-set')?.addEventListener('click', () => { exercise.sets.splice(setIndex, 1); renderExercises(); });
      sets.append(row);
    });
    card.querySelector('.add-set').onclick = () => { draft = addSet(draft, exercise.id); renderExercises(); };
    list.append(card);
  });
}
function chart() {
  const name = $('#chart-exercise').value;
  const points = exerciseHistory(workouts, name);
  const canvas = $('#progress-chart'); const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  $('#chart-empty').hidden = points.length > 0;
  if (!points.length) return;
  const pad = 32, max = Math.max(...points.map((point) => point.weight), 1), min = Math.min(...points.map((point) => point.weight), max - 1);
  const range = max - min || 1; const x = (i) => pad + i * ((canvas.width - pad * 2) / Math.max(points.length - 1, 1)); const y = (point) => canvas.height - pad - ((point.weight - min) / range) * (canvas.height - pad * 2);
  ctx.strokeStyle = '#d9e55f'; ctx.lineWidth = 3; ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(x(i), y(point)) : ctx.moveTo(x(i), y(point))); ctx.stroke();
  ctx.fillStyle = '#102a24'; ctx.font = '12px system-ui'; points.forEach((point, i) => { ctx.beginPath(); ctx.fillStyle = '#d9e55f'; ctx.arc(x(i), y(point), 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#102a24'; ctx.fillText(`${point.weight} kg`, x(i) - 13, y(point) - 10); ctx.fillText(point.date, x(i) - 16, canvas.height - 10); });
}
function renderProgress() {
  const names = [...new Set(workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name)))].sort();
  const select = $('#chart-exercise'); const chosen = select.value; select.replaceChildren(...names.map((name) => new Option(name, name, false, name === chosen)));
  $('#history-list').innerHTML = workouts.map((workout) => `<article class="history-card"><strong>${workout.name}</strong><span>${new Date(workout.performedAt).toLocaleDateString()}</span><p>${workout.exercises.map((exercise) => `${exercise.name}: ${exercise.sets.map((set) => `${set.weight} kg × ${set.reps}`).join(', ')}`).join('<br>')}</p></article>`).join('') || '<p class="subtle">No saved workouts yet.</p>';
  chart();
}
$('#add-exercise-btn').onclick = addNamedExercise;
$('#exercise-name').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addNamedExercise(); } });
$('#workout-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!draft.exercises.length) return $('#save-note').textContent = 'Add at least one exercise before saving.';
  draft.name = $('#workout-name').value.trim() || 'Workout'; draft.performedAt = new Date(`${dateInput.value}T12:00:00`).toISOString();
  draft.exercises.forEach((exercise) => exercise.sets = exercise.sets.filter((set) => Number(set.weight) >= 0 && Number(set.reps) > 0).map((set) => ({ weight: Number(set.weight), reps: Number(set.reps) })));
  draft.exercises = draft.exercises.filter((exercise) => exercise.sets.length);
  if (!draft.exercises.length) return $('#save-note').textContent = 'Enter weight and reps for at least one set.';
  await saveWorkout(draft); workouts = await loadWorkouts(); $('#save-note').textContent = 'Workout saved on this device.';
  draft = createWorkout(''); $('#workout-name').value = ''; renderExercises(); renderProgress();
});
document.querySelectorAll('.tab').forEach((tab) => tab.onclick = () => { document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab)); $('#workout-view').hidden = tab.dataset.view !== 'workout'; $('#progress-view').hidden = tab.dataset.view !== 'progress'; if (tab.dataset.view === 'progress') renderProgress(); });
$('#chart-exercise').onchange = chart;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
workouts = await loadWorkouts(); renderExercises(); renderProgress();

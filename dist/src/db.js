const DB_NAME = 'lift-log';
const WORKOUT_STORE = 'workouts';
const TEMPLATE_STORE = 'templates';
const ACTIVE_STORE = 'active-session';
const ACTIVE_ID = 'current';

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORKOUT_STORE)) db.createObjectStore(WORKOUT_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(TEMPLATE_STORE)) db.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(ACTIVE_STORE)) db.createObjectStore(ACTIVE_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function readAll(store) { return database().then((db) => new Promise((resolve, reject) => { const request = db.transaction(store).objectStore(store).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); })); }
function get(store, id) { return database().then((db) => new Promise((resolve, reject) => { const request = db.transaction(store).objectStore(store).get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); })); }
function put(store, value) { return database().then((db) => new Promise((resolve, reject) => { const request = db.transaction(store, 'readwrite').objectStore(store).put(value); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); })); }
function remove(store, id) { return database().then((db) => new Promise((resolve, reject) => { const request = db.transaction(store, 'readwrite').objectStore(store).delete(id); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); })); }
export async function loadWorkouts() { return (await readAll(WORKOUT_STORE)).sort((a, b) => new Date(b.completedAt || b.performedAt) - new Date(a.completedAt || a.performedAt)); }
export function saveWorkout(workout) { return put(WORKOUT_STORE, workout); }
export function deleteWorkout(id) { return remove(WORKOUT_STORE, id); }
export function loadTemplates() { return readAll(TEMPLATE_STORE); }
export function saveTemplate(template) { return put(TEMPLATE_STORE, template); }
export function deleteTemplate(id) { return remove(TEMPLATE_STORE, id); }
export async function loadActiveSession() { const record = await get(ACTIVE_STORE, ACTIVE_ID); return record?.session || null; }
export function saveActiveSession(session) { return put(ACTIVE_STORE, { id: ACTIVE_ID, session }); }
export function clearActiveSession() { return remove(ACTIVE_STORE, ACTIVE_ID); }

const DB_NAME = 'lift-log';
const STORE = 'workouts';

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadWorkouts() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function saveWorkout(workout) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(workout);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

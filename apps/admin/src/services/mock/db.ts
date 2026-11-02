import { createSeed, DB_VERSION, type Database } from './seed';

/**
 * In-memory "database" persisted to localStorage so the draft keeps state
 * across reloads. Nothing here ever leaves the browser.
 */

const STORAGE_KEY = 'octap.admin.mockdb';

function load(): Database | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Database;
    return parsed.version === DB_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

let db: Database | undefined;

function requireDemoMode() {
  if (import.meta.env.VITE_ENABLE_DEMO_AUTH !== 'true')
    throw new Error('Demo data is disabled outside demo mode');
}

export function getDb(): Database {
  requireDemoMode();
  if (!db) {
    db = load() ?? createSeed();
    commit();
  }
  return db;
}

export function commit() {
  if (import.meta.env.VITE_ENABLE_DEMO_AUTH !== 'true' || !db) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or unavailable: keep working in memory.
  }
}

export function resetDb() {
  requireDemoMode();
  db = createSeed();
  commit();
}

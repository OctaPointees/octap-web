import { createSeed, DB_VERSION, type Database } from './seed';

/**
 * In-memory "database" persisted to localStorage so the draft keeps state
 * across reloads. Nothing here ever leaves the browser.
 */

const STORAGE_KEY = 'octap.mockdb';

function load(): Database | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Database;
    if (parsed.version !== DB_VERSION) return null;
    if (!parsed.staff.some((account) => account.email === 'developer@lotusmart.vn')) {
      const tenant = parsed.tenants.find((item) => item.slug === 'lotus-mart');
      if (tenant) {
        parsed.staff.push({
          id: 'usr_lotus_developer',
          email: 'developer@lotusmart.vn',
          password: 'octap123',
          displayName: 'Lotus Developer',
          avatarUrl: 'https://picsum.photos/id/12/200/200',
          role: 'merchant',
          tenantId: tenant.id,
          merchantRole: 'developer',
          status: 'active',
          createdAt: tenant.createdAt,
        });
      }
    }
    return parsed;
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

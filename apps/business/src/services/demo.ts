export type DemoKey = { id: string; name: string; scopes: string[]; status: 'active' | 'revoked' };
export type DemoHook = { id: string; url: string; enabled: boolean };
export type DemoState = { keys: DemoKey[]; hooks: DemoHook[] };
const KEY = 'octap.business.demo';
const seed: DemoState = {
  keys: [{ id: 'staging', name: 'Staging key', scopes: ['read', 'write'], status: 'active' }],
  hooks: [{ id: 'demo-hook', url: 'https://example.com/octap', enabled: true }],
};
function read(): DemoState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && Array.isArray(raw.keys) && Array.isArray(raw.hooks)) return raw;
  } catch {
    /* Recover from unavailable or invalid storage. */
  }
  return structuredClone(seed);
}
let current = read();
const listeners = new Set<() => void>();
export const demoStore = {
  get: () => current,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  update(next: DemoState) {
    // Persist before publishing so storage failures never claim a successful write.
    localStorage.setItem(KEY, JSON.stringify(next));
    current = next;
    listeners.forEach((fn) => fn());
  },
};
export function createKey(name: string, scopes: string[]) {
  if (!name.trim() || !scopes.length)
    throw new Error('Enter a key name and select at least one scope.');
  const id = crypto.randomUUID();
  demoStore.update({
    ...current,
    keys: [...current.keys, { id, name: name.trim(), scopes, status: 'active' }],
  });
  return `demo_only_${id}`;
}
export function revokeKey(id: string) {
  demoStore.update({
    ...current,
    keys: current.keys.map((key) => (key.id === id ? { ...key, status: 'revoked' } : key)),
  });
}
export function rotateKey(id: string) {
  const key = current.keys.find((key) => key.id === id && key.status === 'active');
  if (!key) throw new Error('Only active keys can be rotated.');
  const replacement = crypto.randomUUID();
  demoStore.update({
    ...current,
    keys: current.keys.map((row) => (row.id === id ? { ...row, id: replacement } : row)),
  });
  return `demo_only_${replacement}`;
}
export function registerHook(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Use an HTTPS endpoint.');
  demoStore.update({
    ...current,
    hooks: [...current.hooks, { id: crypto.randomUUID(), url: parsed.href, enabled: true }],
  });
}
export function toggleHook(id: string) {
  demoStore.update({
    ...current,
    hooks: current.hooks.map((hook) =>
      hook.id === id ? { ...hook, enabled: !hook.enabled } : hook,
    ),
  });
}

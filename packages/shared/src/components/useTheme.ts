import { useSyncExternalStore } from 'react';

export type Theme = 'octap-light' | 'octap-dark';

/** Where the choice is kept. Each app's index.html reads the same key before React loads. */
const STORAGE_KEY = 'octap.theme';
const listeners = new Set<() => void>();

const current = (): Theme =>
  document.documentElement.dataset.theme === 'octap-dark' ? 'octap-dark' : 'octap-light';

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the theme.
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEY &&
      (event.newValue === 'octap-light' || event.newValue === 'octap-dark')
    )
      apply(event.newValue);
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * The page's light or dark theme, and a way to switch it. The choice is saved for next time and
 * shared by open tabs. Light until the user picks dark.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current);
  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the theme still changes, it just isn't remembered.
    }
    apply(next);
  };
  return {
    theme,
    dark: theme === 'octap-dark',
    setTheme,
    toggle: () => setTheme(theme === 'octap-dark' ? 'octap-light' : 'octap-dark'),
  };
}

import { useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Code, Storefront, type Icon } from 'phosphor-react';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { organizationPath, type OrganizationPage } from '@/app/organization/utils';

/**
 * Which menu the sidebar shows. A view preference only: it hides pages a person rarely needs and
 * grants nothing. What a person may do on a page is still decided by their role.
 */
export type Focus = 'business' | 'developer';

export const FOCUSES: Record<Focus, { label: string; description: string; icon: Icon }> = {
  business: {
    label: 'Business',
    description: 'Rewards, members, team and settings',
    icon: Storefront,
  },
  developer: {
    label: 'Developer',
    description: 'API keys, members, rewards and settings',
    icon: Code,
  },
};

/** The pages each focus lists, in sidebar order. An empty string is the dashboard. */
export const FOCUS_PAGES: Record<Focus, Array<OrganizationPage | ''>> = {
  business: ['', 'rewards', 'members', 'team', 'settings'],
  developer: ['', 'api-keys', 'members', 'rewards', 'settings'],
};

// The choice is kept per browser. Storage can be unavailable (private mode, blocked site data),
// so it is also kept in memory for the session.
const storageKey = 'octap.business.focus';
const listeners = new Set<() => void>();
let remembered: Focus | null = null;

const isFocus = (value: unknown): value is Focus => value === 'business' || value === 'developer';

function read(): Focus | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (isFocus(stored)) return stored;
  } catch {
    /* Fall back to the in-memory choice. */
  }
  return remembered;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing the focus.
  const onStorage = (event: StorageEvent) => event.key === storageKey && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Switches the sidebar to another focus and remembers it. */
export function setFocus(focus: Focus) {
  remembered = focus;
  try {
    localStorage.setItem(storageKey, focus);
  } catch {
    /* Kept in memory instead. */
  }
  listeners.forEach((listener) => listener());
}

/** The focus the user picked, or the one that suits their role: Business for Owners. */
export function useFocus(): Focus {
  const { owner } = useOrganization();
  const picked = useSyncExternalStore(subscribe, read, () => null);
  return picked ?? (owner ? 'business' : 'developer');
}

/**
 * Switches the focus from a control and opens that focus's dashboard. The dashboard route follows
 * the focus, so someone already on it stays put and adds no history entry.
 */
export function useSwitchFocus() {
  const { slug } = useOrganization();
  const focus = useFocus();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (next: Focus) => {
    if (next === focus) return;
    setFocus(next);
    if (pathname.split('/')[3]) navigate(organizationPath(slug));
  };
}

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export type DemoRole = 'owner' | 'manager' | 'cashier' | 'admin';

export const DEMO_ACCOUNTS: Record<
  DemoRole,
  {
    email: string;
    label: string;
    org: string;
    hint: string;
    dest: string;
    icon: string;
    bg: string;
    fg: string;
  }
> = {
  owner: {
    email: 'owner@lotusmart.vn',
    label: 'Owner',
    org: 'Lotus Mart',
    hint: 'Full access',
    dest: 'Partner Dashboard',
    icon: 'ri-store-2-line',
    bg: '#FFE3F1',
    fg: '#B4106A',
  },
  manager: {
    email: 'manager@phocaphe.vn',
    label: 'Manager',
    org: 'Phố Cà Phê',
    hint: 'Operations & campaigns',
    dest: 'Partner Dashboard',
    icon: 'ri-briefcase-4-line',
    bg: '#E6F6EE',
    fg: '#1B7A4B',
  },
  cashier: {
    email: 'cashier@lotusmart.vn',
    label: 'Cashier',
    org: 'Lotus Mart',
    hint: 'Issue points only',
    dest: 'Issue points',
    icon: 'ri-qr-scan-2-line',
    bg: '#FFF1D6',
    fg: '#8A5A00',
  },
  admin: {
    email: 'admin@octap.vn',
    label: 'Platform admin',
    org: 'OctaP ops',
    hint: 'Admin Dashboard',
    dest: 'Admin Dashboard',
    icon: 'ri-shield-user-line',
    bg: '#E8E4FB',
    fg: '#4B3BA8',
  },
};

const DEMO_PASSWORD = 'octap123';
const KEY = 'octap.role';

export function authenticate(email: string, password: string): DemoRole | null {
  if (!DEMO_MODE || password !== DEMO_PASSWORD) return null;
  const e = email.trim().toLowerCase();
  const hit = (Object.keys(DEMO_ACCOUNTS) as DemoRole[]).find((r) => DEMO_ACCOUNTS[r].email === e);
  return hit ?? null;
}

export function setSession(role: DemoRole) {
  if (DEMO_MODE) sessionStorage.setItem(KEY, role);
}
export function getSession(): DemoRole | null {
  if (!DEMO_MODE) return null;
  const role = sessionStorage.getItem(KEY);
  return role && Object.hasOwn(DEMO_ACCOUNTS, role) ? (role as DemoRole) : null;
}
export function clearSession() {
  sessionStorage.removeItem(KEY);
}

// Cashier's landing page (Issue points) isn't part of this prototype, so it falls back to the dashboard.
export function routeForRole(role: DemoRole): string {
  return role === 'admin' ? '/admin' : '/dashboard';
}

export function canAccess(role: DemoRole, area: 'business' | 'developer' | 'admin') {
  if (area === 'admin') return role === 'admin';
  if (area === 'developer') return role === 'owner' || role === 'manager';
  return role !== 'admin';
}

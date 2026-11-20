import type { ConsoleIdentity } from '@octap/shared/authentication';
import { ShieldStar } from 'phosphor-react';
import type { NavOption } from './SidePanel';

export const ADMIN_PORTAL_URL =
  import.meta.env.VITE_ADMIN_PORTAL_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/admin' : '/admin');

/** The admin portal link, for System Admins only. It opens another app, so it is `external`. */
export function platformAdminLinks(identity?: ConsoleIdentity): NavOption[] {
  return identity?.user.systemRole === 'SYSTEM_ADMIN'
    ? [
        {
          label: 'Platform administration',
          path: ADMIN_PORTAL_URL,
          icon: ShieldStar,
          external: true,
        },
      ]
    : [];
}

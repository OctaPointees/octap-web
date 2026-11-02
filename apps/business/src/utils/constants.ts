import type { Range, SessionUser } from '../types/domain';

export const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

export const homeFor = (user: Pick<SessionUser, 'role' | 'merchantRole'>) =>
  user.role === 'admin' ? '/admin' : '/merchant';

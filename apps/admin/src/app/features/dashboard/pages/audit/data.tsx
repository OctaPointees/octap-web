export type AuditEvent = {
  timestamp: string;
  actor: string | null;
  action: string;
  target: string;
  ipAddress: string;
  result: 'Success' | 'Denied';
};

export const EVENTS: AuditEvent[] = [
  {
    timestamp: '2026-10-11T08:42:00Z',
    actor: 'maya.chen@octap.com',
    action: 'Partner updated',
    target: 'Northstar Market',
    ipAddress: '203.0.113.18',
    result: 'Success',
  },
  {
    timestamp: '2026-10-11T08:16:00Z',
    actor: 'james.wilson@octap.com',
    action: 'Voucher created',
    target: 'WELCOME-OCT',
    ipAddress: '203.0.113.42',
    result: 'Success',
  },
  {
    timestamp: '2026-10-11T07:55:00Z',
    actor: null,
    action: 'Sign-in attempt',
    target: 'Admin console',
    ipAddress: '198.51.100.73',
    result: 'Denied',
  },
  {
    timestamp: '2026-10-10T16:31:00Z',
    actor: 'maya.chen@octap.com',
    action: 'Role changed',
    target: 'liam.patel@octap.com',
    ipAddress: '203.0.113.18',
    result: 'Success',
  },
  {
    timestamp: '2026-10-10T15:08:00Z',
    actor: 'olivia.park@octap.com',
    action: 'Partner disabled',
    target: 'Harbor Goods',
    ipAddress: '203.0.113.91',
    result: 'Success',
  },
  {
    timestamp: '2026-10-10T12:47:00Z',
    actor: 'james.wilson@octap.com',
    action: 'Report exported',
    target: 'Monthly redemptions',
    ipAddress: '203.0.113.42',
    result: 'Success',
  },
  {
    timestamp: '2026-10-09T19:22:00Z',
    actor: null,
    action: 'Sign-in attempt',
    target: 'Admin console',
    ipAddress: '198.51.100.73',
    result: 'Denied',
  },
  {
    timestamp: '2026-10-09T11:04:00Z',
    actor: 'liam.patel@octap.com',
    action: 'Setting updated',
    target: 'Session timeout',
    ipAddress: '203.0.113.67',
    result: 'Success',
  },
  {
    timestamp: '2026-10-09T09:38:00Z',
    actor: 'maya.chen@octap.com',
    action: 'API key rotated',
    target: 'Payments integration',
    ipAddress: '203.0.113.18',
    result: 'Success',
  },
  {
    timestamp: '2026-10-08T22:14:00Z',
    actor: null,
    action: 'Sign-in attempt',
    target: 'Admin console',
    ipAddress: '198.51.100.118',
    result: 'Denied',
  },
  {
    timestamp: '2026-10-08T14:06:00Z',
    actor: 'olivia.park@octap.com',
    action: 'Member invited',
    target: 'nina.ross@octap.com',
    ipAddress: '203.0.113.91',
    result: 'Success',
  },
];

export const AUDIT_SUMMARY = {
  totalEvents: '1,305',
  successRate: '97.7%',
  successfulActions: '1,275',
  deniedRequests: '30',
  uniqueActors: '36',
};

import type { Stage } from './benefit';

/** How each stage of a reward reads on its badge, on the Rewards page and in a batch. */
export const STAGES: Record<Stage, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'badge-ghost' },
  pending: { label: 'Pending approval', tone: 'badge-secondary' },
  publishing: { label: 'Publishing…', tone: 'badge-info' },
  failed: { label: 'Publish failed', tone: 'badge-error' },
  scheduled: { label: 'Scheduled', tone: 'badge-info' },
  live: { label: 'Live', tone: 'badge-success' },
  claims_closed: { label: 'Claims closed', tone: 'badge-neutral' },
  paused: { label: 'Paused', tone: 'badge-warning' },
  sold_out: { label: 'Sold out', tone: 'badge-neutral' },
  archived: { label: 'Archived', tone: 'badge-neutral' },
};

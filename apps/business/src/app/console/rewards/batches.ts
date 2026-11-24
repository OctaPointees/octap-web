import type {
  ConsoleVoucher,
  VoucherBatch,
  VoucherBatchItemResult,
  VoucherBatchOutcome,
  VoucherFieldDifference,
} from '@octap/services';
import { fmtNumber } from '@/utils/format';
import { columnOf } from './csv';
import { stageOf } from './benefit';

/**
 * How a row of an import reads in the Review step (OCT-304), in the merchant's words:
 * - `attention`: not written: wrong in the file, refused by Core, or different from a saved reward.
 * - `revived`: an archived draft this import brings back (replaced, or unchanged but moved).
 * - `fresh`: a new draft.
 * - `saved`: already saved with the same values; nothing to do.
 */
export type ReviewGroup = 'attention' | 'revived' | 'fresh' | 'saved';

export function reviewGroupOf(result: VoucherBatchItemResult): ReviewGroup {
  switch (result.status) {
    case 'error':
    case 'conflict':
      return 'attention';
    case 'replaced':
      return 'revived';
    case 'unchanged':
      return result.movedToBatch ? 'revived' : 'saved';
    case 'created':
      return 'fresh';
  }
}

/** Core's field names, as the CSV columns a merchant edits. */
const CORE_TO_DRAFT: Record<string, string> = {
  pointsCost: 'pointsCost',
  discountValue: 'value',
  totalSupply: 'totalSupply',
  perMemberLimit: 'perMemberLimit',
  validForDays: 'validForDays',
  startsAt: 'startsOn',
  expiresAt: 'closesOn',
};
export const columnOfCoreField = (field: string | null) =>
  field ? columnOf(CORE_TO_DRAFT[field] ?? field) : null;

/** Field labels for a difference between the saved reward and the file. */
const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  pointsCost: 'Points',
  discountType: 'Type',
  discountValue: 'Value',
  terms: 'Offer details',
  totalSupply: 'Number available',
  perMemberLimit: 'Per-member limit',
  startsAt: 'Claims open',
  expiresAt: 'Claims close',
  validForDays: 'Valid for (days)',
  metadata: 'Metadata',
};

function shown(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if ((field === 'startsAt' || field === 'expiresAt') && typeof value === 'string')
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  if (typeof value === 'number') return fmtNumber(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function describeDifference(difference: VoucherFieldDifference) {
  return {
    label: FIELD_LABELS[difference.field] ?? difference.field,
    saved: shown(difference.field, difference.stored),
    file: shown(difference.field, difference.sent),
  };
}

/**
 * Whether a saved reward was changed after the import that brought it in, so a file built before
 * that change is older than what is saved. The import itself writes the reward, a moment after the
 * batch row, hence the margin.
 */
export function editedAfterImport(
  voucher: Pick<ConsoleVoucher, 'updatedAt' | 'batchId'> | undefined,
  batches: Pick<VoucherBatch, 'id' | 'createdAt'>[] | undefined,
  marginMs = 5000,
): boolean {
  if (!voucher?.batchId) return false;
  const batch = batches?.find((b) => b.id === voucher.batchId);
  return Boolean(batch && Date.parse(voucher.updatedAt) > Date.parse(batch.createdAt) + marginMs);
}

/** A batch's name, or when it was made when it has none. */
export function batchTitle(batch: Pick<VoucherBatch, 'name' | 'createdAt'>): string {
  return batch.name ?? `Import of ${formatWhen(batch.createdAt)}`;
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Counts by what a merchant cares about: live, waiting for an Owner, still a draft, archived. */
export function batchProgress(batch: Pick<VoucherBatch, 'statusCounts'>) {
  const c = batch.statusCounts;
  const live = (c.ACTIVE ?? 0) + (c.PAUSED ?? 0) + (c.DEPLETED ?? 0) + (c.EXPIRED ?? 0);
  const waiting = c.PENDING_APPROVAL ?? 0;
  const draft = c.DRAFT ?? 0;
  const archived = c.ARCHIVED ?? 0;
  return { live, waiting, draft, archived, total: live + waiting + draft + archived };
}

export function describeProgress(progress: ReturnType<typeof batchProgress>): string {
  const parts = [
    progress.live && `${fmtNumber(progress.live)} live`,
    progress.waiting && `${fmtNumber(progress.waiting)} waiting`,
    progress.draft && `${fmtNumber(progress.draft)} draft`,
    progress.archived && `${fmtNumber(progress.archived)} archived`,
  ].filter(Boolean);
  return parts.join(' · ') || 'Empty';
}

/**
 * What the batch's buttons would touch, from its rewards as they are now, as Core counts them.
 * Drafts and failed publishes (including one paused while it was publishing) are activated; an
 * Owner's activation also approves what waits. Pause takes live rewards and drafts still
 * publishing; resume takes paused ones already on-chain.
 */
export function batchActions(vouchers: ConsoleVoucher[]) {
  let drafts = 0;
  let waiting = 0;
  let pausable = 0;
  let resumable = 0;
  let live = 0;
  for (const voucher of vouchers) {
    const stage = stageOf(voucher);
    if (stage === 'draft' || stage === 'failed') drafts += 1;
    if (stage === 'pending') waiting += 1;
    // Core pauses live rewards and drafts still publishing; one already paused is not counted again.
    if (
      voucher.status === 'ACTIVE' ||
      (voucher.status === 'DRAFT' && voucher.publishStatus === 'PUBLISHING')
    )
      pausable += 1;
    if (voucher.status === 'PAUSED' && voucher.publishStatus === 'PUBLISHED') resumable += 1;
    // A paused reward whose publish failed never went live.
    if (
      ['ACTIVE', 'PAUSED', 'DEPLETED', 'EXPIRED'].includes(voucher.status) &&
      voucher.publishStatus !== 'FAILED'
    )
      live += 1;
  }
  return { drafts, waiting, pausable, resumable, live };
}

/** What happened to one reward after a batch action, as the row under it says. */
export function describeOutcome(outcome: VoucherBatchOutcome, reason: string | null): string {
  switch (outcome) {
    case 'publishing':
      return 'Publishing on-chain…';
    case 'pendingApproval':
      return 'Sent for approval';
    case 'paused':
      return 'Paused';
    case 'resumed':
      return 'Resumed';
    case 'archived':
      return 'Archived';
    case 'skipped':
      return 'Nothing to do';
    case 'failed':
      return `Not done: ${reason ?? 'Core refused it'}`;
  }
}

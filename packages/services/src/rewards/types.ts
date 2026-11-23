/** The latest request to take a reward live, when the organization requires approval (OCT-59). */
export interface VoucherApproval {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  /** A console user (Business Developer) or an API key; `null` once that user or key is deleted. */
  submittedBy: { type: 'USER' | 'API_CREDENTIAL'; id: string } | null;
  submittedAt: string;
  /** The Owner who approved or rejected it, or whoever withdrew it. */
  reviewedById: string | null;
  reviewedAt: string | null;
  /** Why an Owner rejected it. */
  reason: string | null;
}

/**
 * `ARCHIVED`: a draft (or one waiting for approval) of an archived import batch (OCT-303). It never
 * went live and can't be edited, submitted or claimed; importing its code again makes it a DRAFT.
 */
export type VoucherStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'DEPLETED' | 'EXPIRED' | 'ARCHIVED';

/** A reward as Core's console voucher routes return it (OCT-236, OCT-291, OCT-59). */
export interface ConsoleVoucher {
  id: string;
  organizationId: string;
  code: string;
  title: string;
  description: string | null;
  pointsCost: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM' | null;
  discountValue: string | null;
  terms: Record<string, unknown> | null;
  /** `PUBLISHING` until the worker freezes the terms on-chain; `FAILED` can be activated again. */
  publishStatus: 'NOT_PUBLISHED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  suiTermsId: string | null;
  totalSupply: number | null;
  /**
   * How many of this reward one member may hold: used and expired ones count, cancelled ones
   * don't. `null` is no limit. Stays editable after publishing, like supply.
   */
  perMemberLimit: number | null;
  claimedCount: number;
  /**
   * `PENDING_APPROVAL`: waiting for an Owner, when the organization requires approval. It can't be
   * edited meanwhile; approved, it starts publishing; rejected or withdrawn, it is a DRAFT again.
   */
  status: VoucherStatus;
  /** When claims open. */
  startsAt: string | null;
  /** When claims close; also the latest any member's voucher can be used. */
  expiresAt: string | null;
  /**
   * Each member's voucher stays usable this many days from when it is issued, capped by
   * `expiresAt`. `null`: every voucher expires at `expiresAt`. Frozen once publishing starts.
   */
  validForDays: number | null;
  metadata: Record<string, unknown> | null;
  /** The latest approval request, `null` if there never was one. */
  approval?: VoucherApproval | null;
  /** The import batch it was created or last imported in (OCT-303), `null` if created on its own. */
  batchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The longest `validForDays` Core and the contract accept. */
export const MAX_VALID_FOR_DAYS = 3650;

/** A console create is always a DRAFT; `pointsCost` is required (0 for a free reward). */
export interface ConsoleVoucherInput {
  code: string;
  title: string;
  description?: string;
  pointsCost: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM';
  discountValue?: string;
  terms?: Record<string, unknown>;
  totalSupply?: number | null;
  perMemberLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  validForDays?: number | null;
}

/**
 * Fields to change, or `{ status }` to activate (`ACTIVE`) or pause (`PAUSED`). Only an Owner
 * pauses or changes a published reward. A Business Developer's `ACTIVE` is refused (403) while the
 * organization requires approval: they submit the draft instead.
 */
export type ConsoleVoucherPatch = Partial<Omit<ConsoleVoucherInput, 'discountValue'>> & {
  /** `null` clears it, e.g. when a draft changes from percent off to a free item. */
  discountValue?: string | null;
  status?: 'ACTIVE' | 'PAUSED';
};

/** The most rows one import batch takes; Core refuses more for the whole request. */
export const MAX_BATCH_ITEMS = 100;
/** The longest batch name Core keeps, after trimming. */
export const MAX_BATCH_NAME_LENGTH = 120;

/** One row of an import: a console create, without `status` (a batch is always DRAFT). */
export type VoucherBatchItem = ConsoleVoucherInput;

/** One field where the saved reward and the imported row differ, after Core normalized both. */
export interface VoucherFieldDifference {
  field: string;
  stored: unknown;
  sent: unknown;
}

/**
 * What Core did, or would do on a dry run, with one row, matched by its `index` in `items`:
 * `created` a new draft; `unchanged` the same values are already saved (`movedToBatch` when it was an
 * archived draft brought back into this batch); `conflict` other values are saved and are kept;
 * `replaced` an archived draft now holds the row's values; `error` the row was refused.
 */
export type VoucherBatchItemResult =
  | { index: number; code: string; status: 'created'; voucherId: string | null }
  | { index: number; code: string; status: 'unchanged'; voucherId: string; movedToBatch: boolean }
  | {
      index: number;
      code: string;
      status: 'conflict';
      voucherId: string;
      differences: VoucherFieldDifference[];
    }
  | {
      index: number;
      code: string;
      status: 'replaced';
      voucherId: string | null;
      differences: VoucherFieldDifference[];
    }
  | {
      index: number;
      code: string | null;
      status: 'error';
      error: { code: 'INVALID' | 'DUPLICATE_IN_BATCH'; field: string | null; message: string };
    };

export type VoucherBatchStatusCounts = Partial<Record<VoucherStatus, number>>;

/** An import batch (OCT-303): rewards created together as drafts, then activated together. */
export interface VoucherBatch {
  id: string;
  organizationId: string;
  /** The CSV file's name from the console, or a name an API client chose; `null` without one. */
  name: string | null;
  source: 'CONSOLE' | 'API';
  /** A console user or an API key; `null` once that user or key is deleted. */
  createdBy: { type: 'USER' | 'API_CREDENTIAL'; id: string } | null;
  createdAt: string;
  /** Set once archived: hidden from the default list, and it can no longer be activated. */
  archivedAt: string | null;
  statusCounts: VoucherBatchStatusCounts;
}

export interface VoucherBatchDetail extends VoucherBatch {
  vouchers: ConsoleVoucher[];
}

export interface CreateVoucherBatchResponse {
  dryRun: boolean;
  /** `null` on a dry run, and when no row landed in a batch. */
  batch: VoucherBatch | null;
  items: VoucherBatchItemResult[];
}

/**
 * What a batch action did to one reward. `skipped`: nothing to do for it (`status` says where it is);
 * `failed`: `reason` says why. An Owner's activation also approves what waits for approval.
 */
export type VoucherBatchOutcome =
  'publishing' | 'pendingApproval' | 'paused' | 'resumed' | 'archived' | 'skipped' | 'failed';

export interface VoucherBatchActionResult {
  voucherId: string;
  code: string;
  outcome: VoucherBatchOutcome;
  status: VoucherStatus;
  reason: string | null;
}

export interface VoucherBatchActionResponse {
  batch: VoucherBatch;
  vouchers: VoucherBatchActionResult[];
}

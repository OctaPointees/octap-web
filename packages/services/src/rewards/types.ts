/** A reward as Core's console voucher routes return it (OCT-236, OCT-291). */
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
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DEPLETED';
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

/** Fields to change, or `{ status }` to activate (`ACTIVE`) or pause (`PAUSED`). */
export type ConsoleVoucherPatch = Partial<Omit<ConsoleVoucherInput, 'discountValue'>> & {
  /** `null` clears it, e.g. when a draft changes from percent off to a free item. */
  discountValue?: string | null;
  status?: 'ACTIVE' | 'PAUSED';
};

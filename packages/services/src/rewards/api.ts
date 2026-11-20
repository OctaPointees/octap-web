import type { ConsoleRewardsUpdateInput, OctapClient } from '@octap/internal-sdk';
import { unwrap } from '@octap/shared/authentication';
import type { ConsoleVoucher, ConsoleVoucherInput, ConsoleVoucherPatch } from './types';

/**
 * The organization's reward catalog through Core's console voucher routes (OCT-236), on the
 * `@octap/internal-sdk` client from `useAuth().api`. Each call returns the data or throws an
 * `OctapError`.
 */
export function createRewardsApi(api: OctapClient) {
  return {
    list: async (organizationId: string) =>
      (await unwrap(api.console.listRewards({ organizationId }))) as ConsoleVoucher[],
    get: async (organizationId: string, voucherId: string) =>
      (await unwrap(
        api.console.detailRewards({ organizationId, id: voucherId }),
      )) as ConsoleVoucher,
    create: async (organizationId: string, input: ConsoleVoucherInput) =>
      (await unwrap(api.console.createRewards({ organizationId, body: input }))) as ConsoleVoucher,
    update: async (organizationId: string, voucherId: string, patch: ConsoleVoucherPatch) =>
      (await unwrap(
        // The spec types discountValue as a string only, but the web clears it with `null` when a
        // draft becomes a free item, so the patch is passed through as written.
        api.console.updateRewards({
          organizationId,
          id: voucherId,
          body: patch as ConsoleRewardsUpdateInput,
        }),
      )) as ConsoleVoucher,
  };
}

export type RewardsApi = ReturnType<typeof createRewardsApi>;

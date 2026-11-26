import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ConsoleVoucherBatchesCreateInput,
  ConsoleVoucherBatchesCreateResponse,
  VoucherSeen,
} from '@octap/internal-sdk';
import { unwrap, useAuth } from '@octap/shared/authentication';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import type { BatchItemResult } from '../domain/batches';
import { rewardKeys } from './useRewards';

/** How often a batch is read again while some of its vouchers publish on-chain. */
const PUBLISH_POLL_MS = 3000;

export const batchKeys = {
  all: (organizationId: string) =>
    ['console', 'organization', organizationId, 'voucher-batches'] as const,
  list: (organizationId: string, includeArchived: boolean) =>
    [...batchKeys.all(organizationId), 'list', includeArchived] as const,
  detail: (organizationId: string, batchId: string) =>
    [...batchKeys.all(organizationId), 'detail', batchId] as const,
};

/** Core's answer to an import, with each row's result as `BatchItemResult`. */
export type ImportResponse = Omit<ConsoleVoucherBatchesCreateResponse, 'items'> & {
  items: BatchItemResult[];
};

/** The organization's import batches, newest first; archived ones only when asked for. */
export function useBatches(includeArchived = false, enabled = true) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: batchKeys.list(organizationId, includeArchived),
    enabled,
    queryFn: () =>
      unwrap(
        api.console.listVoucherBatches({
          organizationId,
          includeArchived: includeArchived ? 'true' : 'false',
        }),
      ),
  });
}

/** One batch with its vouchers, read again every few seconds while any of them publishes. */
export function useBatch(batchId: string) {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useQuery({
    queryKey: batchKeys.detail(organizationId, batchId),
    queryFn: () => unwrap(api.console.detailVoucherBatches({ organizationId, batchId })),
    refetchInterval: (query) =>
      query.state.data?.vouchers.some((voucher) => voucher.publishStatus === 'PUBLISHING')
        ? PUBLISH_POLL_MS
        : false,
  });
}

/**
 * Sends a file's rows to Core as one batch. `dryRun` only reports what each row would do (the
 * Review step) and writes nothing; without it the rows that can be written become one DRAFT batch.
 */
export function useImportBatch() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  return useMutation({
    // A dry run changes nothing; a real import adds drafts to the catalog and a batch to the list.
    meta: { invalidates: [rewardKeys.list(organizationId), batchKeys.all(organizationId)] },
    mutationFn: async (body: ConsoleVoucherBatchesCreateInput) =>
      (await unwrap(api.console.createVoucherBatches({ organizationId, body }))) as ImportResponse,
  });
}

export type BatchAction = 'activate' | 'pause' | 'resume' | 'archive';

/**
 * Activates, pauses, resumes or archives every voucher of a batch at once. An Owner's activation
 * sends `seen`: the vouchers as they were when the Owner opened the confirm, taken with `seenOf`.
 * The page refreshes behind the dialog, so the cache at click time may hold an edit the Owner never
 * saw. Core leaves out any voucher that changed since (OCT-324). Afterwards the catalog, the batch
 * and the list are read again.
 */
export function useBatchAction(batchId: string) {
  const { api } = useAuth();
  const { organizationId, owner } = useOrganization();
  return useMutation({
    meta: { invalidates: [rewardKeys.list(organizationId), batchKeys.all(organizationId)] },
    mutationFn: ({ action, seen }: { action: BatchAction; seen?: VoucherSeen[] }) => {
      const input = { organizationId, batchId };
      if (action === 'activate')
        return unwrap(
          api.console.activate({
            ...input,
            body: owner && seen ? { seen } : {},
          }),
        );
      return unwrap(api.console[action](input));
    },
  });
}

import { createRewardsApi, createVoucherBatchesApi } from '@octap/services';
import type { AuthSession } from '@octap/shared/authentication';

/** The reward catalog API, sending the signed-in user's Google ID token. */
export const rewardsApi = (auth: Pick<AuthSession, 'client'>) =>
  createRewardsApi(auth.client().request);

/** Import batches (OCT-303), sending the signed-in user's Google ID token. */
export const batchesApi = (auth: Pick<AuthSession, 'client'>) =>
  createVoucherBatchesApi(auth.client().request);

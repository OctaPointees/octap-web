import { createRewardsApi } from '@octap/services';
import type { AuthSession } from '@octap/shared/authentication';

/** The reward catalog API, sending the signed-in user's Google ID token. */
export const rewardsApi = (auth: Pick<AuthSession, 'api'>) => createRewardsApi(auth.api);

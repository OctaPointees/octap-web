import { createRewardsApi } from '@octap/services';
import type { useConsoleAuth } from '@octap/shared/google-auth';

type ConsoleAuth = NonNullable<ReturnType<typeof useConsoleAuth>>;

/** The reward catalog API, sending the signed-in user's Google ID token. */
export const rewardsApi = (auth: ConsoleAuth) => createRewardsApi(auth.client().request);

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import type { OctapClient } from '@octap/internal-sdk';
import type { ConsoleIdentity } from '@octap/shared/authentication';

/** Calls Core through the SDK; wrap each call in `unwrap` so a failure throws. */
type Action = (api: OctapClient) => Promise<void>;

/**
 * Runs an organization action against Core, then reads the identity again so access changes
 * (a new organization, a removed membership) show at once. The result is a toast: `success`
 * when not empty, or the error.
 */
export function useOrganizationAction() {
  const { api, refresh } = useAuth();
  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      await action(api);
      return refresh();
    },
  });

  return {
    busy: mutation.isPending,
    run: (action: Action, success: string, after?: (identity: ConsoleIdentity) => void) =>
      mutation.mutate(action, {
        onSuccess: (identity) => {
          if (success) notify.success(success);
          after?.(identity);
        },
        onError: (cause) => notify.error(cause, 'That did not work'),
      }),
  };
}

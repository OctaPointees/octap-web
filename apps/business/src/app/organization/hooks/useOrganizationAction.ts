import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';
import { notify } from '@octap/shared/components';
import type { ConsoleClient, ConsoleIdentity } from '@octap/shared/console-api';

type Action = (client: ConsoleClient) => Promise<void>;

/**
 * Runs an organization action against Core, then reads the identity again so access changes
 * (a new organization, a removed membership) show at once. The result is a toast: `success`
 * when not empty, or the error.
 */
export function useOrganizationAction() {
  const { client, refresh } = useAuth();
  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      await action(client());
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

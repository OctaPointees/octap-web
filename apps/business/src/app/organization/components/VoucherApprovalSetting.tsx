import { useQueryClient } from '@tanstack/react-query';
import type { ConsoleOrganization } from '@octap/shared/console-api';
import { useOrganizationAction } from '../hooks/useOrganizationAction';
import { organizationKeys } from '../utils';

/**
 * The Owner's switch for OCT-59: with it on, a Business Developer's reward (or an API key's) waits
 * for an Owner's approval before it is published. It saves as soon as it changes. Rewards already
 * waiting stay waiting when it is turned off, and are decided the same way.
 */
export function VoucherApprovalSetting({ organization }: { organization: ConsoleOrganization }) {
  const cache = useQueryClient();
  const { run, busy } = useOrganizationAction();
  const on = organization.voucherApprovalRequired ?? false;
  return (
    <section aria-label="Reward approval" className="grid gap-2 max-w-xl">
      <h2 className="font-semibold">Reward approval</h2>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          role="switch"
          className="toggle toggle-primary mt-0.5"
          checked={on}
          disabled={busy}
          onChange={(event) => {
            const voucherApprovalRequired = event.target.checked;
            run(
              async (client) => {
                await client.updateConsoleOrganizationSettings(organization.id, {
                  voucherApprovalRequired,
                });
              },
              voucherApprovalRequired
                ? 'Rewards now need an Owner’s approval before publishing'
                : 'Rewards no longer need approval before publishing',
              // The setting lives on the organization, not the identity: read it again.
              () =>
                void cache.invalidateQueries({
                  queryKey: organizationKeys.detail(organization.id),
                }),
            );
          }}
        />
        <span>
          <span className="font-medium">Require approval before publishing</span>
          <span className="block text-sm opacity-70">
            A Business Developer’s reward, or one an API key activates, waits until an Owner
            approves it. Owners always publish directly. Publishing freezes a reward’s terms
            on-chain, so a second look catches a typo before it is permanent.
          </span>
        </span>
      </label>
    </section>
  );
}

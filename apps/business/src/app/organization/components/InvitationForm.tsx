import { useState } from 'react';
import { useNavigate } from 'react-router';
import { unwrap } from '@octap/shared/authentication';
import { useOrganizationAction } from '../hooks/useOrganizationAction';
import { dashboardPath, formFields } from '../utils';

/** Accepts the Developer invitation from an invitation link, then opens its organization. */
export function InvitationForm({ token }: { token: string }) {
  const [invitation, setInvitation] = useState(token);
  const { run, busy } = useOrganizationAction();
  const navigate = useNavigate();

  return (
    <form
      className="grid gap-3 max-w-xl"
      onSubmit={(event) => {
        formFields(event);
        let acceptedOrganizationId = '';
        run(
          async (api) => {
            const result = await unwrap(api.console.accept({ token: invitation }));
            acceptedOrganizationId = result.organizationId;
          },
          'Invitation accepted',
          (identity) => {
            const org = identity.organizations.find(
              (value) => value.organizationId === acceptedOrganizationId,
            );
            navigate(org ? dashboardPath(org) : '/organizations');
          },
        );
      }}
    >
      <p>Sign in with the Google email addressed by the invitation.</p>
      <label>
        Invitation token
        <input
          className="input input-bordered w-full"
          value={invitation}
          onChange={(event) => setInvitation(event.target.value)}
          required
          pattern="[a-f0-9]{64}"
        />
      </label>
      <button className="btn btn-outline" disabled={busy}>
        Accept invitation
      </button>
    </form>
  );
}

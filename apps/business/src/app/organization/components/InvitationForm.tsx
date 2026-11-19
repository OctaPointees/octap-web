import { useNavigate } from 'react-router';
import { dashboardPath } from '../context/OrganizationContext';
import { useOrganization } from '../hooks/useOrganization';

/** Accepts the Developer invitation from an invitation link, then opens its organization. */
export function InvitationForm() {
  const { invitation, setInvitation, setOrganizationId, perform, fields, busy } = useOrganization();
  const navigate = useNavigate();

  return (
    <form
      className="grid gap-3 max-w-xl"
      onSubmit={(event) => {
        fields(event);
        let acceptedOrganizationId = '';
        void perform(
          async (client) => {
            const result = await client.acceptConsoleInvitation(invitation);
            acceptedOrganizationId = result.organizationId;
          },
          'Invitation accepted',
          (current) => {
            const org = current.organizations.find(
              (value) => value.organizationId === acceptedOrganizationId,
            );
            if (org) {
              setOrganizationId(org.organizationId);
              navigate(dashboardPath(org));
            }
            setInvitation('');
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

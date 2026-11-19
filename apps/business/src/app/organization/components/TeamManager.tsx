import { useOrganization } from '../hooks/useOrganization';

const personaLabel = (persona: string) =>
  persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer';

/** The organization's staff and Developer invitations, for its Business Owner. */
export function TeamManager() {
  const { organizationId, data, busy, perform, fields, inviteLink, setInviteLink } =
    useOrganization();

  return (
    <>
      <h2 className="font-semibold">Team and invitations</h2>
      {data.staff?.map((person) => (
        <div key={person.id} className="flex flex-wrap items-center gap-3">
          <p>
            {person.fullName} · {person.email} · {personaLabel(person.persona)} · {person.status}
          </p>
          {person.persona === 'BUSINESS_DEVELOPER' && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={busy}
              aria-label={`${person.status === 'ACTIVE' ? 'Suspend' : 'Restore'} ${person.email}`}
              onClick={() =>
                void perform(async (client) => {
                  await client.updateConsoleStaffAccess(
                    organizationId,
                    person.id,
                    person.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                  );
                }, 'Developer access updated')
              }
            >
              {person.status === 'ACTIVE' ? 'Suspend access' : 'Restore access'}
            </button>
          )}
        </div>
      ))}
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          const form = fields(event);
          void perform(async (client) => {
            const result = await client.createConsoleInvitation(
              organizationId,
              String(form.get('email')),
            );
            setInviteLink(`${window.location.origin}/?invitation=${result.token}`);
          }, 'Invitation created');
        }}
      >
        <label>
          Developer email
          <input name="email" type="email" required className="input input-bordered ml-2" />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          Invite Developer
        </button>
      </form>
      {inviteLink && (
        <label className="block">
          Invitation link — copy and share with the intended recipient
          <input
            aria-label="Invitation link"
            className="input input-bordered w-full"
            readOnly
            value={inviteLink}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      {data.invitations?.map((invite) => (
        <div key={invite.id} className="flex flex-wrap gap-3 items-center">
          <p>
            {invite.email} · {invite.status} · Expires{' '}
            {new Date(invite.expiresAt).toLocaleDateString()}
          </p>
          {invite.status === 'PENDING' && (
            <button
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() =>
                void perform(async (client) => {
                  await client.revokeConsoleInvitation(organizationId, invite.id);
                }, 'Invitation revoked')
              }
            >
              Revoke {invite.email}
            </button>
          )}
        </div>
      ))}
    </>
  );
}

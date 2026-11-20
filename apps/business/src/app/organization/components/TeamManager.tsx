import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@octap/shared/authentication';
import { Button } from '@/components/shared/Button';
import { unwrap } from '@octap/shared/authentication';
import { useOrganization } from '../hooks/useOrganization';
import { useOrganizationAction } from '../hooks/useOrganizationAction';
import { formFields, organizationKeys } from '../utils';

const personaLabel = (persona: string) =>
  persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer';

/** The organization's staff and Developer invitations, for its Business Owner. */
export function TeamManager() {
  const { api } = useAuth();
  const { organizationId } = useOrganization();
  const { run, busy } = useOrganizationAction();
  const [inviteLink, setInviteLink] = useState('');
  const staff = useQuery({
    queryKey: organizationKeys.staff(organizationId),
    queryFn: () => unwrap(api.console.staff({ organizationId })),
  });
  const invitations = useQuery({
    queryKey: organizationKeys.invitations(organizationId),
    queryFn: () => unwrap(api.console.invitations({ organizationId })),
  });
  const error = staff.error ?? invitations.error;

  return (
    <>
      <h2 className="font-semibold">Team and invitations</h2>
      {error && (
        <p role="alert" className="alert alert-error">
          {error.message}
        </p>
      )}
      {(staff.isPending || invitations.isPending) && !error && (
        <p role="status">Loading the team…</p>
      )}
      {staff.data?.map((person) => (
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
                run(async (api) => {
                  await unwrap(
                    api.console.staffAccess({
                      organizationId,
                      userId: person.id,
                      body: { status: person.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' },
                    }),
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
          const form = formFields(event);
          run(async (api) => {
            const result = await unwrap(
              api.console.invite({
                organizationId,
                body: { email: String(form.get('email')), persona: 'BUSINESS_DEVELOPER' },
              }),
            );
            setInviteLink(`${window.location.origin}/?invitation=${result.token}`);
          }, 'Invitation created');
        }}
      >
        <label>
          Developer email
          <input name="email" type="email" required className="input input-bordered ml-2" />
        </label>
        <Button type="submit" className="btn-primary" loading={busy}>
          Invite Developer
        </Button>
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
      {invitations.data?.map((invite) => (
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
                run(async (api) => {
                  await unwrap(api.console.revokeOrganizations({ organizationId, id: invite.id }));
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

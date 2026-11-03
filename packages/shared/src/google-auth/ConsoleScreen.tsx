import { OrganizationSetup } from './OrganizationSetup';
import { OrganizationProfileForm } from './OrganizationProfileForm';
import { organizationTypeLabel } from './organization-types';
import { Link, useLocation, useNavigate } from 'react-router';
import { useConsoleAuth } from './console-session';
const destination = (org: { persona: string }) =>
  org.persona === 'BUSINESS_OWNER' ? '/merchant' : '/developer';
export function ConsoleScreen() {
  const auth = useConsoleAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!auth?.identity) return null;
  const {
    identity,
    portal,
    platformView,
    selected,
    owner,
    organizationId,
    setOrganizationId,
    data,
    error,
    notice,
    busy,
    loading,
    revision,
    invitation,
    setInvitation,
    inviteLink,
    setInviteLink,
    perform,
    fields,
    choose,
  } = auth;
  const adminDenied = platformView && identity.user.systemRole !== 'SYSTEM_ADMIN';
  const needsChoice =
    portal === 'business' && (!selected || location.pathname === '/organizations');
  const onboarding = portal === 'business' && location.pathname === '/onboarding';
  const allowedPaths = [
    '/merchant',
    '/merchant/settings',
    '/merchant/team',
    '/developer',
    '/developer/api-keys',
  ];

  return (
    <>
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="alert alert-success">
          {notice}
        </p>
      )}
      {loading && <p role="status">Loading current access and organization data…</p>}
      <section className="bg-base-100 border border-base-300 rounded-box p-6 space-y-5">
        {adminDenied ? (
          <p role="alert">
            This account is not a System Admin. Platform access must be assigned by an authorized
            administrator.
          </p>
        ) : platformView ? (
          <>
            <h1 className="text-2xl font-bold">Organization requests</h1>
            <p>
              Approve a new organization to activate it and assign its applicant as Business Owner.
            </p>
            {!loading && data.applications?.length === 0 && <p>No organization requests.</p>}
            {data.applications?.map((request) => (
              <article
                key={request.id}
                className="border border-base-300 rounded-box p-4 space-y-3"
              >
                <h2 className="font-semibold">
                  {request.name} · {request.slug}
                </h2>
                <p>
                  {request.applicantEmail} · {request.status}
                </p>
                <p className="text-sm">{organizationTypeLabel(request.organizationType)}</p>
                {request.legalName && <p>Legal name: {request.legalName}</p>}
                {request.taxId && <p>Business registration / tax number: {request.taxId}</p>}
                {request.representativeName && (
                  <p>Owner / representative: {request.representativeName}</p>
                )}
                {request.nationalIdLast4 && (
                  <p>
                    CCCD: {'\u2022'.repeat(8)}
                    {request.nationalIdLast4} {'\u2014'} not verified
                  </p>
                )}
                {request.reason && <p>{request.reason}</p>}
                {request.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={busy}
                      onClick={() =>
                        void perform(async (client) => {
                          await client.decidePlatformOrganizationRequest(request.id, 'approve');
                        }, 'Organization approved')
                      }
                    >
                      Approve {request.name}
                    </button>
                    <form
                      className="flex gap-2 flex-wrap"
                      onSubmit={(event) => {
                        const form = fields(event);
                        void perform(async (client) => {
                          await client.decidePlatformOrganizationRequest(
                            request.id,
                            'reject',
                            String(form.get('reason')),
                          );
                        }, 'Organization rejected');
                      }}
                    >
                      <input
                        name="reason"
                        aria-label={`Rejection reason for ${request.name}`}
                        className="input input-bordered"
                        required
                        maxLength={1000}
                        placeholder="Rejection reason"
                      />
                      <button className="btn btn-outline btn-sm" disabled={busy}>
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </>
        ) : onboarding ? (
          <>
            <h1 className="text-2xl font-bold">Organization onboarding</h1>
            {identity.organizations.length === 0 && (
              <p>
                Your account has no active organization access. Request a new organization or accept
                an invitation.
              </p>
            )}
            {!invitation && <OrganizationSetup />}
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
                      navigate(destination(org));
                    }
                    setInvitation('');
                  },
                );
              }}
            >
              <h2 className="font-semibold">Accept a Developer invitation</h2>
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
            <h2 className="font-semibold">Your organization requests</h2>
            {data.applications?.map((request) => (
              <p key={request.id}>
                {request.name} · {request.status}
                {request.reason ? ` · ${request.reason}` : ''}
              </p>
            ))}
            {!loading && data.applications?.length === 0 && <p>No requests submitted.</p>}
          </>
        ) : needsChoice ? (
          <>
            <h1 className="text-2xl font-bold">Choose an organization</h1>
            {identity.organizations.length === 0 ? (
              <p>
                No active organization access.{' '}
                <Link className="link" to="/onboarding">
                  Continue to onboarding
                </Link>
              </p>
            ) : (
              <label>
                Organization
                <select
                  className="select select-bordered w-full mt-3"
                  value=""
                  onChange={(event) => choose(event.target.value)}
                >
                  <option value="">Select an organization</option>
                  {identity.organizations.map((org) => (
                    <option key={org.organizationId} value={org.organizationId}>
                      {org.name} ·{' '}
                      {org.persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer'}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        ) : !loading && data.organization ? (
          <>
            <h1 className="text-2xl font-bold">{data.organization.name}</h1>
            <p>
              {data.organization.persona === 'BUSINESS_OWNER'
                ? 'Business Owner'
                : 'Business Developer'}{' '}
              · {data.organization.status} · {data.organization.slug}
            </p>
            {location.pathname === '/merchant/settings' && owner ? (
              <OrganizationProfileForm
                key={`${data.organization.id}-${revision}`}
                organization={data.organization}
              />
            ) : location.pathname === '/merchant/team' && owner ? (
              <>
                <h2 className="font-semibold">Team and invitations</h2>
                {data.staff?.map((person) => (
                  <p key={person.id}>
                    {person.fullName} · {person.email} ·{' '}
                    {person.persona === 'BUSINESS_OWNER' ? 'Business Owner' : 'Business Developer'}{' '}
                    · {person.status}
                  </p>
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
                    <input
                      name="email"
                      type="email"
                      required
                      className="input input-bordered ml-2"
                    />
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
            ) : location.pathname === '/developer/api-keys' ? (
              <>
                <h2 className="font-semibold">API credentials</h2>
                <p>Credential metadata only. Secret keys stay in Core.</p>
                {data.credentials?.map((key) => (
                  <p key={key.id}>
                    {key.name} · {key.keyPrefix}… · {key.status}
                  </p>
                ))}
                {data.credentials?.length === 0 && <p>No API credentials issued.</p>}
              </>
            ) : allowedPaths.includes(location.pathname) ? (
              <>
                <h2 className="font-semibold">
                  {owner ? 'Business Owner' : 'Business Developer'} overview
                </h2>
                <p>
                  Your organization access is active. Use the navigation to manage your permitted
                  settings and integrations.
                </p>
              </>
            ) : (
              <p>
                This operation is not available here.{' '}
                <Link className="link" to={destination(selected!)}>
                  Return to overview
                </Link>
              </p>
            )}
          </>
        ) : null}
      </section>
    </>
  );
}

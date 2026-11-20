import { useState } from 'react';
import { unwrap, useAuth } from '@octap/shared/authentication';
import type {
  ConsoleOrganizationsOrganizationResponse as ConsoleOrganization,
  IdentityChangePayload,
  OrganizationType,
} from '@octap/internal-sdk';
import { useOrganizationAction } from '../hooks/useOrganizationAction';
import { formFields, organizationTypeLabel } from '../utils';

/**
 * The Owner's organization settings. The name saves straight away. Identity fields (type, legal
 * name, tax number, representative, CCCD) only change through an UPDATE_IDENTITY change request,
 * which needs a reason and a System Admin's approval, so the form sends only the ones that changed.
 */
export function OrganizationProfileForm({ organization }: { organization: ConsoleOrganization }) {
  const { identity } = useAuth();
  const { run, busy } = useOrganizationAction();
  const [type, setType] = useState<OrganizationType | ''>(organization.organizationType ?? '');
  const [error, setError] = useState('');
  if (!identity) return null;
  return (
    <form
      className="grid gap-4 max-w-xl"
      onSubmit={(event) => {
        const form = formFields(event);
        if (!type) return;
        const field = (key: string) => String(form.get(key) ?? '').trim();
        const name = field('name');
        const reason = field('reason');

        // Only what differs from what Core has, so the request shows the real change.
        const changes: IdentityChangePayload = {};
        if (type !== organization.organizationType) changes.organizationType = type;
        if (type === 'COMPANY') {
          if (field('legalName') !== (organization.legalName ?? ''))
            changes.legalName = field('legalName');
          if (field('taxId') !== (organization.taxId ?? '')) changes.taxId = field('taxId');
        } else {
          if (field('representativeName') !== (organization.representativeName ?? ''))
            changes.representativeName = field('representativeName');
          if (field('nationalId')) changes.nationalId = field('nationalId');
        }
        const renamed = name !== organization.name;
        const identityChanged = Object.keys(changes).length > 0;

        if (!renamed && !identityChanged) return setError('Nothing has changed.');
        if (identityChanged && reason.length < 3)
          return setError('Give a reason so a System Admin can review the identity change.');
        setError('');

        run(
          async (api) => {
            const organizationId = organization.id;
            if (renamed) await unwrap(api.console.profile({ organizationId, body: { name } }));
            if (identityChanged)
              await unwrap(
                api.console.propose({
                  organizationId,
                  body: { requestType: 'UPDATE_IDENTITY', reason, payload: changes },
                }),
              );
          },
          identityChanged
            ? renamed
              ? 'Name saved. Identity change sent for approval'
              : 'Identity change sent for approval'
            : 'Organization name saved',
        );
      }}
    >
      <h2 className="font-semibold">Organization settings</h2>
      {organization.organizationType ? (
        <p>{organizationTypeLabel(organization.organizationType)}</p>
      ) : (
        <label>
          Organization type
          <select
            className="select select-bordered w-full"
            value={type}
            required
            onChange={(event) => setType(event.target.value as OrganizationType)}
          >
            <option value="">Select an organization type</option>
            <option value="INDIVIDUAL_HOUSEHOLD">Individual / Household business</option>
            <option value="COMPANY">Company (registered legal entity)</option>
          </select>
        </label>
      )}
      <label>
        Organization name
        <input
          name="name"
          className="input input-bordered w-full"
          defaultValue={organization.name}
          required
          minLength={2}
          maxLength={160}
        />
      </label>
      {type === 'COMPANY' ? (
        <>
          <label>
            Company legal name
            <input
              name="legalName"
              className="input input-bordered w-full"
              defaultValue={organization.legalName ?? ''}
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <label>
            Business registration / tax number
            <input
              name="taxId"
              className="input input-bordered w-full"
              defaultValue={organization.taxId ?? ''}
              required
              pattern="[A-Za-z0-9][A-Za-z0-9-]{1,30}[A-Za-z0-9]"
              maxLength={32}
            />
          </label>
        </>
      ) : type === 'INDIVIDUAL_HOUSEHOLD' ? (
        <>
          <label>
            Owner / representative full name
            <input
              name="representativeName"
              className="input input-bordered w-full"
              defaultValue={organization.representativeName ?? identity.user.fullName}
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <p className="text-sm">
            {organization.nationalIdLast4
              ? `Saved CCCD: ••••••••${organization.nationalIdLast4}, not verified`
              : 'No CCCD saved. Verification will be available in a later phase.'}
          </p>
          <label>
            Update CCCD number
            <input
              name="nationalId"
              className="input input-bordered w-full"
              inputMode="numeric"
              pattern="[0-9]{12}"
              maxLength={12}
              autoComplete="off"
              placeholder="Leave blank to keep the saved CCCD"
            />
          </label>
          <p className="text-sm opacity-65">
            Only a Business Owner can update CCCD. Saving it does not verify your identity.
          </p>
        </>
      ) : null}
      <label>
        Reason for identity changes
        <textarea
          name="reason"
          className="textarea textarea-bordered w-full"
          maxLength={1000}
          placeholder="Needed only when you change the type, legal name, tax number, representative or CCCD"
        />
      </label>
      <p className="text-sm opacity-65">
        The name saves straight away. Identity changes go to a System Admin for approval and apply
        once approved.
      </p>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={busy || !type}>
        Save changes
      </button>
    </form>
  );
}

import { useState } from 'react';
import { useConsoleAuth } from './console-session';
import type { ConsoleOrganization, OrganizationType } from './portal-api';
import { organizationTypeLabel } from './organization-types';

export function OrganizationProfileForm({ organization }: { organization: ConsoleOrganization }) {
  const auth = useConsoleAuth();
  const [type, setType] = useState<OrganizationType | ''>(organization.organizationType ?? '');
  if (!auth?.identity) return null;
  return (
    <form
      className="grid gap-4 max-w-xl"
      onSubmit={(event) => {
        const form = auth.fields(event);
        if (!type) return;
        const nationalId = String(form.get('nationalId') ?? '').trim();
        const input = {
          name: String(form.get('name')),
          ...(!organization.organizationType ? { organizationType: type } : {}),
          ...(type === 'COMPANY'
            ? { legalName: String(form.get('legalName')), taxId: String(form.get('taxId')) }
            : {
                representativeName: String(form.get('representativeName')),
                ...(nationalId ? { nationalId } : {}),
              }),
        };
        void auth.perform(async (client) => {
          await client.updateConsoleOrganizationProfile(organization.id, input);
        }, 'Organization profile saved');
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
              defaultValue={organization.representativeName ?? auth.identity.user.fullName}
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <p className="text-sm">
            {organization.nationalIdLast4
              ? `Saved CCCD: ••••••••${organization.nationalIdLast4} — not verified`
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
      <button className="btn btn-primary" disabled={auth.busy || !type}>
        Save profile
      </button>
    </form>
  );
}

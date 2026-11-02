import { useState, type FormEvent } from 'react';
import { useConsoleAuth } from './console-session';
import type { OrganizationType } from './portal-api';

import { organizationTypeLabel } from './organization-types';
const initialDetails = (fullName: string) => ({
  name: '',
  slug: '',
  representativeName: fullName,
  legalName: '',
  taxId: '',
  nationalId: '',
});

export function OrganizationSetup() {
  const auth = useConsoleAuth();
  const [type, setType] = useState<OrganizationType>();
  const [step, setStep] = useState<'type' | 'details' | 'review' | 'submitted'>('type');
  const [details, setDetails] = useState(() => initialDetails(auth?.identity?.user.fullName ?? ''));
  if (!auth?.identity) return null;
  const set = (field: keyof typeof details, value: string) =>
    setDetails((current) => ({ ...current, [field]: value }));
  function select(value: OrganizationType) {
    setType(value);
    if (value === 'COMPANY') set('nationalId', '');
    setStep('details');
  }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep('review');
  }
  function submit() {
    if (!type) return;
    const input = {
      name: details.name.trim(),
      slug: details.slug.trim(),
      organizationType: type,
      ...(type === 'COMPANY'
        ? { legalName: details.legalName.trim(), taxId: details.taxId.trim() }
        : {
            representativeName: details.representativeName.trim(),
            ...(details.nationalId ? { nationalId: details.nationalId } : {}),
          }),
    };
    void auth!.perform(
      async (client) => {
        await client.requestConsoleOrganization(input);
      },
      'Organization request submitted for approval',
      () => {
        setDetails(initialDetails(auth!.identity!.user.fullName));
        setStep('submitted');
      },
    );
  }
  if (step === 'submitted')
    return (
      <div className="rounded-box border border-base-300 p-5 space-y-3">
        <h2 className="font-semibold">Organization request submitted</h2>
        <p>A System Admin will review your request. Track its status below.</p>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            setType(undefined);
            setStep('type');
          }}
        >
          Set up another organization
        </button>
      </div>
    );
  return (
    <div className="space-y-6">
      <ol className="steps w-full text-sm" aria-label="Organization setup progress">
        {['Choose type', 'Organization details', 'Review'].map((label, index) => (
          <li
            key={label}
            className={`step ${index <= ['type', 'details', 'review'].indexOf(step) ? 'step-primary' : ''}`}
            aria-current={
              index === ['type', 'details', 'review'].indexOf(step) ? 'step' : undefined
            }
          >
            {label}
          </li>
        ))}
      </ol>
      {step === 'type' ? (
        <>
          <h2 className="text-xl font-semibold text-center">
            Choose the type of organization you want to add
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <button
              type="button"
              className="flex flex-col text-left rounded-box border border-primary overflow-hidden shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
              onClick={() => select('INDIVIDUAL_HOUSEHOLD')}
            >
              <div className="bg-primary text-primary-content p-5">
                <h3 className="text-xl font-bold">Individual / Household business</h3>
                <p className="text-sm mt-1">
                  CCCD can be added or updated; verification comes later.
                </p>
              </div>
              <div className="p-5">
                <p>For:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2">
                  <li>Individual business owners</li>
                  <li>Household businesses</li>
                  <li>Startups without a legal entity</li>
                  <li>Students and developers researching OctaP</li>
                </ul>
              </div>
            </button>
            <button
              type="button"
              className="flex flex-col text-left rounded-box border border-base-300 overflow-hidden shadow-sm hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
              onClick={() => select('COMPANY')}
            >
              <div className="bg-primary text-primary-content p-5">
                <h3 className="text-xl font-bold">Company (registered legal entity)</h3>
                <p className="text-sm mt-1">Business registration / tax number</p>
              </div>
              <div className="p-5 flex-1">
                <p>For:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2">
                  <li>Companies with a business registration certificate</li>
                </ul>
              </div>
            </button>
          </div>
        </>
      ) : step === 'details' ? (
        <form className="max-w-2xl mx-auto" onSubmit={review}>
          <fieldset className="grid gap-4" disabled={auth.busy}>
            <h2 className="text-xl font-semibold">{organizationTypeLabel(type)}</h2>
            <label>
              Organization name
              <input
                className="input input-bordered w-full"
                name="name"
                required
                minLength={2}
                maxLength={160}
                value={details.name}
                onChange={(event) => set('name', event.target.value)}
              />
            </label>
            <label>
              Organization slug
              <input
                className="input input-bordered w-full"
                name="slug"
                required
                pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]"
                placeholder="your-business"
                value={details.slug}
                onChange={(event) => set('slug', event.target.value)}
              />
            </label>
            {type === 'COMPANY' ? (
              <>
                <label>
                  Company legal name
                  <input
                    className="input input-bordered w-full"
                    name="legalName"
                    required
                    minLength={2}
                    maxLength={160}
                    value={details.legalName}
                    onChange={(event) => set('legalName', event.target.value)}
                  />
                </label>
                <label>
                  Business registration / tax number
                  <input
                    className="input input-bordered w-full"
                    name="taxId"
                    required
                    pattern="[A-Za-z0-9][A-Za-z0-9-]{1,30}[A-Za-z0-9]"
                    maxLength={32}
                    value={details.taxId}
                    onChange={(event) => set('taxId', event.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Owner / representative full name
                  <input
                    className="input input-bordered w-full"
                    name="representativeName"
                    required
                    minLength={2}
                    maxLength={160}
                    value={details.representativeName}
                    onChange={(event) => set('representativeName', event.target.value)}
                  />
                </label>
                <label>
                  CCCD number (optional)
                  <input
                    className="input input-bordered w-full"
                    name="nationalId"
                    inputMode="numeric"
                    pattern="[0-9]{12}"
                    maxLength={12}
                    autoComplete="off"
                    value={details.nationalId}
                    onChange={(event) => set('nationalId', event.target.value)}
                  />
                </label>
                <p className="text-sm opacity-65">
                  You can add or update CCCD later in organization settings. Saving it does not
                  verify your identity.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('type')}>
                Back
              </button>
              <button className="btn btn-primary">Review organization</button>
            </div>
          </fieldset>
        </form>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-xl font-semibold">Review your organization</h2>
          <dl className="grid gap-3">
            <div>
              <dt className="text-sm opacity-65">Organization type</dt>
              <dd>{organizationTypeLabel(type)}</dd>
            </div>
            <div>
              <dt className="text-sm opacity-65">Organization name</dt>
              <dd>{details.name}</dd>
            </div>
            <div>
              <dt className="text-sm opacity-65">Slug</dt>
              <dd>{details.slug}</dd>
            </div>
            {type === 'COMPANY' ? (
              <>
                <div>
                  <dt className="text-sm opacity-65">Legal name</dt>
                  <dd>{details.legalName}</dd>
                </div>
                <div>
                  <dt className="text-sm opacity-65">Business registration / tax number</dt>
                  <dd>{details.taxId}</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="text-sm opacity-65">Owner / representative</dt>
                  <dd>{details.representativeName}</dd>
                </div>
                <div>
                  <dt className="text-sm opacity-65">CCCD</dt>
                  <dd>
                    {details.nationalId
                      ? `••••••••${details.nationalId.slice(-4)} — not verified`
                      : 'Not provided'}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <p className="text-sm">
            A System Admin must approve this request before you receive Business Owner access.
            Google login verifies your account email; it does not verify CCCD or company
            registration.
          </p>
          <div className="flex gap-3">
            <button
              className="btn btn-ghost"
              disabled={auth.busy}
              onClick={() => setStep('details')}
            >
              Back
            </button>
            <button className="btn btn-primary" disabled={auth.busy} onClick={submit}>
              {auth.busy ? 'Submitting…' : 'Submit organization request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

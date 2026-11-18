import { Check } from 'phosphor-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { organizationRequestsKey } from './organization-requests';
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

const STEPS = [
  'Step 1: Choose the type of organization you want to add',
  'Step 2: Complete the registration form',
  'Step 3: Review your information',
] as const;
type StepIndex = 0 | 1 | 2;

const field = 'flex flex-col gap-1.5 text-sm font-medium';
const input = 'input w-full font-normal';

/**
 * Create an organization in three steps on a vertical step bar. Only the current step is open;
 * finished steps collapse to a summary and reopen from their header. Later steps open only
 * through Continue, so the form's own validation always runs before the review.
 */
export function OrganizationSetup() {
  const auth = useConsoleAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState<OrganizationType>();
  const [step, setStep] = useState<StepIndex>(0);
  const [details, setDetails] = useState(() => initialDetails(auth?.identity?.user.fullName ?? ''));
  if (!auth?.identity) return null;
  const busy = auth.busy;
  const set = (key: keyof typeof details, value: string) =>
    setDetails((current) => ({ ...current, [key]: value }));
  function select(value: OrganizationType) {
    setType(value);
    if (value === 'COMPANY') set('nationalId', '');
  }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(2);
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
      // perform() shows its success toast, which stays up across the redirect.
      () => {
        void queryClient.invalidateQueries({ queryKey: organizationRequestsKey });
        navigate('/organizations');
      },
    );
  }

  const summaries: Record<StepIndex, ReactNode> = {
    0: type ? organizationTypeLabel(type) : null,
    1: details.name ? `${details.name.trim()} (${details.slug.trim()})` : null,
    2: null,
  };

  return (
    <section aria-label="Create an organization" className="space-y-6">
      <ol aria-label="Organization setup progress">
        {STEPS.map((title, index) => {
          const i = index as StepIndex;
          return (
            <Step
              key={title}
              index={i}
              title={title}
              state={i < step ? 'done' : i === step ? 'current' : 'upcoming'}
              summary={summaries[i]}
              last={i === STEPS.length - 1}
              onReopen={busy ? undefined : () => setStep(i)}
            >
              {i === 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TypeCard
                      selected={type === 'INDIVIDUAL_HOUSEHOLD'}
                      onSelect={() => select('INDIVIDUAL_HOUSEHOLD')}
                      title="Individual / Household business"
                      subtitle="CCCD can be added or updated; verification comes later."
                      audience={[
                        'Individual business owners',
                        'Household businesses',
                        'Startups without a legal entity',
                        'Students and developers researching OctaP',
                      ]}
                    />
                    <TypeCard
                      selected={type === 'COMPANY'}
                      onSelect={() => select('COMPANY')}
                      title="Company (registered legal entity)"
                      subtitle="Business registration / tax number"
                      audience={['Companies with a business registration certificate']}
                    />
                  </div>
                  <Actions>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!type}
                      onClick={() => setStep(1)}
                    >
                      Continue
                    </button>
                  </Actions>
                </>
              )}

              {i === 1 && (
                <form onSubmit={review}>
                  <fieldset className="grid max-w-2xl gap-4" disabled={busy}>
                    <p className="text-sm opacity-70">{organizationTypeLabel(type)}</p>
                    <label className={field}>
                      Organization name
                      <input
                        className={input}
                        name="name"
                        required
                        minLength={2}
                        maxLength={160}
                        value={details.name}
                        onChange={(event) => set('name', event.target.value)}
                      />
                    </label>
                    <label className={field}>
                      Organization slug
                      <input
                        className={input}
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
                        <label className={field}>
                          Company legal name
                          <input
                            className={input}
                            name="legalName"
                            required
                            minLength={2}
                            maxLength={160}
                            value={details.legalName}
                            onChange={(event) => set('legalName', event.target.value)}
                          />
                        </label>
                        <label className={field}>
                          Business registration / tax number
                          <input
                            className={input}
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
                        <label className={field}>
                          Owner / representative full name
                          <input
                            className={input}
                            name="representativeName"
                            required
                            minLength={2}
                            maxLength={160}
                            value={details.representativeName}
                            onChange={(event) => set('representativeName', event.target.value)}
                          />
                        </label>
                        <label className={field}>
                          CCCD number (optional)
                          <input
                            className={input}
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
                          You can add or update CCCD later in organization settings. Saving it does
                          not verify your identity.
                        </p>
                      </>
                    )}
                  </fieldset>
                  <Actions>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => setStep(0)}
                    >
                      Back
                    </button>
                    <button className="btn btn-primary" disabled={busy}>
                      Continue
                    </button>
                  </Actions>
                </form>
              )}

              {i === 2 && (
                <>
                  <dl className="divide-y divide-base-300 rounded-box border border-base-300 text-sm">
                    <Row label="Organization type">{organizationTypeLabel(type)}</Row>
                    <Row label="Organization name">{details.name}</Row>
                    <Row label="Slug">{details.slug}</Row>
                    {type === 'COMPANY' ? (
                      <>
                        <Row label="Legal name">{details.legalName}</Row>
                        <Row label="Business registration / tax number">{details.taxId}</Row>
                      </>
                    ) : (
                      <>
                        <Row label="Owner / representative">{details.representativeName}</Row>
                        <Row label="CCCD">
                          {details.nationalId
                            ? `••••••••${details.nationalId.slice(-4)} (not verified)`
                            : 'Not provided'}
                        </Row>
                      </>
                    )}
                  </dl>
                  <p className="mt-4 text-sm opacity-80">
                    A System Admin must approve this request before you receive Business Owner
                    access. Google login verifies your account email; it does not verify CCCD or
                    company registration.
                  </p>
                  <Actions>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={submit}
                    >
                      {busy ? 'Submitting…' : 'Submit'}
                    </button>
                  </Actions>
                </>
              )}
            </Step>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * One step on the vertical bar: a numbered marker (a check once done), the line down to the
 * next step, a header, and the collapsible body. A finished step's header reopens it.
 */
function Step({
  index,
  title,
  state,
  summary,
  last,
  onReopen,
  children,
}: {
  index: StepIndex;
  title: string;
  state: 'done' | 'current' | 'upcoming';
  summary: ReactNode;
  last: boolean;
  onReopen?: () => void;
  children: ReactNode;
}) {
  const open = state === 'current';
  const bodyId = `organization-step-${index}`;
  const heading = (
    <>
      <span className={`block font-semibold ${state === 'upcoming' ? 'opacity-50' : ''}`}>
        {title}
      </span>
      {state === 'done' && summary && (
        <span className="mt-0.5 block truncate text-sm font-normal opacity-65">{summary}</span>
      )}
    </>
  );

  return (
    <li className="relative flex gap-4" aria-current={open ? 'step' : undefined}>
      {!last && (
        <span
          aria-hidden
          className={`absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 rounded-full ${
            state === 'done' ? 'bg-primary' : 'bg-base-300'
          }`}
        />
      )}
      <span
        aria-hidden
        className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
          state === 'done'
            ? 'border-primary bg-primary text-primary-content'
            : state === 'current'
              ? 'border-primary bg-base-100 text-primary'
              : 'border-base-300 bg-base-100 text-base-content/50'
        }`}
      >
        {state === 'done' ? <Check size={16} weight="bold" /> : index + 1}
      </span>

      <div className={`min-w-0 flex-1 ${last ? '' : 'pb-8'}`}>
        <h3 className="min-h-8 pt-1">
          {state === 'done' && onReopen ? (
            <button
              type="button"
              className="group w-full rounded-field text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-expanded={false}
              onClick={onReopen}
            >
              {heading}
              <span className="mt-1 block text-xs font-medium text-primary group-hover:underline">
                Edit
              </span>
            </button>
          ) : (
            heading
          )}
        </h3>
        {/* Closed steps render nothing (their values live in state); opening animates in. */}
        {open && (
          <div
            id={bodyId}
            className="grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out starting:grid-rows-[0fr] starting:opacity-0"
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pt-4">{children}</div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function TypeCard({
  selected,
  onSelect,
  title,
  subtitle,
  audience,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  audience: string[];
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex flex-col overflow-hidden rounded-box border-2 text-left transition-[border-color,box-shadow] outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        selected ? 'border-primary shadow-md' : 'border-base-300'
      }`}
    >
      <div className="bg-primary p-4 pr-12 text-primary-content">
        <span className="block text-base font-bold">{title}</span>
        <span className="mt-1 block text-xs opacity-90">{subtitle}</span>
      </div>
      {selected && (
        <span
          aria-hidden
          className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-primary-content text-primary"
        >
          <Check size={14} weight="bold" />
        </span>
      )}
      <div className="flex-1 p-4 text-sm">
        <span className="block opacity-70">For:</span>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {audience.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </button>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
      <dt className="opacity-65">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

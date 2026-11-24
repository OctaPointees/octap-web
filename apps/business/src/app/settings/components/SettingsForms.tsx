import { useState, type ReactNode } from 'react';
import { Field } from '@base-ui/react/field';
import { Info } from 'phosphor-react';
import { unwrap, useAuth } from '@octap/shared/authentication';
import type {
  ConsoleOrganizationsOrganizationResponse as ConsoleOrganization,
  IdentityChangePayload,
  OrganizationType,
} from '@octap/internal-sdk';
import { Button } from '@octap/shared/components';
import { CopyButton, FormField, TextInput } from '@/components/shared/Controls';
import { StatusBadge } from '@/components/shared/Display';
import { useOrganizationAction } from '@/app/organization/hooks/useOrganizationAction';
import { formFields, organizationTypeLabel } from '@/app/organization/utils';

/** A settings card: fields in the body, Cancel and Save in a footer (none when read-only). */
export function SettingsForm({
  onSubmit,
  onCancel,
  dirty,
  busy,
  savedAt,
  submitLabel,
  error,
  readOnly = false,
  children,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  dirty: boolean;
  busy: boolean;
  /** For a change that shows on this form: the Save button confirms it with a check. */
  savedAt?: number | null;
  submitLabel: string;
  error?: string;
  readOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-box border border-base-300 bg-base-100"
    >
      <div className="flex flex-col gap-5 p-5">{children}</div>
      {!readOnly && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-base-300 px-5 py-3">
          {error && (
            <p role="alert" className="mr-auto text-sm text-error">
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!dirty || busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <Button
            type="submit"
            className="btn-primary btn-sm"
            disabled={!dirty}
            loading={busy}
            successKey={savedAt}
          >
            {submitLabel}
          </Button>
        </footer>
      )}
    </form>
  );
}

/** A labelled read-only value, laid out like a form field. */
function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex min-h-10 items-center gap-2 text-sm">{children}</div>
    </div>
  );
}

/** The organization's name (saved straight away), its slug and its status. */
export function OrganizationGeneralForm({
  organization,
  readOnly = false,
}: {
  organization: ConsoleOrganization;
  readOnly?: boolean;
}) {
  const { run, busy, savedAt } = useOrganizationAction();
  const [name, setName] = useState(organization.name);
  const dirty = name.trim() !== organization.name;

  return (
    <SettingsForm
      dirty={dirty}
      busy={busy}
      savedAt={savedAt}
      readOnly={readOnly}
      submitLabel="Save"
      onCancel={() => setName(organization.name)}
      onSubmit={(event) => {
        formFields(event);
        run(async (api) => {
          await unwrap(
            api.console.profile({
              organizationId: organization.id,
              body: { name: name.trim() },
            }),
          );
        }, '');
      }}
    >
      <FormField label="Organization name">
        <TextInput
          value={name}
          readOnly={readOnly}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={160}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <ReadOnlyField label="Slug">
          <code className="truncate font-mono">{organization.slug}</code>
          <CopyButton value={organization.slug} />
        </ReadOnlyField>
        <ReadOnlyField label="Status">
          <StatusBadge status={organization.status.toLowerCase()} />
        </ReadOnlyField>
      </div>
    </SettingsForm>
  );
}

/**
 * The organization's legal identity. Core only changes it through an UPDATE_IDENTITY change
 * request, which needs a reason and a System Admin's approval, so the form sends only the fields
 * that differ from what Core has, and asks for the reason once something has changed.
 */
export function OrganizationIdentityForm({
  organization,
  readOnly = false,
}: {
  organization: ConsoleOrganization;
  readOnly?: boolean;
}) {
  const { identity } = useAuth();
  const { run, busy } = useOrganizationAction();
  const initial = {
    type: organization.organizationType ?? '',
    legalName: organization.legalName ?? '',
    taxId: organization.taxId ?? '',
    representativeName: organization.representativeName ?? identity?.user.fullName ?? '',
    nationalId: '',
    reason: '',
  };
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const set = (key: keyof typeof initial) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Only what differs from what Core has, so the request shows the real change.
  const changes: IdentityChangePayload = {};
  const type = values.type as OrganizationType | '';
  if (type && type !== organization.organizationType) changes.organizationType = type;
  if (type === 'COMPANY') {
    if (values.legalName.trim() !== (organization.legalName ?? ''))
      changes.legalName = values.legalName.trim();
    if (values.taxId.trim() !== (organization.taxId ?? '')) changes.taxId = values.taxId.trim();
  } else if (type === 'INDIVIDUAL_HOUSEHOLD') {
    if (values.representativeName.trim() !== (organization.representativeName ?? ''))
      changes.representativeName = values.representativeName.trim();
    if (values.nationalId.trim()) changes.nationalId = values.nationalId.trim();
  }
  const dirty = Object.keys(changes).length > 0;

  return (
    <SettingsForm
      dirty={dirty}
      busy={busy}
      readOnly={readOnly}
      submitLabel="Request change"
      error={error}
      onCancel={() => {
        setValues(initial);
        setError('');
      }}
      onSubmit={(event) => {
        formFields(event);
        const reason = values.reason.trim();
        if (reason.length < 3)
          return setError('Add a reason so a System Admin can review the change.');
        setError('');
        run(async (api) => {
          await unwrap(
            api.console.propose({
              organizationId: organization.id,
              body: { requestType: 'UPDATE_IDENTITY', reason, payload: changes },
            }),
          );
        }, 'Change sent for approval');
      }}
    >
      {!readOnly && (
        <p className="flex items-start gap-2 text-sm opacity-70">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          Changes here go to a System Admin for review and apply once approved.
        </p>
      )}

      {organization.organizationType || readOnly ? (
        <ReadOnlyField label="Type">
          {organizationTypeLabel(organization.organizationType)}
        </ReadOnlyField>
      ) : (
        <FormField label="Type">
          <select
            className="select w-full"
            value={values.type}
            required
            onChange={(event) => set('type')(event.target.value)}
          >
            <option value="">Select an organization type</option>
            <option value="INDIVIDUAL_HOUSEHOLD">Individual / Household business</option>
            <option value="COMPANY">Company (registered legal entity)</option>
          </select>
        </FormField>
      )}

      {type === 'COMPANY' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Company legal name">
            <TextInput
              value={values.legalName}
              readOnly={readOnly}
              onChange={(event) => set('legalName')(event.target.value)}
              required
              minLength={2}
              maxLength={160}
            />
          </FormField>
          <FormField label="Registration / tax number">
            <TextInput
              value={values.taxId}
              readOnly={readOnly}
              onChange={(event) => set('taxId')(event.target.value)}
              required
              pattern="[A-Za-z0-9][A-Za-z0-9-]{1,30}[A-Za-z0-9]"
              maxLength={32}
            />
          </FormField>
        </div>
      )}

      {type === 'INDIVIDUAL_HOUSEHOLD' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Owner or representative">
            <TextInput
              value={values.representativeName}
              readOnly={readOnly}
              onChange={(event) => set('representativeName')(event.target.value)}
              required
              minLength={2}
              maxLength={160}
            />
          </FormField>
          {readOnly ? (
            <ReadOnlyField label="CCCD number">
              <span className="opacity-65">Only the Owner can see this.</span>
            </ReadOnlyField>
          ) : (
            <FormField
              label="CCCD number"
              hint={
                organization.nationalIdLast4
                  ? `Saved: ••••${organization.nationalIdLast4}, not verified. Leave blank to keep it.`
                  : 'None saved. Saving one does not verify your identity.'
              }
            >
              <TextInput
                value={values.nationalId}
                onChange={(event) => set('nationalId')(event.target.value)}
                inputMode="numeric"
                pattern="[0-9]{12}"
                maxLength={12}
                autoComplete="off"
              />
            </FormField>
          )}
        </div>
      )}

      {dirty && (
        <Field.Root className="flex flex-col gap-1">
          <Field.Label className="text-sm font-medium">Reason for the change</Field.Label>
          <Field.Control
            render={<textarea />}
            className="textarea w-full"
            value={values.reason}
            onChange={(event) => set('reason')(event.target.value)}
            maxLength={1000}
            required
          />
          <Field.Description className="text-xs opacity-60">
            A System Admin reads this when reviewing the request.
          </Field.Description>
        </Field.Root>
      )}
    </SettingsForm>
  );
}

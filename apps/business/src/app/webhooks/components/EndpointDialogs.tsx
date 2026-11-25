import { useId, useState } from 'react';
import { Warning } from 'phosphor-react';
import { Button, ConfirmDialog, Modal } from '@octap/shared/components';
import { FormField, TextInput } from '@/components/shared/Controls';
import { CopySecret } from '@/app/api-keys/components/CreateKeyDialog';
import { checkUrl } from '../domain/webhooks';
import { useRegisterEndpoint, useRotateSecret, type WebhookEndpoint } from '../hooks/useWebhooks';

/** The signing secret, shown once, with a box to tick before the dialog may close. */
function SecretReveal({
  secret,
  stored,
  onStoredChange,
  warned,
}: {
  secret: string;
  stored: boolean;
  onStoredChange: (stored: boolean) => void;
  warned: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-field border border-primary/30 bg-primary/5 p-4">
        <code className="min-w-0 flex-1 font-mono text-sm break-all select-all">{secret}</code>
        <CopySecret value={secret} noun="secret" />
      </div>
      <p className="flex items-start gap-2 text-sm opacity-75">
        <Warning size={16} className="mt-0.5 shrink-0" aria-hidden />
        Your server uses it to check that each event really comes from OctaP. Keep it there, never
        in a browser or app.
      </p>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="checkbox checkbox-primary checkbox-sm"
          checked={stored}
          onChange={(event) => onStoredChange(event.target.checked)}
        />
        I’ve stored this secret somewhere safe
      </label>
      {warned && !stored && (
        <p role="alert" className="text-sm text-error">
          Store the secret before closing. It can’t be shown again.
        </p>
      )}
    </div>
  );
}

/**
 * Adds an endpoint, then shows its signing secret in the same dialog. The secret can't be shown
 * again, so the dialog stays open until the Owner confirms they stored it.
 */
export function AddEndpointDialog({
  open,
  onAdded,
  onClose,
}: {
  open: boolean;
  onAdded: (id: string) => void;
  onClose: () => void;
}) {
  const register = useRegisterEndpoint();
  const formId = useId();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);
  const [stored, setStored] = useState(false);
  const [warned, setWarned] = useState(false);
  const added = register.data;
  const check = checkUrl(url);

  const finish = () => {
    if (added) onAdded(added.id);
    onClose();
  };
  const requestClose = () => {
    if (register.isPending) return;
    if (added && !stored) setWarned(true);
    else finish();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && requestClose()}
      onExited={() => {
        setUrl('');
        setDescription('');
        setTouched(false);
        setStored(false);
        setWarned(false);
        register.reset();
      }}
      title={added ? 'Copy your signing secret' : 'Add endpoint'}
      description={
        added
          ? 'The endpoint is on. This is the only time its secret is shown.'
          : 'OctaP sends every event to this URL as a signed POST request.'
      }
      footer={
        added ? (
          <Button className="btn-primary" disabled={!stored} onClick={finish}>
            Done
          </Button>
        ) : (
          <>
            <Button className="btn-ghost" disabled={register.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              className="btn-primary"
              loading={register.isPending}
            >
              Add endpoint
            </Button>
          </>
        )
      }
    >
      {added ? (
        <SecretReveal
          secret={added.secret}
          stored={stored}
          onStoredChange={setStored}
          warned={warned}
        />
      ) : (
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (check.error || register.isPending) return;
            register.mutate({
              url: url.trim(),
              ...(description.trim() && { description: description.trim() }),
            });
          }}
        >
          <FormField
            label="Endpoint URL"
            hint={check.warning}
            error={touched ? check.error : undefined}
          >
            <TextInput
              value={url}
              invalid={touched && !!check.error}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://api.example.com/octap/webhooks"
              inputMode="url"
              autoComplete="off"
              autoFocus
            />
          </FormField>
          <FormField label="Description" hint="Optional. What this endpoint is for.">
            <TextInput
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Production order service"
              maxLength={200}
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}

/**
 * Replaces an endpoint's signing secret after a warning, then shows the new one. The old secret
 * stops working at once, so the server must switch before the next event.
 */
export function RotateSecretDialog({
  endpoint,
  onClose,
}: {
  endpoint: WebhookEndpoint | null;
  onClose: () => void;
}) {
  const rotate = useRotateSecret();
  const [stored, setStored] = useState(false);
  const [warned, setWarned] = useState(false);
  const rotated = rotate.data;

  if (!rotated)
    return (
      <ConfirmDialog
        open={!!endpoint}
        onOpenChange={(open) => !open && !rotate.isPending && onClose()}
        title="Create a new signing secret?"
        description="The current secret stops working right away. Events sent after this are signed with the new one, so update your server straight after."
        confirmLabel="Create new secret"
        tone="warning"
        loading={rotate.isPending}
        onConfirm={() => endpoint && rotate.mutate(endpoint.id)}
      >
        {endpoint && <code className="font-mono text-sm break-all">{endpoint.url}</code>}
      </ConfirmDialog>
    );

  return (
    <Modal
      open={!!endpoint}
      onOpenChange={(next) => {
        if (next) return;
        if (!stored) setWarned(true);
        else onClose();
      }}
      onExited={() => {
        setStored(false);
        setWarned(false);
        rotate.reset();
      }}
      title="Copy your new signing secret"
      description="This is the only time it is shown. The old secret no longer works."
      footer={
        <Button className="btn-primary" disabled={!stored} onClick={onClose}>
          Done
        </Button>
      }
    >
      <SecretReveal
        secret={rotated.secret}
        stored={stored}
        onStoredChange={setStored}
        warned={warned}
      />
    </Modal>
  );
}

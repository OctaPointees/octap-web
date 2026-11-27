import { useId, useState } from 'react';
import { Check, Copy, Eye, PencilSimpleLine, Warning, type Icon } from 'phosphor-react';
import { Button, Modal, notify } from '@octap/shared/components';
import { TextInput } from '@/components/shared/Controls';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { cn } from '@/utils/cn';
import { useCreateApiKey } from '../hooks/useApiKeys';

type Scope = 'read' | 'write';

const ACCESS: { value: Scope; label: string; hint: string; icon: Icon }[] = [
  {
    value: 'read',
    label: 'Read only',
    hint: 'Check balances, transactions and the points budget.',
    icon: Eye,
  },
  {
    value: 'write',
    label: 'Read and write',
    hint: 'Also earn and redeem points, and reverse transactions.',
    icon: PencilSimpleLine,
  },
];

/** Says "Copied" only once the clipboard has really taken the secret. */
export function CopySecret({ value, noun = 'key' }: { value: string; noun?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (cause) {
      notify.error(cause, `Could not copy the ${noun}. Select it and copy it by hand.`);
    }
  };

  return (
    <Button className="btn-primary btn-sm min-w-24 shrink-0" onClick={() => void copy()}>
      <span className="flex items-center gap-1.5">
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </span>
    </Button>
  );
}

/**
 * Creates a key, then shows its secret in the same dialog. The secret can't be shown again, so the
 * dialog stays open until the user confirms they stored it, and is cleared once it has closed.
 */
export function CreateKeyDialog({
  open,
  onCreated,
  onClose,
}: {
  open: boolean;
  /** Once the secret has been stored and the dialog is closing. */
  onCreated: (id: string) => void;
  onClose: () => void;
}) {
  const { owner } = useOrganization();
  const create = useCreateApiKey();
  const formId = useId();
  const [name, setName] = useState('');
  const [scope, setScope] = useState<Scope>('read');
  const [stored, setStored] = useState(false);
  const [warned, setWarned] = useState(false);
  const issued = create.data;

  const finish = () => {
    if (issued) onCreated(issued.id);
    onClose();
  };
  const requestClose = () => {
    // Closing now could lose a key that has already been created.
    if (create.isPending) return;
    if (issued && !stored) setWarned(true);
    else finish();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && requestClose()}
      onExited={() => {
        setName('');
        setScope('read');
        setStored(false);
        setWarned(false);
        create.reset();
      }}
      title={issued ? 'Copy your API key' : 'Create API key'}
      description={
        issued
          ? `“${issued.name}” is ready. This is the only time the full key is shown.`
          : 'Name it after where it will run, and give it only the access it needs.'
      }
      footer={
        issued ? (
          <Button className="btn-primary" disabled={!stored} onClick={finish}>
            Done
          </Button>
        ) : (
          <>
            <Button className="btn-ghost" disabled={create.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              className="btn-primary"
              disabled={!name.trim()}
              loading={create.isPending}
            >
              Create key
            </Button>
          </>
        )
      }
    >
      {issued ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 rounded-field border border-primary/30 bg-primary/5 p-4">
            <code className="min-w-0 flex-1 font-mono text-sm break-all select-all">
              {issued.rawKey}
            </code>
            <CopySecret value={issued.rawKey} />
          </div>
          <p className="flex items-start gap-2 text-sm opacity-75">
            <Warning size={16} className="mt-0.5 shrink-0" aria-hidden />
            Keep it on your server. Never put it in a browser or mobile app.
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={stored}
              onChange={(event) => setStored(event.target.checked)}
            />
            I’ve stored this key somewhere safe
          </label>
          {warned && !stored && (
            <p role="alert" className="text-sm text-error">
              Store the key before closing. It can’t be shown again.
            </p>
          )}
        </div>
      ) : (
        <form
          id={formId}
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim() && !create.isPending) create.mutate({ name: name.trim(), scope });
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            Key name
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Production backend"
              maxLength={100}
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm">Access</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACCESS.map(({ value, label, hint, icon: AccessIcon }) => {
                const locked = value === 'write' && !owner;
                const selected = scope === value;
                return (
                  <label
                    key={value}
                    className={cn('flex gap-3 rounded-field border p-3 transition-colors', {
                      'border-primary bg-primary/10': selected,
                      'border-base-300': !selected,
                      'cursor-pointer hover:border-base-content/30': !selected && !locked,
                      'cursor-not-allowed opacity-50': locked,
                    })}
                  >
                    <input
                      type="radio"
                      name={`${formId}-access`}
                      className="radio radio-primary radio-sm mt-0.5"
                      checked={selected}
                      disabled={locked}
                      onChange={() => setScope(value)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <AccessIcon size={14} aria-hidden />
                        {label}
                      </span>
                      <span className="mt-0.5 block text-xs opacity-65">
                        {locked ? 'Only the Owner can create a key with write access.' : hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}

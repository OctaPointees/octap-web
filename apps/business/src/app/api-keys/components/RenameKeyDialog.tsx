import { useId, useState } from 'react';
import type { ConsoleCredential } from '@octap/services';
import { Button, Modal } from '@octap/shared/components';
import { TextInput } from '@/components/shared/Controls';
import { useRenameApiKey } from '../hooks/useApiKeys';

/** Renames a key. Stays mounted so it can animate; the name is filled in when a key is opened. */
export function RenameKeyDialog({
  apiKey,
  onClose,
}: {
  apiKey: ConsoleCredential | null;
  onClose: () => void;
}) {
  const rename = useRenameApiKey();
  const formId = useId();
  const [name, setName] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(null);
  if (apiKey && apiKey.id !== openedId) {
    setOpenedId(apiKey.id);
    setName(apiKey.name);
  }
  const trimmed = name.trim();
  const canSave = !!apiKey && !!trimmed && trimmed !== apiKey.name;

  return (
    <Modal
      open={!!apiKey}
      onOpenChange={(next) => !next && onClose()}
      onExited={() => setOpenedId(null)}
      title="Rename API key"
      description="The new name only changes how the key appears here. The key itself keeps working."
      size="sm"
      footer={
        <>
          <Button className="btn-ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="btn-primary"
            disabled={!canSave}
            loading={rename.isPending}
          >
            Save name
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave && !rename.isPending)
            rename.mutate({ id: apiKey.id, name: trimmed }, { onSuccess: onClose });
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Key name
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
          />
        </label>
      </form>
    </Modal>
  );
}

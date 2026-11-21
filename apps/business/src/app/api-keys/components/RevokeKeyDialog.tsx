import { Warning } from 'phosphor-react';
import type { ConsoleCredential } from '@octap/services';
import { ConfirmDialog, useExitValue } from '@octap/shared/components';
import { fmtRelative } from '@/utils/format';
import { isStaleKey } from '../domain/keys';
import { useRevokeApiKey } from '../hooks/useApiKeys';

/** Confirms revoking a key, and warns when something is probably still using it. */
export function RevokeKeyDialog({
  apiKey,
  onClose,
}: {
  apiKey: ConsoleCredential | null;
  onClose: () => void;
}) {
  const revoke = useRevokeApiKey();
  const shown = useExitValue(apiKey);
  const lastUsedAt = shown && !isStaleKey(shown) ? shown.lastUsedAt : null;

  return (
    <ConfirmDialog
      open={!!apiKey}
      title={`Revoke “${shown?.name ?? 'this key'}”?`}
      description="Anything using this key stops working on its next request. You can’t undo this."
      confirmLabel="Revoke key"
      tone="error"
      loading={revoke.isPending}
      onOpenChange={(next) => !next && onClose()}
      onConfirm={() => apiKey && revoke.mutate(apiKey.id, { onSuccess: onClose })}
    >
      {lastUsedAt && (
        <p className="alert alert-warning alert-soft text-sm">
          <Warning size={16} aria-hidden />
          This key was used {fmtRelative(lastUsedAt)}, so something may still depend on it.
        </p>
      )}
    </ConfirmDialog>
  );
}

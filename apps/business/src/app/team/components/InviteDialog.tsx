import { useState } from 'react';
import { format } from 'date-fns';
import { Button, Modal } from '@octap/shared/components';
import { CopyButton, FormField, TextInput } from '@/components/shared/Controls';
import { useInviteDeveloper } from '../hooks/useTeam';

/**
 * Invites a Developer by email, then shows the one-time invitation link to send them. Core does
 * not email it, and the link is shown only here, so it is shown until the dialog closes.
 */
export function InviteDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Once the link has been shown and the dialog is closing. */
  onInvited: (id: string) => void;
}) {
  const invite = useInviteDeveloper();
  const [email, setEmail] = useState('');
  const created = invite.data;
  const link = created ? `${window.location.origin}/?invitation=${created.token}` : '';

  const close = (next: boolean) => {
    if (!next && created) onInvited(created.id);
    onOpenChange(next);
  };
  // After the close animation, so the link doesn't flip back to the form as it slides away.
  const reset = () => {
    setEmail('');
    invite.reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      onExited={reset}
      title={created ? 'Invitation created' : 'Invite a Developer'}
      description={
        created
          ? `Send this link to ${created.email}. It works once, for that Google account, until ${format(new Date(created.expiresAt), 'PP')}.`
          : 'They join as a Developer: API keys and integrations, read-only rewards and members.'
      }
      footer={
        created ? (
          <Button className="btn-primary" onClick={() => close(false)}>
            Done
          </Button>
        ) : (
          <>
            <Button className="btn-ghost" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="invite-developer"
              className="btn-primary"
              loading={invite.isPending}
            >
              Send invitation
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="flex items-center gap-2 rounded-field border border-base-300 bg-base-200/60 p-2">
          <input
            aria-label="Invitation link"
            className="min-w-0 flex-1 bg-transparent px-1 font-mono text-sm outline-none"
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
          />
          <CopyButton value={link} label="Copy" />
        </div>
      ) : (
        <form
          id="invite-developer"
          onSubmit={(event) => {
            event.preventDefault();
            invite.mutate(email.trim());
          }}
        >
          <FormField label="Developer email" hint="Use the Google account they sign in with.">
            <TextInput
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}

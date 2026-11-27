import { useState } from 'react';
import { LockSimple, Plus } from 'phosphor-react';
import { Button, useRowFlash } from '@octap/shared/components';
import { EmptyState, PageHeader } from '@/components/shared/Display';
import { useOrganization } from '@/app/organization/hooks/useOrganization';
import { useTeam } from './hooks/useTeam';
import { InvitationsCard } from './components/InvitationsCard';
import { InviteDialog } from './components/InviteDialog';
import { MembersCard } from './components/MembersCard';

/**
 * The organization's members and Developer invitations. Core lets only the Owner read or change
 * them, so anyone else sees why the section is closed instead of a failed request.
 */
export default function TeamPage() {
  const { owner } = useOrganization();
  const { staff, invitations } = useTeam();
  const [inviting, setInviting] = useState(false);
  const { flashRow, isFlashing } = useRowFlash();

  return (
    <>
      <PageHeader
        title="Team"
        description="Who can open this organization in OctaP, and the Developers you've invited."
        actions={
          owner && (
            <Button className="btn-primary btn-sm" onClick={() => setInviting(true)}>
              <Plus size={16} className="mr-1.5" /> Invite Developer
            </Button>
          )
        }
      />

      {owner ? (
        <div className="flex flex-col gap-6">
          <MembersCard
            members={staff.data}
            loading={staff.isPending}
            error={staff.error}
            onRetry={() => void staff.refetch()}
          />
          <InvitationsCard
            invitations={invitations.data}
            loading={invitations.isPending}
            error={invitations.error}
            onRetry={() => void invitations.refetch()}
            isHighlighted={isFlashing}
          />
          <InviteDialog open={inviting} onOpenChange={setInviting} onInvited={flashRow} />
        </div>
      ) : (
        <EmptyState
          icon={LockSimple}
          title="You can't view this section"
          description="Only the organization's Owner can see and manage its team and invitations."
        />
      )}
    </>
  );
}

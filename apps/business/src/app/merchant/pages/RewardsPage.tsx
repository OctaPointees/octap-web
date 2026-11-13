import { Ticket } from 'phosphor-react';
import { useConsoleAuth } from '@octap/shared/google-auth';
import { EmptyState, PageHeader } from '@/components/shared/Display';
import ConnectedRewards from '../../console/Rewards';

/** Rewards live in Core: there is no browser-local demo of them. */
export default function RewardsPage() {
  const auth = useConsoleAuth();
  if (auth) return <ConnectedRewards key={auth.organizationId} />;
  return (
    <>
      <PageHeader title="Rewards" description="Vouchers your members claim with points." />
      <EmptyState
        icon={Ticket}
        title="Rewards need a live organization"
        description="Sign in with Google to create and manage rewards in OctaP Core. Demo mode has no sample rewards."
      />
    </>
  );
}

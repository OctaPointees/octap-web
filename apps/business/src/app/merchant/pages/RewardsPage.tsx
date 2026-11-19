import { useOrganization } from '@/app/organization/hooks/useOrganization';
import ConnectedRewards from '../../console/Rewards';

/** Rewards live in Core. Remounts per organization so nothing carries over between them. */
export default function RewardsPage() {
  const { organizationId } = useOrganization();
  return <ConnectedRewards key={organizationId} />;
}

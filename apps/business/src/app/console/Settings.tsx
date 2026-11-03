import { useLocation } from 'react-router';
import { ConsoleScreen } from '@octap/shared/google-auth';
import { PageHeader } from '@/components/shared/Display';
export default function ConnectedSettings() {
  const location = useLocation();
  return (
    <>
      <PageHeader
        title={
          location.pathname.endsWith('/team') ? 'Team and invitations' : 'Organization settings'
        }
        description="Manage your organization with your persisted Business Owner permissions."
      />
      <ConsoleScreen />
    </>
  );
}

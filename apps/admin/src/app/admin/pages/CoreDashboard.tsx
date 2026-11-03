import { useConsoleAuth } from '@octap/shared/google-auth';
import { Buildings, ShieldCheck, UsersThree } from 'phosphor-react';
import { PageHeader, StatCard } from '../../../components/shared/Display';
export default function CoreDashboard() {
  const auth = useConsoleAuth();
  const requests = auth?.data.applications;
  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${auth?.identity?.user.fullName ?? ''}`}
        description="Platform organization onboarding and review."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pending requests"
          value={requests ? requests.filter((row) => row.status === 'PENDING').length : '—'}
          icon={Buildings}
          hint="Within the latest 100 requests"
        />
        <StatCard
          label="Approved requests"
          value={requests ? requests.filter((row) => row.status === 'APPROVED').length : '—'}
          icon={ShieldCheck}
          hint="Within the latest 100 requests"
        />
        <StatCard label="Your access" value="System Admin" icon={UsersThree} />
      </div>
    </>
  );
}

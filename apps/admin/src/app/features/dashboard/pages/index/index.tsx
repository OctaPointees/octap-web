import { DashboardOverview } from './components/DashboardOverview';
import { SystemUsage } from './components/SystemUsage';

export function IndexPages() {
  return (
    <div className="screen-wrapper flex flex-col gap-4 mt-4 xl:flex-row">
      <SystemUsage />
      <DashboardOverview />
    </div>
  );
}

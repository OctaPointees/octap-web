import { DashboardOverview } from './components/DashboardOverview';
import { PlatformHealth } from './components/PlatformHealth';

export function IndexPages() {
  return (
    <div className="screen-wrapper flex flex-col gap-4 mt-4 xl:flex-row">
      <PlatformHealth />
      <DashboardOverview />
    </div>
  );
}

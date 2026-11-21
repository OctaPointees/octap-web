import { useFocus } from '@/app/workspace/focus';
import { BusinessDashboard } from './components/BusinessDashboard';
import { DeveloperDashboard } from './components/DeveloperDashboard';

/** The organization's dashboard, for the current sidebar focus. */
export default function DashboardPage() {
  return useFocus() === 'developer' ? <DeveloperDashboard /> : <BusinessDashboard />;
}

import { Outlet } from 'react-router-dom';
import TransitionProvider from '../components/TransitionProvider';
export default function RootLayout() {
  return (
    <TransitionProvider>
      <Outlet />
    </TransitionProvider>
  );
}

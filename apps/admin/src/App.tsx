import { RouterProvider } from 'react-router';
import { AppProviders } from './app/providers';
import { router } from './app/router';

export default function AdminApp() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

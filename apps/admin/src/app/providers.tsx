import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToasterProvider } from '../components/shared/Toaster';
import { queryClient } from '../queries/client';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToasterProvider>{children}</ToasterProvider>
    </QueryClientProvider>
  );
}

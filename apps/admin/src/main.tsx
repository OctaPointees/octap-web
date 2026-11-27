import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router';
import { createRoot } from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@octap/shared/authentication';

import './index.css';
import App from './app';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider
          portal="admin"
          clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}
          apiBaseUrl={import.meta.env.VITE_CORE_API_URL ?? ''}
          onSessionEnd={() => queryClient.clear()}
        >
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

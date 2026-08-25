import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { I18nProvider } from '@/contexts/i18nContext';
import { CommandPalette } from '@/components/shared/CommandPalette';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <BranchProvider>
              <SidebarProvider>
                <App />
                <CommandPalette />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      color: '#0F172A',
                      backdropFilter: 'blur(12px)',
                    },
                  }}
                />
              </SidebarProvider>
            </BranchProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

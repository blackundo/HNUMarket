'use client';

import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import { Toaster } from 'sonner';
import { dataProvider } from '@/lib/refine/data-provider';
import { authProvider } from '@/lib/refine/auth-provider';
import { notificationProvider } from './notification-provider';
import { resources } from './resources';

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <RefineKbarProvider>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        notificationProvider={notificationProvider}
        resources={resources}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          projectId: 'hnumarket-admin',
        }}
      >
        {children}
        <RefineKbar />
        <Toaster position="top-right" richColors />
      </Refine>
    </RefineKbarProvider>
  );
}


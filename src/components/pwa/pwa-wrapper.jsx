"use client";

import { PWAProvider } from '@/contexts/pwa-context';
import { PWAComponents } from '@/components/pwa/pwa-components';
import { Toaster } from '@/components/ui/sonner';

/**
 * Wrapper client pour PWAProvider et composants PWA
 * À utiliser dans les layouts serveur
 */
export function PWAWrapper({ children }) {
  return (
    <PWAProvider>
      {children}
      <PWAComponents />
      <Toaster richColors position="top-right" />
    </PWAProvider>
  );
}


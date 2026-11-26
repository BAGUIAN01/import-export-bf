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
      <Toaster
        richColors
        position="top-right"
        // Hors de l'encoche, de la barre d'état et des bords arrondis
        offset={{ top: "max(16px, env(safe-area-inset-top))", right: "max(16px, env(safe-area-inset-right))" }}
        mobileOffset={{ top: "max(12px, env(safe-area-inset-top))", left: "max(12px, env(safe-area-inset-left))", right: "max(12px, env(safe-area-inset-right))" }}
      />
    </PWAProvider>
  );
}


"use client";

import { PWAInstallPrompt }      from "./install-prompt";
import { PWAUpdateNotification } from "./update-notification";
import { PWAOfflineIndicator }   from "./offline-indicator";

/**
 * Composant racine — à placer une seule fois dans le root layout.
 * Regroupe tous les composants PWA UI.
 */
export function PWAComponents() {
  return (
    <>
      <PWAOfflineIndicator />
      <PWAUpdateNotification />
      <PWAInstallPrompt />
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePWA } from "@/contexts/pwa-context";

const TOAST_ID = "pwa-offline-status";

export function PWAOfflineIndicator() {
  const { isOnline } = usePWA();
  const prevOnlineRef = useRef(true);

  useEffect(() => {
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (!isOnline) {
      /* Hors ligne */
      toast.warning("Vous êtes hors ligne", {
        id:          TOAST_ID,
        description: "Vous utilisez la version mise en cache.",
        duration:    Infinity,
        dismissible: false,
      });
    } else if (!wasOnline && isOnline) {
      /* Connexion rétablie */
      toast.success("Connexion rétablie", {
        id:          TOAST_ID,
        description: "Vous êtes de nouveau en ligne.",
        duration:    3000,
      });
    }
  }, [isOnline]);

  return null; /* Rendu via Toaster dans le layout */
}

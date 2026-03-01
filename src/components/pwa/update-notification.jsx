"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { usePWA } from "@/contexts/pwa-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PWAUpdateNotification() {
  const { updateAvailable, applyUpdate } = usePWA();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (updateAvailable) setVisible(true);
  }, [updateAvailable]);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => { setVisible(false); setLeaving(false); }, 300);
  }

  async function handleUpdate() {
    setUpdating(true);
    applyUpdate();
    /* La page se rechargera automatiquement via applyUpdate */
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md",
        "transition-all duration-300 ease-out",
        leaving
          ? "opacity-0 -translate-y-3 pointer-events-none"
          : "opacity-100 translate-y-0"
      )}
    >
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-2xl text-white overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Mise à jour disponible</p>
            <p className="text-xs text-orange-100 mt-0.5">
              Une nouvelle version de l'application est prête.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-3 bg-white text-orange-600 hover:bg-orange-50 text-xs font-semibold gap-1.5"
              onClick={handleUpdate}
              disabled={updating}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", updating && "animate-spin")} />
              {updating ? "…" : "Mettre à jour"}
            </Button>
            <button
              onClick={dismiss}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { usePWA } from "@/contexts/pwa-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PWAInstallPrompt() {
  const { canInstall, showInstall, isInstalling, promptInstall, dismissInstall } = usePWA();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  /* Animer l'apparition / disparition */
  useEffect(() => {
    if (showInstall && canInstall) {
      setVisible(true);
    } else {
      leave();
    }
  }, [showInstall, canInstall]);

  function leave() {
    setLeaving(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, 300);
    return () => clearTimeout(timer);
  }

  async function handleInstall() {
    await promptInstall();
    leave();
  }

  function handleDismiss() {
    dismissInstall(false);
    leave();
  }

  function handleNeverAgain() {
    dismissInstall(true);
    leave();
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm",
        "transition-all duration-300 ease-in-out",
        leaving
          ? "opacity-0 translate-y-4 pointer-events-none"
          : "opacity-100 translate-y-0"
      )}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">
        {/* Bande orange top */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Icône app */}
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 shrink-0 flex items-center justify-center bg-orange-50">
              <img
                src="/logo_short-96x96.png"
                alt="IE BF"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling.style.display = "flex";
                }}
              />
              <Smartphone className="hidden h-6 w-6 text-orange-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 text-sm leading-tight">
                Installer l'application
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Import Export BF
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-zinc-600 transition-colors shrink-0 -mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
            Accédez rapidement à la caisse et aux expéditions — même sans connexion.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs text-zinc-500 hover:text-zinc-700"
              onClick={handleNeverAgain}
            >
              Ne plus afficher
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs"
              onClick={handleInstall}
              disabled={isInstalling}
            >
              <Download className="h-3.5 w-3.5" />
              {isInstalling ? "Installation…" : "Installer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

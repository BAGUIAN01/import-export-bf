"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";

/* ── Constantes ────────────────────────────────────────────── */
const DISMISS_KEY   = "iebf-pwa-install-dismissed";
const DISMISS_DAYS  = 30;
const SHOW_DELAY_MS = 20_000; // 20 secondes avant de proposer l'install

/* ── Context ───────────────────────────────────────────────── */
const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [isOnline,        setIsOnline]        = useState(true);
  const [swReg,           setSwReg]           = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt,  setDeferredPrompt]  = useState(null);
  const [isInstalled,     setIsInstalled]     = useState(false);
  const [isInstalling,    setIsInstalling]    = useState(false);
  const [showInstall,     setShowInstall]     = useState(false);
  const [cacheSize,       setCacheSize]       = useState(null);
  const showTimerRef = useRef(null);

  /* ── Online / Offline ── */
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ── Install Prompt ── */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  /* ── Déjà installé ? ── */
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    if (mq.matches) setIsInstalled(true);
    const handler = (e) => setIsInstalled(e.matches);
    mq.addEventListener("change", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstall(false);
    });
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Afficher le prompt après délai ── */
  useEffect(() => {
    if (!deferredPrompt || isInstalled) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const until = parseInt(dismissed, 10);
      if (Date.now() < until) return; // Encore dans la période de dismiss
    }

    showTimerRef.current = setTimeout(() => setShowInstall(true), SHOW_DELAY_MS);
    return () => clearTimeout(showTimerRef.current);
  }, [deferredPrompt, isInstalled]);

  /* ── Service Worker ── */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setSwReg(reg);
        reg.update();

        /* Écoute les nouvelles versions */
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });

        /* Vérification périodique (toutes les 60 min) */
        const interval = setInterval(() => reg.update(), 60 * 60 * 1000);
        return () => clearInterval(interval);
      })
      .catch((err) => console.warn("[SW] Enregistrement échoué :", err));

    /* Messages du SW */
    const onMessage = (event) => {
      if (event.data?.type === "SYNC_SUCCESS") {
        /* Notification sync réussie */
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  /* ── Installer l'app ── */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstall(false);
        return true;
      }
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  /* ── Fermer le prompt install ── */
  const dismissInstall = useCallback((permanent = false) => {
    setShowInstall(false);
    if (permanent) {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    }
  }, []);

  /* ── Appliquer la mise à jour ── */
  const applyUpdate = useCallback(() => {
    if (!swReg?.waiting) return;
    swReg.waiting.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }, [swReg]);

  /* ── Vider le cache ── */
  const clearCache = useCallback(async () => {
    if (!swReg) return;
    swReg.active?.postMessage({ type: "CLEAR_ALL_CACHES" });
  }, [swReg]);

  /* ── Taille du cache ── */
  const refreshCacheSize = useCallback(async () => {
    if (!("storage" in navigator && "estimate" in navigator.storage)) return;
    const { usage, quota } = await navigator.storage.estimate();
    setCacheSize({ usage, quota });
  }, []);

  /* ── Demander la permission push ── */
  const requestPushPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    const result = await Notification.requestPermission();
    return result;
  }, []);

  /* ── Enregistrer Periodic Background Sync ── */
  useEffect(() => {
    if (!swReg || !("periodicSync" in swReg)) return;
    swReg.periodicSync?.register("refresh-data", { minInterval: 60 * 60 * 1000 }).catch(() => {});
  }, [swReg]);

  return (
    <PWAContext.Provider
      value={{
        /* État réseau */
        isOnline,
        /* Installation */
        isInstalled,
        canInstall:   !!deferredPrompt && !isInstalled,
        isInstalling,
        showInstall,
        promptInstall,
        dismissInstall,
        /* Mise à jour */
        updateAvailable,
        applyUpdate,
        /* Cache */
        cacheSize,
        refreshCacheSize,
        clearCache,
        /* Notifications push */
        pushPermission: typeof window !== "undefined" && "Notification" in window
          ? Notification.permission
          : "default",
        requestPushPermission,
        /* SW */
        swRegistration: swReg,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error("usePWA doit être utilisé dans <PWAProvider>");
  return ctx;
}

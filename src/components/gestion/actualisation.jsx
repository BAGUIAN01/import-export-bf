"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ficheCourante } from "@/components/gestion/barre-gestion";
import { useSWRConfig } from "swr";
import { ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { vibrer } from "@/lib/vibrer";

const SEUIL = 64; // px à tirer pour actualiser
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const ContexteActualisation = createContext({ version: 0, actualiser: async () => {} });

/**
 * `version` change à chaque actualisation : les pages qui chargent leurs
 * données dans un effet l'ajoutent à ses dépendances.
 */
export const useActualisation = () => useContext(ContexteActualisation);

/**
 * Zone qui défile et s'actualise quand on la tire vers le bas depuis le haut
 * (comme une application). `onActualiser` peut renvoyer une promesse : la
 * roue tourne jusqu'à sa fin.
 */
export function ZoneActualisable({ as: Balise = "div", onActualiser, zoneRef, className, children, ...props }) {
  const zone = useRef(null);
  const rappel = useRef(onActualiser);
  const [tirage, setTirage] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [aLaMain, setALaMain] = useState(false);
  const geste = useRef({ y0: null, tirage: 0, enCours: false });

  useEffect(() => {
    rappel.current = onActualiser;
  }, [onActualiser]);

  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const debut = (e) => {
      geste.current.y0 = !geste.current.enCours && el.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
    };
    const bouge = (e) => {
      const y0 = geste.current.y0;
      if (y0 == null) return;
      const dy = e.touches[0].clientY - y0;
      if (dy <= 0 || el.scrollTop > 0) {
        if (geste.current.tirage) {
          geste.current.tirage = 0;
          setTirage(0);
        }
        return;
      }
      e.preventDefault(); // pas de défilement ni de rebond pendant qu'on tire
      const t = Math.min(SEUIL * 1.6, dy * 0.5);
      if (!geste.current.tirage) setALaMain(true);
      geste.current.tirage = t;
      setTirage(t);
    };
    const fin = async () => {
      if (geste.current.y0 == null) return;
      geste.current.y0 = null;
      const t = geste.current.tirage;
      geste.current.tirage = 0;
      setALaMain(false);
      if (t < SEUIL || !rappel.current) {
        setTirage(0);
        return;
      }
      geste.current.enCours = true;
      setEnCours(true);
      setTirage(SEUIL);
      vibrer();
      try {
        await Promise.all([Promise.resolve(rappel.current()).catch(() => {}), pause(650)]);
      } finally {
        geste.current.enCours = false;
        setEnCours(false);
        setTirage(0);
      }
    };
    el.addEventListener("touchstart", debut, { passive: true });
    el.addEventListener("touchmove", bouge, { passive: false });
    el.addEventListener("touchend", fin);
    el.addEventListener("touchcancel", fin);
    return () => {
      el.removeEventListener("touchstart", debut);
      el.removeEventListener("touchmove", bouge);
      el.removeEventListener("touchend", fin);
      el.removeEventListener("touchcancel", fin);
    };
  }, []);

  const transition = aLaMain ? "none" : "transform .22s ease, opacity .22s ease";
  const pret = tirage >= SEUIL;

  return (
    <Balise
      ref={(el) => {
        zone.current = el;
        if (zoneRef) zoneRef.current = el;
      }}
      className={cn("relative", className)}
      {...props}
    >
      <div className="pointer-events-none sticky top-0 z-30 flex h-0 justify-center">
        <span
          role="status"
          aria-live="polite"
          className="grid size-10 place-items-center rounded-full border border-line bg-white text-brand-strong shadow-[0_4px_14px_rgba(15,23,20,.14)]"
          style={{ transform: `translateY(${tirage - 46}px)`, opacity: tirage ? Math.min(1, tirage / 32) : 0, transition }}
        >
          {enCours ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Actualisation…</span>
            </>
          ) : (
            <ArrowDown className="size-5 transition-transform" style={{ transform: `rotate(${pret ? 180 : 0}deg)` }} aria-hidden="true" />
          )}
        </span>
      </div>
      <div style={tirage ? { transform: `translateY(${tirage * 0.6}px)`, transition } : { transition }}>{children}</div>
    </Balise>
  );
}

/**
 * Contenu d'une coquille de module (gestion) : tirer pour actualiser, et
 * données fraîches au retour dans l'application après plus d'une minute.
 * Actualiser = pages serveur (router.refresh), cache SWR, pages à effet (version).
 */
const CLE_POSITIONS = "positions:gestion";
function lirePositions() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CLE_POSITIONS) || "{}");
  } catch {
    return {};
  }
}

/**
 * Position de défilement de chaque liste, gardée pendant la session et
 * restaurée au retour (depuis une fiche ou un autre onglet), comme dans une
 * application. Les données arrivent après l'affichage : on réessaie jusqu'à
 * 2,5 s, sauf si l'utilisateur touche l'écran entre-temps.
 */
function usePositionListes(zone) {
  const chemin = usePathname() || "";

  // Position notée au moment du toucher (avant la navigation) : pendant le
  // changement de page, le navigateur rabote le défilement et fausserait la mesure.
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const noter = () => {
      const positions = lirePositions();
      positions[chemin] = Math.round(el.scrollTop);
      try {
        window.sessionStorage.setItem(CLE_POSITIONS, JSON.stringify(positions));
      } catch {
        /* stockage indisponible */
      }
    };
    document.addEventListener("click", noter, true);
    return () => document.removeEventListener("click", noter, true);
  }, [zone, chemin]);

  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const cible = ficheCourante(chemin) ? 0 : lirePositions()[chemin] || 0;
    el.scrollTop = 0;
    if (!cible) return;
    let fini = false;
    const debut = performance.now();
    const arreter = () => {
      fini = true;
    };
    el.addEventListener("touchstart", arreter, { passive: true });
    el.addEventListener("wheel", arreter, { passive: true });
    const essayer = () => {
      if (fini) return;
      el.scrollTop = cible;
      if (Math.abs(el.scrollTop - cible) < 2 || performance.now() - debut > 2500) return;
      requestAnimationFrame(essayer);
    };
    essayer();
    return () => {
      fini = true;
      el.removeEventListener("touchstart", arreter);
      el.removeEventListener("wheel", arreter);
    };
  }, [zone, chemin]);
}

/**
 * Animation d'arrivée d'une page, comme une application : une fiche glisse
 * depuis la droite, le retour depuis la gauche, un changement d'onglet en
 * fondu. Rien si le téléphone demande moins d'animations (CSS).
 */
function useAnimationPage() {
  const chemin = usePathname() || "";
  const precedent = useRef(chemin);
  const parHistorique = useRef(false);
  useEffect(() => {
    const surRetour = () => {
      parHistorique.current = true;
    };
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);
  const animation = useMemo(() => {
    const avant = precedent.current;
    if (avant === chemin) return "";
    const ficheAvant = !!ficheCourante(avant);
    const fiche = !!ficheCourante(chemin);
    if (fiche && !ficheAvant && !parHistorique.current) return "page-pousser";
    if ((ficheAvant && !fiche) || parHistorique.current) return "page-retour";
    return "page-fondu";
  }, [chemin]);
  useEffect(() => {
    precedent.current = chemin;
    parHistorique.current = false;
  }, [chemin]);
  return { chemin, animation };
}

export function ContenuActualisable({ className, children }) {
  const router = useRouter();
  const zone = useRef(null);
  usePositionListes(zone);
  const { chemin, animation } = useAnimationPage();
  const { mutate } = useSWRConfig();
  const [version, setVersion] = useState(0);

  const actualiser = useCallback(async () => {
    setVersion((v) => v + 1);
    router.refresh();
    await mutate(() => true).catch(() => {});
  }, [router, mutate]);

  useEffect(() => {
    let cache = 0;
    const surVisibilite = () => {
      if (document.hidden) cache = Date.now();
      else if (cache && Date.now() - cache > 60_000) actualiser();
    };
    document.addEventListener("visibilitychange", surVisibilite);
    // Retour du réseau : données fraîches
    window.addEventListener("online", actualiser);
    return () => {
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("online", actualiser);
    };
  }, [actualiser]);

  return (
    <ContexteActualisation.Provider value={{ version, actualiser }}>
      <ZoneActualisable as="main" zoneRef={zone} className={className} onActualiser={actualiser}>
        <div key={chemin} className={animation}>
          {children}
        </div>
      </ZoneActualisable>
    </ContexteActualisation.Provider>
  );
}

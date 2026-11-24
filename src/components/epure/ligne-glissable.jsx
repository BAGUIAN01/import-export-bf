"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FeuilleActions } from "@/components/gestion/barre-actions";
import { vibrer } from "@/lib/vibrer";
import { cn } from "@/lib/utils";

const LARGEUR = 80; // px par action révélée
const TONS = { vert: "bg-brand", bleu: "bg-[#2563EB]", rouge: "bg-danger", ambre: "bg-alerte", gris: "bg-[#5B6B64]" };

/**
 * Ligne de liste comme dans une application : la glisser vers la gauche
 * révèle ses actions ; un appui long (ou un clic droit) les ouvre dans une
 * feuille. Une seule ligne ouverte à la fois ; toucher une ligne ouverte la
 * referme. Une action `confirmation` passe par la feuille avant d'agir.
 * `actions` : [{ libelle, court?, icone, ton?, danger?, onClick, confirmation? }].
 */
export function LigneGlissable({ actions = [], titre, children }) {
  const id = useId();
  const ligne = useRef(null);
  const decalage = useRef(0);
  const geste = useRef({});
  const [dx, setDx] = useState(0);
  const [aLaMain, setALaMain] = useState(false);
  const [menu, setMenu] = useState(null); // null | { confirmer }
  const largeur = actions.length * LARGEUR;
  const ouvert = dx < 0;

  const placer = (v) => {
    decalage.current = v;
    setDx(v);
  };

  // Une autre ligne s'ouvre : celle-ci se referme
  useEffect(() => {
    const autre = (e) => e.detail !== id && decalage.current !== 0 && placer(0);
    window.addEventListener("ligne:ouverte", autre);
    return () => window.removeEventListener("ligne:ouverte", autre);
  }, [id]);

  useEffect(() => {
    const el = ligne.current;
    if (!el || !largeur) return;
    const debut = (e) => {
      const t = e.touches[0];
      clearTimeout(geste.current.appui);
      geste.current = {
        x0: t.clientX,
        y0: t.clientY,
        dx0: decalage.current,
        axe: null,
        bouge: false,
        long: false,
        appui: setTimeout(() => {
          if (geste.current.bouge) return;
          geste.current.long = true;
          vibrer();
          placer(0);
          setMenu({ confirmer: null });
        }, 480),
      };
    };
    const bouge = (e) => {
      const g = geste.current;
      const t = e.touches[0];
      const ddx = t.clientX - g.x0;
      const ddy = t.clientY - g.y0;
      if (!g.bouge && Math.hypot(ddx, ddy) > 8) {
        g.bouge = true;
        clearTimeout(g.appui);
        g.axe = Math.abs(ddx) > Math.abs(ddy) ? "x" : "y";
      }
      if (g.axe !== "x") return;
      e.preventDefault(); // pas de défilement pendant qu'on glisse
      let v = g.dx0 + ddx;
      if (v > 0) v *= 0.2;
      if (v < -largeur) v = -largeur + (v + largeur) * 0.25;
      setALaMain(true);
      placer(v);
    };
    const fin = (e) => {
      const g = geste.current;
      clearTimeout(g.appui);
      // Après un appui long, le navigateur enverrait un clic là où est le doigt :
      // il tomberait sur le voile de la feuille qui vient de s'ouvrir et la fermerait.
      if (g.long) {
        if (e.cancelable) e.preventDefault();
        g.long = false;
        return;
      }
      if (g.axe !== "x") return;
      const ouvrir = decalage.current < -Math.min(56, largeur / 2);
      setALaMain(false);
      placer(ouvrir ? -largeur : 0);
      if (ouvrir) {
        vibrer();
        window.dispatchEvent(new CustomEvent("ligne:ouverte", { detail: id }));
      }
    };
    el.addEventListener("touchstart", debut, { passive: true });
    el.addEventListener("touchmove", bouge, { passive: false });
    el.addEventListener("touchend", fin, { passive: false });
    el.addEventListener("touchcancel", fin);
    return () => {
      clearTimeout(geste.current.appui);
      el.removeEventListener("touchstart", debut);
      el.removeEventListener("touchmove", bouge);
      el.removeEventListener("touchend", fin);
      el.removeEventListener("touchcancel", fin);
    };
  }, [largeur, id]);

  if (!largeur) return children;

  function lancer(a) {
    placer(0);
    if (a.confirmation) setMenu({ confirmer: a });
    else a.onClick?.();
  }

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 flex" style={{ width: largeur }} aria-hidden={!ouvert}>
          {actions.map((a) => {
            const Icone = a.icone;
            return (
              <button
                key={a.libelle}
                type="button"
                tabIndex={ouvert ? 0 : -1}
                onClick={() => lancer(a)}
                className={cn("flex w-20 flex-col items-center justify-center gap-1 text-xs font-semibold text-white", TONS[a.ton || (a.danger ? "rouge" : "gris")])}
              >
                {Icone && <Icone className="size-5" aria-hidden="true" />}
                {a.court || a.libelle}
              </button>
            );
          })}
        </div>
        <div
          ref={ligne}
          onClickCapture={(e) => {
            // Ligne ouverte ou appui long : le toucher referme, n'ouvre pas la fiche
            if (decalage.current !== 0 || geste.current.long) {
              e.stopPropagation();
              e.preventDefault();
              geste.current.long = false;
              placer(0);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ confirmer: null });
          }}
          className="relative bg-white"
          style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: aLaMain ? "none" : "transform .22s cubic-bezier(.2,.8,.2,1)" }}
        >
          {children}
        </div>
      </div>
      <FeuilleActions ouvert={!!menu} onFermer={() => setMenu(null)} titre={titre} actions={actions} confirmer={menu?.confirmer || null} />
    </>
  );
}

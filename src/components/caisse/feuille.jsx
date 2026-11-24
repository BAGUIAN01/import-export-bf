"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Feuille de la caisse : remonte du bas en portrait (tablette tenue à la
 * main), boîte centrée en paysage. Échap ou un toucher sur le voile ferment.
 */
export function Feuille({ ouvert, onFermer, titre, sousTitre, largeur = "max-w-lg", children, pied, className }) {
  const idTitre = useId();
  const boite = useRef(null);

  useEffect(() => {
    if (!ouvert) return;
    const precedent = document.activeElement;
    const surTouche = (e) => {
      if (e.key === "Escape") onFermer?.();
    };
    document.addEventListener("keydown", surTouche);
    // Focus dans la feuille (sans ouvrir le clavier du système sur tablette)
    boite.current?.focus();
    return () => {
      document.removeEventListener("keydown", surTouche);
      if (precedent instanceof HTMLElement) precedent.focus();
    };
  }, [ouvert, onFermer]);

  if (!ouvert || typeof document === "undefined") return null;

  return createPortal(
    <div className="caisse fixed inset-0 z-50 flex items-end justify-center lg:items-center font-caisse text-ink">
      <div aria-hidden="true" className="absolute inset-0 bg-ink/45" onClick={onFermer} />
      <section
        ref={boite}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-[22px] bg-white shadow-2xl outline-none",
          "lg:mx-4 lg:rounded-[22px]",
          largeur,
          className
        )}
      >
        <header className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={idTitre} className="text-xl font-semibold leading-tight">
              {titre}
            </h2>
            {sousTitre && <p className="mt-0.5 text-sm text-ink-muted">{sousTitre}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-xl text-ink-muted hover:bg-surface-muted"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {pied && <footer className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{pied}</footer>}
      </section>
    </div>,
    document.body
  );
}

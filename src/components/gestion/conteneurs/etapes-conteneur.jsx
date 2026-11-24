"use client";

import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { FeuilleEtape } from "@/components/gestion/conteneurs/feuille-etape";
import { ETAPES_CONTENEUR, ETAPES_DETAIL } from "@/lib/conteneurs";
import { cn } from "@/lib/utils";

const jourMois = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null);

/**
 * Frise des étapes d'un conteneur, à toucher : Chargement, Fermé, Parti,
 * Douane, Arrivé. Toucher une étape la renseigne (date, plomb, lieu, message
 * du suivi) ; « Point de suivi » ajoute une position sans changer l'étape.
 */
export function EtapesConteneur({ conteneur, onFait, peutModifier = true, compact = false }) {
  const [cible, setCible] = useState(undefined); // undefined : fermé ; null : point de suivi ; statut : étape
  const actuel = ETAPES_CONTENEUR.indexOf(conteneur.status);
  const dates = { IN_TRANSIT: conteneur.actualDeparture, DELIVERED: conteneur.actualArrival };

  return (
    <div className={cn("flex flex-col gap-2", compact ? "" : "sm:flex-row sm:items-stretch")}>
      <ol aria-label="Étapes du conteneur" className="grid min-w-0 flex-1 grid-cols-5 gap-1 rounded-2xl bg-surface-muted p-1">
        {ETAPES_CONTENEUR.map((s, i) => {
          const fait = i < actuel;
          const enCours = i === actuel;
          return (
            <li key={s} className="min-w-0">
              <button
                type="button"
                disabled={!peutModifier || enCours}
                aria-current={enCours ? "step" : undefined}
                onClick={() => setCible(s)}
                className={cn(
                  "flex h-full min-h-[60px] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center disabled:cursor-default",
                  enCours ? "bg-brand text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]" : fait ? "bg-white text-brand-strong" : "text-ink-muted hover:bg-white"
                )}
              >
                <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight tracking-tight sm:text-[13px] sm:tracking-normal">
                  {fait && <Check className="hidden size-3.5 sm:block" strokeWidth={3} aria-hidden="true" />}
                  {ETAPES_DETAIL[s].court}
                </span>
                {dates[s] && <span className={cn("chiffres text-[11px]", enCours ? "text-white/80" : "text-ink-subtle")}>{jourMois(dates[s])}</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {peutModifier && (
        <button
          type="button"
          onClick={() => setCible(null)}
          className="flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold hover:bg-surface-muted"
        >
          <MapPin className="size-4" aria-hidden="true" />
          Point de suivi
        </button>
      )}
      {cible !== undefined && (
        <FeuilleEtape
          conteneur={conteneur}
          cible={cible}
          onFermer={() => setCible(undefined)}
          onFait={(maj) => {
            setCible(undefined);
            onFait?.(maj);
          }}
        />
      )}
    </div>
  );
}

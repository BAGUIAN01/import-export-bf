"use client";

import { useState } from "react";
import { EyeOff, MapPin, Plus } from "lucide-react";
import { Bloc, SECONDAIRE } from "@/components/epure";
import { FeuilleEtape } from "@/components/gestion/conteneurs/feuille-etape";

const quand = (d) => new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Suivi d'un conteneur, épuré : la chronologie des étapes (lieu, message,
 * visible ou non sur le suivi public) et « Ajouter une étape ».
 */
export function SuiviConteneur({ conteneur, onAjoute }) {
  const etapes = conteneur.trackingUpdates || [];
  const [ouvert, setOuvert] = useState(false);

  return (
    <Bloc
      titre="Étapes du voyage"
      actions={
        <button type="button" onClick={() => setOuvert(true)} className={SECONDAIRE}>
          <Plus className="size-4" aria-hidden="true" />
          Point de suivi
        </button>
      }
    >
      {etapes.length === 0 ? (
        <p className="py-6 text-center text-ink-muted">Aucune étape pour l&apos;instant.</p>
      ) : (
        <ol className="flex flex-col">
          {etapes.map((t, i) => (
            <li key={t.id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < etapes.length - 1 && <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
              <span aria-hidden="true" className={i === 0 ? "grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white" : "grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-muted"}>
                <MapPin className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{t.location}</span>
                  <span className="text-[13px] text-ink-muted">{quand(t.timestamp)}</span>
                  {!t.isPublic && (
                    <span className="flex items-center gap-1 text-xs text-ink-subtle">
                      <EyeOff className="size-3.5" aria-hidden="true" />
                      interne
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-ink-muted">{t.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {ouvert && (
        <FeuilleEtape
          conteneur={conteneur}
          cible={null}
          onFermer={() => setOuvert(false)}
          onFait={() => {
            setOuvert(false);
            onAjoute?.();
          }}
        />
      )}
    </Bloc>
  );
}

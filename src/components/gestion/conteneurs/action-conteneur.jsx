"use client";

import { useState } from "react";
import { FeuilleEtape } from "@/components/gestion/conteneurs/feuille-etape";
import { actionSuivante } from "@/lib/conteneurs";
import { cn } from "@/lib/utils";

/**
 * Bouton qui fait avancer un conteneur d'une étape (fermer, parti, douane,
 * arrivé). Il ouvre la fiche de l'étape : plomb, date, ligne du suivi.
 */
export function BoutonActionConteneur({ conteneur, onFait, className, variante = "plein" }) {
  const action = actionSuivante(conteneur.status);
  const [ouvert, setOuvert] = useState(false);
  if (!action) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold",
          variante === "plein" ? "bg-brand text-white" : "border border-line-strong bg-white text-ink hover:bg-surface-muted",
          className
        )}
      >
        {action.libelle}
      </button>
      {ouvert && (
        <FeuilleEtape
          conteneur={conteneur}
          cible={action.statut}
          onFermer={() => setOuvert(false)}
          onFait={(maj) => {
            setOuvert(false);
            onFait?.(maj);
          }}
        />
      )}
    </>
  );
}

"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { actionSuivante, corpsAction } from "@/lib/conteneurs";
import { cn } from "@/lib/utils";

/**
 * Bouton qui fait avancer un conteneur (fermer, parti, douane, arrivé).
 * La fermeture ouvre une feuille qui demande seulement le n° du plomb.
 */
export function BoutonActionConteneur({ conteneur, onFait, className, variante = "plein" }) {
  const action = actionSuivante(conteneur.status);
  const [feuille, setFeuille] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  if (!action) return null;

  async function executer(plomb) {
    setEnvoi(true);
    try {
      const res = await fetch(`/api/containers/${conteneur.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpsAction(action, { plomb })),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Le conteneur n'a pas pu être mis à jour.");
      toast.success(`${conteneur.containerNumber} : ${action.libelle.toLowerCase().replace("marquer ", "")}.`);
      setFeuille(false);
      onFait?.(data.container);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={envoi}
        onClick={() => (action.demandePlomb ? setFeuille(true) : executer())}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-60",
          variante === "plein" ? "bg-brand text-white" : "border border-line-strong bg-white text-ink",
          className
        )}
      >
        {envoi && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {action.libelle}
      </button>
      {feuille && <FeuilleFermeture conteneur={conteneur} envoi={envoi} onFermer={() => setFeuille(false)} onValider={executer} />}
    </>
  );
}

function FeuilleFermeture({ conteneur, envoi, onFermer, onValider }) {
  const id = useId();
  const [plomb, setPlomb] = useState(conteneur.sealNumber || "");
  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={`Fermer ${conteneur.containerNumber}`}
      sousTitre={`${conteneur.packagesCount ?? 0} colis. Une fois fermé, la caisse n'y ajoute plus de colis.`}
      largeur="max-w-md"
      pied={
        <div className="flex gap-3">
          <button type="button" onClick={onFermer} className="h-14 rounded-xl border border-line-strong bg-white px-5 font-semibold">
            Annuler
          </button>
          <button
            type="button"
            disabled={envoi || !plomb.trim()}
            onClick={() => onValider(plomb.trim())}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
          >
            {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            Fermer le conteneur
          </button>
        </div>
      }
    >
      <div className="pt-2">
        <FloatingLabelInput id={`${id}-plomb`} label="N° du plomb *" className="text-base" autoComplete="off" value={plomb} onChange={(e) => setPlomb(e.target.value)} />
      </div>
    </Feuille>
  );
}

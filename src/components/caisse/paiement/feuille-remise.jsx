"use client";

import { useState } from "react";
import { Feuille } from "@/components/caisse/feuille";
import { Clavier, Afficheur } from "@/components/caisse/clavier";
import { calculerRemise, formatMontant, saisieVersNombre, toucheClavier, DEVISE } from "@/lib/caisse/montants";
import { MOTIFS_REMISE, REMISES_RAPIDES } from "@/lib/caisse/paiement";
import { cn } from "@/lib/utils";

const libelleRemise = (r) => (r.type === "pourcent" ? `${r.valeur} %` : formatMontant(r.valeur));

/** Remise accordée par le chef de caisse : en un toucher ou montant libre, avec un motif. */
export function FeuilleRemise({ sousTotal, remise, onAppliquer, onFermer }) {
  const [choix, setChoix] = useState(remise ? { type: remise.type, valeur: remise.valeur } : null);
  const [libre, setLibre] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [motif, setMotif] = useState(remise?.motif || "");

  const courante = libre ? { type: "montant", valeur: saisieVersNombre(saisie) } : choix;
  const montant = calculerRemise(sousTotal, courante);

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre="Accorder une remise"
      sousTitre={`Sous-total ${formatMontant(sousTotal)}`}
      largeur="max-w-lg"
      pied={
        <div className="flex flex-col gap-3">
          <div className="chiffres flex items-baseline justify-between">
            <span className="font-caisse text-ink-muted">Net après remise</span>
            <span className="text-2xl font-semibold">{formatMontant(sousTotal - montant)}</span>
          </div>
          <div className="flex gap-3">
            {remise && (
              <button
                type="button"
                onClick={() => onAppliquer(null)}
                className="h-14 rounded-xl border border-danger/30 bg-danger-soft px-4 font-semibold text-danger"
              >
                Retirer
              </button>
            )}
            <button
              type="button"
              disabled={montant <= 0}
              onClick={() => onAppliquer({ ...courante, motif })}
              className="h-14 flex-1 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
            >
              Appliquer{montant > 0 && <span className="chiffres"> · − {formatMontant(montant)}</span>}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2">
          {REMISES_RAPIDES.map((r) => {
            const actif = !libre && choix?.type === r.type && choix?.valeur === r.valeur;
            return (
              <button
                key={`${r.type}-${r.valeur}`}
                type="button"
                aria-pressed={actif}
                onClick={() => {
                  setLibre(false);
                  setChoix(r);
                }}
                className={cn(
                  "chiffres h-14 rounded-xl text-lg font-semibold",
                  actif ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line-strong bg-white"
                )}
              >
                {libelleRemise(r)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={libre}
          onClick={() => setLibre((v) => !v)}
          className={cn(
            "h-12 rounded-xl font-semibold",
            libre ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line-strong bg-white"
          )}
        >
          Autre montant
        </button>

        {libre && (
          <div className="flex flex-col gap-2">
            <Afficheur libelle="Montant de la remise" valeur={saisie} unite={DEVISE.symbole} vide="0,00" />
            <Clavier onTouche={(t) => setSaisie((s) => toucheClavier(s, t))} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink-muted">Motif</span>
          <div role="radiogroup" aria-label="Motif de la remise" className="flex flex-wrap gap-2">
            {MOTIFS_REMISE.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={motif === m}
                onClick={() => setMotif(motif === m ? "" : m)}
                className={cn(
                  "h-11 rounded-xl px-3",
                  motif === m ? "border-2 border-brand bg-brand-soft font-medium text-brand-strong" : "border border-line-strong bg-white text-ink-muted"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Feuille>
  );
}

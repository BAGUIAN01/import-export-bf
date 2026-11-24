"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark, Loader2, ScrollText, Smartphone, Wallet } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { Afficheur, Clavier } from "@/components/caisse/clavier";
import { arrondi, formatMontant, formatNombre, montantsRapides, saisieVersNombre, toucheClavier } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

const MODES = [
  { valeur: "CASH", libelle: "Espèces", icone: Banknote },
  { valeur: "CARD", libelle: "Carte", icone: CreditCard },
  { valeur: "MOBILE_MONEY", libelle: "Mobile money", icone: Smartphone },
  { valeur: "TRANSFER", libelle: "Virement", icone: Landmark },
  { valeur: "CHEQUE", libelle: "Chèque", icone: ScrollText },
];

/**
 * Encaisser sur un envoi, comme à la caisse : le mode en tuiles, le montant
 * au pavé, la monnaie à rendre. Moins que le reste = acompte ; plus (espèces)
 * = on encaisse le reste et on rend la monnaie.
 * `onEncaisser({ paidAmount, paymentMethod, paidAt })` : montant cumulé.
 */
export function FeuilleEncaissement({ envoi, onFermer, onEncaisser }) {
  const reste = arrondi(Math.max(0, (envoi.totalAmount || 0) - (envoi.paidAmount || 0)));
  const [mode, setMode] = useState("CASH");
  const [saisie, setSaisie] = useState(formatNombre(reste).replace(/\s/g, ""));
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const recu = saisieVersNombre(saisie);
  const encaisse = Math.min(recu, reste);
  const monnaie = mode === "CASH" ? arrondi(Math.max(0, recu - reste)) : 0;
  const acompte = recu > 0 && recu < reste - 0.009;

  async function valider() {
    setEnvoiEnCours(true);
    try {
      await onEncaisser({
        paidAmount: arrondi((envoi.paidAmount || 0) + encaisse),
        paymentMethod: mode,
        paidAt: new Date().toISOString(),
      });
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre="Encaisser"
      sousTitre={
        <>
          <span className="chiffres">{envoi.shipmentNumber}</span> · reste <span className="chiffres font-semibold text-ink">{formatMontant(reste)}</span>
        </>
      }
      largeur="max-w-md"
      pied={
        <button
          type="button"
          onClick={valider}
          disabled={recu <= 0 || envoiEnCours}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-semibold text-white disabled:bg-line-strong"
        >
          {envoiEnCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Wallet className="size-5" aria-hidden="true" />}
          {acompte ? "Encaisser un acompte" : "Encaisser"} <span className="chiffres">· {formatMontant(encaisse)}</span>
        </button>
      }
    >
      <div className="flex flex-col gap-3 pt-1">
        <div role="radiogroup" aria-label="Mode de paiement" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          {MODES.map((m) => {
            const Icone = m.icone;
            const actif = mode === m.valeur;
            return (
              <button
                key={m.valeur}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setMode(m.valeur)}
                className={cn(
                  "flex h-[68px] min-w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-sm",
                  actif ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white font-medium"
                )}
              >
                <Icone className="size-5" aria-hidden="true" />
                {m.libelle}
              </button>
            );
          })}
        </div>
        <Afficheur libelle={mode === "CASH" ? "Montant reçu" : "Montant payé"} valeur={saisie} unite="€" />
        <div aria-live="polite" className="chiffres flex min-h-6 justify-between px-1 text-[15px]">
          {recu <= 0 ? (
            <span className="font-caisse text-ink-muted">Tapez le montant ou touchez une proposition.</span>
          ) : monnaie > 0 ? (
            <>
              <span className="font-caisse font-medium text-brand-strong">Monnaie à rendre</span>
              <span className="font-semibold text-brand-strong">{formatMontant(monnaie)}</span>
            </>
          ) : acompte ? (
            <>
              <span className="font-caisse font-medium text-alerte">Restera à payer</span>
              <span className="font-semibold text-alerte">{formatMontant(reste - recu)}</span>
            </>
          ) : (
            <span className="font-caisse font-medium text-brand-strong">Soldé</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {montantsRapides(reste).map((v) => (
            <button key={v} type="button" onClick={() => setSaisie(String(v).replace(".", ","))} className="chiffres h-11 rounded-xl border border-line-strong bg-surface-page text-sm font-semibold">
              {formatNombre(v, v % 1 === 0 ? 0 : 2)}
            </button>
          ))}
        </div>
        <Clavier decimales={2} hauteur="h-14" onTouche={(t) => setSaisie((s) => toucheClavier(s, t, { decimales: 2 }))} />
      </div>
    </Feuille>
  );
}

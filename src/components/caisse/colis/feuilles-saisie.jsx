"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { Clavier, Afficheur } from "@/components/caisse/clavier";
import { Champ } from "@/components/caisse/champ";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { formatMontant, saisieVersNombre, toucheClavier, DEVISE } from "@/lib/caisse/montants";

/** Quantité d'une ligne du ticket, au clavier à l'écran. */
export function FeuilleQuantite({ ligne, onValider, onRetirer, onFermer }) {
  const [saisie, setSaisie] = useState(String(ligne.quantity));
  // Le premier chiffre tapé remplace la quantité affichée au lieu de s'y ajouter.
  const [remplacer, setRemplacer] = useState(true);
  const q = Math.floor(saisieVersNombre(saisie));
  const pas = (d) => {
    setRemplacer(false);
    setSaisie(String(Math.max(0, q + d)));
  };
  const touche = (t) => {
    const depart = remplacer && /\d/.test(t) ? "" : saisie;
    setRemplacer(false);
    setSaisie(toucheClavier(depart, t, { decimales: 0, longueurMax: 3 }));
  };

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={ligne.name}
      sousTitre={`${formatMontant(ligne.price)} l'unité`}
      largeur="max-w-md"
      pied={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRetirer}
            className="flex h-14 items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 font-semibold text-danger"
          >
            <Trash2 className="size-5" aria-hidden="true" />
            Retirer
          </button>
          <button
            type="button"
            disabled={q < 1}
            onClick={() => onValider(q)}
            className="h-14 flex-1 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
          >
            Valider{q >= 1 && <span className="chiffres"> · {formatMontant(q * ligne.price)}</span>}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2">
          <button type="button" onClick={() => pas(-1)} aria-label="Un de moins" className="grid w-16 place-items-center rounded-2xl border border-line bg-white">
            <Minus className="size-6" aria-hidden="true" />
          </button>
          <Afficheur libelle="Quantité" valeur={saisie} className="flex-1" />
          <button type="button" onClick={() => pas(1)} aria-label="Un de plus" className="grid w-16 place-items-center rounded-2xl border border-line bg-white">
            <Plus className="size-6" aria-hidden="true" />
          </button>
        </div>
        <Clavier decimales={0} onTouche={touche} />
      </div>
    </Feuille>
  );
}

/** Article « sur devis » : prix tapé au clavier, description facultative. */
export function FeuilleDevis({ article, onAjouter, onFermer }) {
  const [saisie, setSaisie] = useState("");
  const [description, setDescription] = useState("");
  const prix = saisieVersNombre(saisie);

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={article.nom}
      sousTitre="Sur devis : tapez le prix convenu."
      largeur="max-w-md"
      pied={
        <button
          type="button"
          disabled={prix <= 0}
          onClick={() => onAjouter({ prix, description: description.trim() })}
          className="h-14 w-full rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
        >
          Ajouter au ticket{prix > 0 && <span className="chiffres"> · {formatMontant(prix)}</span>}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <VignetteArticle article={article} />
          <Champ
            className="flex-1"
            libelle="Description (facultatif)"
            placeholder="Ex. Toyota RAV4 2015"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Afficheur libelle="Prix" valeur={saisie} unite={DEVISE.symbole} vide="0,00" />
        <Clavier decimales={DEVISE.decimales} onTouche={(t) => setSaisie((s) => toucheClavier(s, t))} />
      </div>
    </Feuille>
  );
}

"use client";

import { useEffect, useState } from "react";
import { VIBRATIONS, vibrer } from "@/lib/vibrer";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { cn } from "@/lib/utils";

/**
 * Feuille d'actions (comme le menu « … » d'une application) : une ligne par
 * action ; une action `danger` avec `confirmation` demande une seconde
 * pression dans la même feuille avant d'agir.
 * `actions` : [{ libelle, icone?, onClick, danger?, confirmation?: { titre, texte, bouton } }].
 */
export function FeuilleActions({ ouvert, onFermer, titre = "Actions", sousTitre, actions = [], confirmer = null }) {
  const [aConfirmer, setAConfirmer] = useState(null);
  const [enCours, setEnCours] = useState(false);
  // `confirmer` : action dont on demande tout de suite la confirmation (glissée sur une ligne)
  useEffect(() => {
    if (ouvert) setAConfirmer(confirmer);
  }, [ouvert, confirmer]);

  function fermer() {
    setAConfirmer(null);
    onFermer();
  }

  async function lancer(a) {
    if (a.confirmation && aConfirmer !== a) return setAConfirmer(a);
    setEnCours(true);
    try {
      await a.onClick?.();
      if (a.danger) vibrer(VIBRATIONS.succes);
    } finally {
      setEnCours(false);
      fermer();
    }
  }

  const c = aConfirmer?.confirmation;
  return (
    <Feuille ouvert={ouvert} onFermer={fermer} titre={c ? c.titre : titre} sousTitre={c ? c.texte : sousTitre} largeur="max-w-md">
      {c ? (
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => lancer(aConfirmer)}
            disabled={enCours}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-white disabled:opacity-60"
          >
            {enCours && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {c.bouton}
          </button>
          <button type="button" onClick={() => setAConfirmer(null)} className="h-14 rounded-2xl border border-line-strong font-semibold">
            Annuler
          </button>
        </div>
      ) : (
        <ul className="-mx-2 flex flex-col gap-1">
          {actions.map((a) => {
            const Icone = a.icone;
            return (
              <li key={a.libelle}>
                <button
                  type="button"
                  onClick={() => lancer(a)}
                  disabled={enCours || a.disabled}
                  className={cn(
                    "flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left font-semibold active:bg-surface-page disabled:opacity-50",
                    a.danger ? "text-danger" : "text-ink"
                  )}
                >
                  {Icone && (
                    <span aria-hidden="true" className={cn("grid size-10 place-items-center rounded-xl", a.danger ? "bg-danger-soft" : "bg-surface-muted text-ink-muted")}>
                      <Icone className="size-5" />
                    </span>
                  )}
                  {a.libelle}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Feuille>
  );
}

/**
 * Téléphone (sous 768 px) : barre fixée en bas d'une fiche, l'action
 * principale en grand, les autres dans « … ». Sur tablette et PC, rien :
 * les boutons restent dans l'en-tête de la fiche.
 * `principale` : { libelle, icone, onClick, disabled, chargement } ou un élément React.
 */
export function BarreActions({ principale, autres = [], titreMenu }) {
  const [menu, setMenu] = useState(false);
  const visibles = autres.filter(Boolean);
  if (!principale && !visibles.length) return null;

  let bouton = null;
  if (principale && principale.libelle) {
    const Icone = principale.icone;
    bouton = (
      <button
        type="button"
        onClick={principale.onClick}
        disabled={principale.disabled || principale.chargement}
        className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand px-4 font-semibold text-white shadow-[0_2px_8px_rgba(14,122,85,.28)] active:scale-[.99] disabled:opacity-60"
      >
        {principale.chargement ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : Icone && <Icone className="size-5 shrink-0" aria-hidden="true" />}
        <span className="truncate">{principale.libelle}</span>
      </button>
    );
  } else if (principale) {
    bouton = <div className="flex min-w-0 flex-1 [&>*]:h-12 [&>*]:w-full [&>*]:rounded-2xl">{principale}</div>;
  }

  return (
    <>
      <div
        className="sticky bottom-0 z-20 -mx-3 -mb-3 flex gap-2 border-t border-line bg-white/95 px-3 pt-3 backdrop-blur md:hidden print:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {bouton}
        {visibles.length > 0 && (
          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label="Autres actions"
            aria-haspopup="dialog"
            className={cn(
              "flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white font-semibold active:bg-surface-page",
              bouton ? "w-12" : "flex-1"
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            {!bouton && "Actions"}
          </button>
        )}
      </div>
      <FeuilleActions ouvert={menu} onFermer={() => setMenu(false)} titre={titreMenu} actions={visibles} />
    </>
  );
}

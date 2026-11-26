"use client";

import { useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { telechargerCsv } from "@/lib/export-csv";
import { VIBRATIONS, vibrer } from "@/lib/vibrer";
import { cn } from "@/lib/utils";

/** Exécute `fn` sur chaque élément, `n` à la fois. */
async function enParallele(elements, n, fn) {
  const file = [...elements];
  await Promise.all(
    Array.from({ length: Math.min(n, file.length) }, async () => {
      while (file.length) await fn(file.shift());
    })
  );
}

/** Appel d'API qui lève une erreur lisible si la réponse n'est pas bonne. */
export async function appel(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Erreur ${res.status}`);
  return data;
}

/**
 * Barre des actions groupées (lignes cochées d'un tableau) : nombre choisi,
 * actions (avec un choix — conteneur, état — ou une confirmation), export.
 * `selection` : {
 *   actions: [{ id, libelle, court?, icone, danger?, choix?: () => Promise<[{ valeur, libelle, detail? }]> | [...],
 *               titreChoix?, confirmation?: (n) => ({ titre, texte, bouton }),
 *               executer: (ligne, valeur) => Promise, enCours: "Suppression", succes: (n) => texte }],
 *   exporter?: { nom: "colis", ligne: (l) => ({ Colonne: valeur }) },
 *   onFait?: () => void,
 * }
 */
export function BarreSelection({ choisies, total, selection, onTout, onVider }) {
  const [feuille, setFeuille] = useState(null); // { action, options|null, chargement }
  const [enCours, setEnCours] = useState(false);
  const n = choisies.length;
  if (!n) return null;

  const actions = selection.actions || [];

  async function lancer(action, valeur) {
    setFeuille(null);
    setEnCours(true);
    const id = toast.loading(`${action.enCours}… 0 / ${n}`);
    let ok = 0;
    const echecs = [];
    await enParallele(choisies, 4, async (ligne) => {
      try {
        await action.executer(ligne, valeur);
        ok += 1;
      } catch (e) {
        echecs.push(e.message);
      }
      toast.loading(`${action.enCours}… ${ok + echecs.length} / ${n}`, { id });
    });
    toast.dismiss(id);
    if (!echecs.length) {
      vibrer(VIBRATIONS.succes);
      toast.success(action.succes(ok));
    } else {
      vibrer(VIBRATIONS.erreur);
      toast.error(`${ok} fait${ok > 1 ? "s" : ""}, ${echecs.length} refusé${echecs.length > 1 ? "s" : ""} : ${echecs[0]}`, { duration: 8000 });
    }
    setEnCours(false);
    onVider();
    selection.onFait?.();
  }

  async function ouvrir(action) {
    if (action.choix) {
      setFeuille({ action, options: null, chargement: true });
      try {
        const options = await (typeof action.choix === "function" ? action.choix(choisies) : action.choix);
        setFeuille({ action, options, chargement: false });
      } catch (e) {
        toast.error(e.message || "La liste n'a pas pu être chargée.");
        setFeuille(null);
      }
    } else if (action.confirmation) {
      setFeuille({ action, confirmer: true });
    } else {
      lancer(action);
    }
  }

  function exporter() {
    telechargerCsv(selection.exporter.nom, choisies.map(selection.exporter.ligne));
    toast.success(`${n} ligne${n > 1 ? "s" : ""} exportée${n > 1 ? "s" : ""}.`);
  }

  const confirmation = feuille?.confirmer ? feuille.action.confirmation(n) : null;

  return (
    <>
      <div
        role="toolbar"
        aria-label="Actions sur la sélection"
        className="caisse sticky bottom-0 z-20 -mx-3 mt-2 max-sm:-bottom-3 flex items-center gap-2 border-t border-line bg-white/95 px-3 pt-2.5 font-caisse backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-[0_8px_24px_rgba(15,23,20,.12)]"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-semibold">
            {n} sélectionné{n > 1 ? "s" : ""}
          </div>
          {n < total ? (
            <button type="button" onClick={onTout} className="text-[13px] font-medium text-brand-strong">
              Tout sélectionner ({total})
            </button>
          ) : (
            <span className="text-[13px] text-ink-muted">toute la liste</span>
          )}
        </div>
        {enCours ? (
          <Loader2 className="size-6 animate-spin text-ink-muted" aria-label="Action en cours" />
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            {actions.map((a) => {
              const Icone = a.icone;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => ouvrir(a)}
                  aria-label={a.libelle}
                  title={a.libelle}
                  className={cn(
                    "flex h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-semibold sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                    a.danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-surface-muted"
                  )}
                >
                  <Icone className="size-5" aria-hidden="true" />
                  <span className="hidden min-[400px]:inline">{a.court || a.libelle}</span>
                </button>
              );
            })}
            {selection.exporter && (
              <button
                type="button"
                onClick={exporter}
                aria-label="Exporter en tableur"
                title="Exporter en tableur (CSV)"
                className="flex h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-semibold text-ink hover:bg-surface-muted sm:flex-row sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Download className="size-5" aria-hidden="true" />
                <span className="hidden min-[400px]:inline">Exporter</span>
              </button>
            )}
            <button type="button" onClick={onVider} aria-label="Annuler la sélection" className="grid size-12 place-items-center rounded-xl text-ink-muted hover:bg-surface-muted">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Choix (conteneur, état) */}
      <Feuille
        ouvert={!!feuille && !feuille.confirmer}
        onFermer={() => setFeuille(null)}
        titre={feuille?.action?.titreChoix || feuille?.action?.libelle}
        sousTitre={`${n} ligne${n > 1 ? "s" : ""} sélectionnée${n > 1 ? "s" : ""}`}
        largeur="max-w-md"
      >
        {feuille?.chargement ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-7 animate-spin text-ink-muted" aria-label="Chargement" />
          </div>
        ) : feuille?.options?.length === 0 ? (
          <p className="py-6 text-center text-ink-muted">Aucun choix possible.</p>
        ) : (
          <ul className="-mx-2 flex flex-col gap-1">
            {(feuille?.options || []).map((o) => (
              <li key={o.valeur}>
                <button
                  type="button"
                  onClick={() => lancer(feuille.action, o.valeur)}
                  className="flex min-h-14 w-full flex-col justify-center rounded-2xl px-3 py-2 text-left active:bg-surface-page hover:bg-surface-page"
                >
                  <span className="font-semibold">{o.libelle}</span>
                  {o.detail && <span className="text-[13px] text-ink-muted">{o.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Feuille>

      {/* Confirmation (suppression) */}
      <Feuille ouvert={!!confirmation} onFermer={() => setFeuille(null)} titre={confirmation?.titre} sousTitre={confirmation?.texte} largeur="max-w-md">
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => lancer(feuille.action)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-danger font-semibold text-white"
          >
            {confirmation?.bouton}
          </button>
          <button type="button" onClick={() => setFeuille(null)} className="h-14 rounded-2xl border border-line-strong font-semibold">
            Annuler
          </button>
        </div>
      </Feuille>
    </>
  );
}

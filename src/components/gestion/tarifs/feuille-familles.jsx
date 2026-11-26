"use client";

import { useId, useState } from "react";
import { ArrowLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { ICONES_FAMILLES, iconeDe } from "@/lib/caisse/icones";
import { TEINTES, teinte } from "@/lib/caisse/familles";
import { cn } from "@/lib/utils";

const NOMS_TEINTES = { ambre: "Ambre", vert: "Vert", bleu: "Bleu", violet: "Violet", gris: "Gris", sable: "Sable", rose: "Rose", cyan: "Cyan" };

/**
 * Familles du catalogue : liste, puis création ou modification (nom, dessin,
 * couleur) avec l'aperçu de la tuile telle que la caisse l'affichera.
 * `editionInitiale` ({} : nouvelle ; une famille : la modifier) ouvre
 * directement le formulaire (panneau des tarifs) ; la feuille se ferme alors
 * une fois la famille enregistrée.
 */
export function FeuilleFamilles({ familles, editionInitiale, onFermer, onChange }) {
  const [edition, setEdition] = useState(editionInitiale ?? null); // null : liste ; {} : nouvelle ; famille : modifier

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={edition === null ? "Familles" : edition.id ? edition.nom : "Nouvelle famille"}
      sousTitre={edition === null ? "Les puces de l'écran Colis de la caisse, dans cet ordre." : "Le dessin et la couleur servent aux articles sans photo."}
      largeur="max-w-lg"
    >
      {edition === null ? (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {familles.map((f) => {
              const t = teinte(f.teinte);
              const Icone = iconeDe(f.icone);
              return (
                <li key={f.id}>
                  <button type="button" onClick={() => setEdition(f)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left">
                    <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: t.fond, color: t.trait }}>
                      <Icone className="size-6" strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{f.nom}</span>
                      <span className="text-sm text-ink-muted">
                        {f.articles.length} article{f.articles.length > 1 ? "s" : ""}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-brand" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => setEdition({})} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white">
            <Plus className="size-5" aria-hidden="true" />
            Nouvelle famille
          </button>
        </div>
      ) : (
        <EditionFamille
          famille={edition}
          onRetour={() => setEdition(null)}
          onEnregistre={(f) => {
            onChange(f);
            if (editionInitiale) onFermer();
            else setEdition(null);
          }}
        />
      )}
    </Feuille>
  );
}

function EditionFamille({ famille, onRetour, onEnregistre }) {
  const id = useId();
  const nouvelle = !famille.id;
  const [nom, setNom] = useState(famille.nom || "");
  const [icone, setIcone] = useState(famille.icone || "package");
  const [couleur, setCouleur] = useState(famille.teinte || "ambre");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const t = TEINTES[couleur];
  const Apercu = iconeDe(icone);

  async function envoyer(corps) {
    setEnvoi(true);
    setErreur("");
    try {
      const res = await fetch(nouvelle ? "/api/tarifs/familles" : `/api/tarifs/familles/${famille.id}`, {
        method: nouvelle ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "La famille n'a pas pu être enregistrée.");
      toast.success(nouvelle ? `La famille ${data.famille.nom} est créée.` : "Famille enregistrée.");
      onEnregistre(data.famille);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-1">
      <button type="button" onClick={onRetour} className="flex h-11 items-center gap-2 self-start rounded-xl px-2 font-medium text-ink-muted">
        <ArrowLeft className="size-5" aria-hidden="true" />
        Toutes les familles
      </button>

      <FloatingLabelInput id={`${id}-nom`} label="Nom de la famille *" className="text-base" value={nom} onChange={(e) => setNom(e.target.value)} />

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">Dessin</legend>
        <div role="radiogroup" aria-label="Dessin" className="grid grid-cols-5 gap-2">
          {ICONES_FAMILLES.map((n) => {
            const I = iconeDe(n);
            const choisi = n === icone;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={choisi}
                aria-label={n}
                onClick={() => setIcone(n)}
                className={cn("grid h-14 place-items-center rounded-xl", choisi ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line-strong bg-white text-ink-muted")}
              >
                <I className="size-6" strokeWidth={1.7} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-muted">Couleur</legend>
        <div role="radiogroup" aria-label="Couleur" className="flex flex-wrap gap-2">
          {Object.entries(TEINTES).map(([cle, tt]) => {
            const choisie = cle === couleur;
            return (
              <button
                key={cle}
                type="button"
                role="radio"
                aria-checked={choisie}
                onClick={() => setCouleur(cle)}
                className={cn("flex h-11 items-center gap-2 rounded-xl px-3", choisie ? "border-2 border-brand font-semibold" : "border border-line-strong")}
                style={{ background: tt.fond, color: tt.trait }}
              >
                <span aria-hidden="true" className="size-3 rounded-full" style={{ background: tt.trait }} />
                {NOMS_TEINTES[cle]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-4 rounded-2xl bg-surface-page p-4">
        <div className="w-36 shrink-0 overflow-hidden rounded-2xl border border-line bg-white" aria-hidden="true">
          <div className="grid h-20 place-items-center" style={{ background: t.fond, color: t.trait }}>
            <Apercu className="size-9" strokeWidth={1.6} />
          </div>
          <div className="p-2 text-sm font-semibold">{nom || "Nom"}</div>
        </div>
        <p className="text-sm text-ink-muted">Aperçu d&apos;une tuile de cette famille à la caisse, pour un article sans photo.</p>
      </div>

      {erreur && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {erreur}
        </p>
      )}
      <div className="flex gap-3">
        {!nouvelle && famille.articles?.length === 0 && (
          <button type="button" disabled={envoi} onClick={() => envoyer({ isActive: false })} className="h-14 rounded-xl border border-danger/30 bg-danger-soft px-4 font-semibold text-danger">
            Supprimer
          </button>
        )}
        <button
          type="button"
          disabled={envoi || !nom.trim()}
          onClick={() => envoyer({ nom, icone, teinte: couleur })}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
        >
          {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {nouvelle ? "Créer la famille" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

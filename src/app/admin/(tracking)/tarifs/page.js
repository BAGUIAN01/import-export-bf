"use client";

/* eslint-disable @next/next/no-img-element -- photos servies par l'API, déjà réduites */
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { EyeOff, Pencil, Plus, Search, Star, X } from "lucide-react";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useEtatSession } from "@/hooks/use-etat-session";
import { FicheArticle } from "@/components/gestion/tarifs/fiche-article";
import { FeuilleFamilles } from "@/components/gestion/tarifs/feuille-familles";
import { PanneauFamilles, absenteDeLaCaisse } from "@/components/gestion/tarifs/panneau-familles";
import { iconeDe } from "@/lib/caisse/icones";
import { sansAccents, teinte, urlImage } from "@/lib/caisse/familles";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

/**
 * Gestion · Tarifs
 * Le catalogue de la caisse : familles et articles, avec leur photo. Ce qui
 * est enregistré ici est ce que la caisse propose, avec les mêmes images.
 * Les familles sont dans un panneau à gauche (puces sur téléphone), comme
 * les modules des actes dans dogtorso.
 */
export default function TarifsPage() {
  const { data: session } = useSession();
  const peutModifier = ["ADMIN", "TRACKER"].includes(session?.user?.role);
  const { familles, chargement, erreur, recharger } = useCatalogue();
  const [familleChoisie, setFamille] = useEtatSession("tarifs:famille", "toutes");
  const [recherche, setRecherche] = useEtatSession("tarifs:recherche", "");
  const [fiche, setFiche] = useState(null); // null, "nouveau" ou l'article
  const [editionFamille, setEditionFamille] = useState(null); // {} : nouvelle ; une famille : la modifier

  // Famille supprimée ou inconnue : toutes
  const courante = familles.find((f) => f.id === familleChoisie) || null;
  const famille = courante ? courante.id : "toutes";

  const articles = useMemo(() => {
    const q = sansAccents(recherche).trim();
    return familles
      .filter((f) => famille === "toutes" || f.id === famille)
      .flatMap((f) => f.articles.map((a) => ({ ...a, famille: f })))
      .filter((a) => !q || sansAccents(`${a.nom} ${a.detail || ""} ${a.code}`).includes(q));
  }, [familles, famille, recherche]);

  const total = familles.reduce((n, f) => n + f.articles.length, 0);
  const avecPhoto = familles.reduce((n, f) => n + f.articles.filter((a) => a.aImage).length, 0);

  return (
    <div className="caisse mx-auto flex max-w-[1280px] flex-col gap-4 text-[15px] text-ink">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-muted">Gestion / Tarifs</p>
          <h1 className="text-2xl font-semibold tracking-tight">Tarifs</h1>
          <p className="text-ink-muted">
            {total} articles · {avecPhoto} avec photo. La caisse affiche les mêmes familles et les mêmes images.
          </p>
        </div>
        {peutModifier && (
          <button
            type="button"
            onClick={() => setFiche("nouveau")}
            className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
          >
            <Plus className="size-5" aria-hidden="true" />
            Nouvel article
          </button>
        )}
      </div>

      <label className="relative flex h-12 items-center rounded-2xl border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <span className="sr-only">Rechercher un article</span>
        <Search className="ml-4 size-5 text-ink-muted" aria-hidden="true" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher un article"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {recherche && (
          <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="mr-1 grid size-10 place-items-center rounded-xl text-ink-muted">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </label>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <PanneauFamilles
          familles={familles}
          total={total}
          choisie={famille}
          modifiable={peutModifier}
          onChoisir={setFamille}
          onNouvelle={() => setEditionFamille({})}
        />
        <div className="flex min-w-0 flex-col gap-3">
          {courante && <EnTeteFamille famille={courante} modifiable={peutModifier} onModifier={() => setEditionFamille(courante)} />}
          {chargement ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="h-[230px] animate-pulse rounded-2xl bg-white" />
              ))}
            </ul>
          ) : erreur ? (
            <p role="alert" className="rounded-2xl bg-danger-soft p-6 text-center text-danger">
              {erreur}
            </p>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">
              <p>{recherche ? "Aucun article ne correspond." : courante ? "Aucun article dans cette famille." : "Aucun article."}</p>
              {peutModifier && !recherche && (
                <button type="button" onClick={() => setFiche("nouveau")} className="flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-white px-4 font-semibold text-ink">
                  <Plus className="size-5" aria-hidden="true" />
                  Ajouter un article
                </button>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {articles.map((a) => {
                const t = teinte(a.famille.teinte);
                const Icone = iconeDe(a.icone || a.famille.icone);
                const photo = urlImage(a);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      disabled={!peutModifier}
                      onClick={() => setFiche(a)}
                      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_1px_2px_rgba(15,23,20,.04)] active:scale-[.98] disabled:active:scale-100"
                    >
                      <span className="relative block h-32" style={{ background: t.fond }}>
                        {photo ? (
                          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="grid h-full place-items-center" style={{ color: t.trait }} aria-hidden="true">
                            <Icone className="size-12" strokeWidth={1.5} />
                          </span>
                        )}
                        <span className="absolute top-2 left-2 flex gap-1">
                          {a.frequent && (
                            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-brand-strong">
                              <Star className="size-3 fill-current" aria-hidden="true" />
                              Fréquent
                            </span>
                          )}
                          {!a.proposeCaisse && (
                            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-ink-muted">
                              <EyeOff className="size-3" aria-hidden="true" />
                              Masqué
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5 p-3">
                        <span className="line-clamp-2 font-semibold leading-snug">{a.nom}</span>
                        {a.detail && <span className="line-clamp-1 text-xs text-ink-subtle">{a.detail}</span>}
                        <span className="mt-auto flex items-center justify-between gap-2 pt-1">
                          <span className={cn("chiffres text-base font-semibold", a.surDevis && "font-caisse text-sm font-medium text-alerte")}>
                            {a.surDevis ? "Sur devis" : formatMontant(a.prix)}
                          </span>
                          {!courante && <span className="truncate text-xs text-ink-muted">{a.famille.nom}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {fiche && (
        <FicheArticle
          article={fiche === "nouveau" ? null : fiche}
          familles={familles}
          familleParDefaut={famille !== "toutes" ? famille : undefined}
          onFermer={() => setFiche(null)}
          onEnregistre={() => {
            setFiche(null);
            recharger();
          }}
        />
      )}
      {editionFamille && (
        <FeuilleFamilles
          familles={familles}
          editionInitiale={editionFamille}
          onFermer={() => setEditionFamille(null)}
          onChange={(f) => {
            recharger();
            // Nouvelle famille : on l'ouvre ; famille supprimée : retour à toutes
            if (f?.isActive === false) setFamille("toutes");
            else if (f?.id) setFamille(f.id);
          }}
        />
      )}
    </div>
  );
}

/** Famille choisie : son dessin, ses chiffres, et « Modifier » (nom, dessin, couleur). */
function EnTeteFamille({ famille: f, modifiable, onModifier }) {
  const t = teinte(f.teinte);
  const Icone = iconeDe(f.icone);
  const n = f.articles.length;
  const masques = f.articles.filter((a) => !a.proposeCaisse).length;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: t.fond, color: t.trait }}>
        <Icone className="size-6" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold leading-tight">{f.nom}</h2>
        <p className={cn("truncate text-[13px]", n && absenteDeLaCaisse(f) ? "font-medium text-danger" : "text-ink-muted")}>
          {n} article{n > 1 ? "s" : ""}
          {n > 0 && absenteDeLaCaisse(f) ? " · absente de la caisse (tous masqués)" : masques > 0 ? ` · ${masques} masqué${masques > 1 ? "s" : ""} à la caisse` : ""}
        </p>
      </div>
      {modifiable && (
        <button
          type="button"
          onClick={onModifier}
          aria-label={`Modifier la famille ${f.nom}`}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-line-strong bg-white px-3 font-semibold"
        >
          <Pencil className="size-[18px]" aria-hidden="true" />
          <span className="hidden sm:inline">Modifier</span>
        </button>
      )}
    </div>
  );
}

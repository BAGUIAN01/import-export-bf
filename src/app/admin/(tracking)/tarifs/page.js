"use client";

/* eslint-disable @next/next/no-img-element -- photos servies par l'API, déjà réduites */
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { EyeOff, Layers, Plus, Search, Star, X } from "lucide-react";
import { useCatalogue } from "@/hooks/use-catalogue";
import { FicheArticle } from "@/components/gestion/tarifs/fiche-article";
import { FeuilleFamilles } from "@/components/gestion/tarifs/feuille-familles";
import { iconeDe } from "@/lib/caisse/icones";
import { sansAccents, teinte, urlImage } from "@/lib/caisse/familles";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

/**
 * Gestion · Tarifs
 * Le catalogue de la caisse : familles et articles, avec leur photo. Ce qui
 * est enregistré ici est ce que la caisse propose, avec les mêmes images.
 */
export default function TarifsPage() {
  const { data: session } = useSession();
  const peutModifier = ["ADMIN", "TRACKER"].includes(session?.user?.role);
  const { familles, chargement, erreur, recharger } = useCatalogue();
  const [famille, setFamille] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [fiche, setFiche] = useState(null); // null, "nouveau" ou l'article
  const [feuilleFamilles, setFeuilleFamilles] = useState(false);

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
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-muted">Gestion / Tarifs</p>
            <h1 className="text-2xl font-semibold tracking-tight">Tarifs</h1>
          <p className="text-ink-muted">
            {total} articles · {avecPhoto} avec photo. La caisse affiche les mêmes familles et les mêmes images.
          </p>
        </div>
        {peutModifier && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setFeuilleFamilles(true)} className="flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-white px-4 font-semibold">
              <Layers className="size-5" aria-hidden="true" />
              Familles
            </button>
            <button
              type="button"
              onClick={() => setFiche("nouveau")}
              className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nouvel article
            </button>
          </div>
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

      <div role="tablist" aria-label="Familles" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {[{ id: "toutes", nom: "Toutes", teinte: null, articles: { length: total } }, ...familles].map((f) => {
          const choisie = famille === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={choisie}
              onClick={() => setFamille(f.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 whitespace-nowrap",
                choisie ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white font-medium"
              )}
            >
              {f.teinte && <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: teinte(f.teinte).trait }} />}
              {f.nom}
              <span className={cn("chiffres rounded-full px-1.5 text-xs", choisie ? "bg-white/20" : "bg-surface-muted text-ink-muted")}>{f.articles.length}</span>
            </button>
          );
        })}
      </div>

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
        <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">Aucun article.</p>
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
                      <span className="truncate text-xs text-ink-muted">{a.famille.nom}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
      {feuilleFamilles && <FeuilleFamilles familles={familles} onFermer={() => setFeuilleFamilles(false)} onChange={() => recharger()} />}
    </div>
  );
}

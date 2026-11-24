"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { useCaisse } from "@/contexts/caisse-context";
import { GardeClient } from "@/components/caisse/sans-client";
import { Ticket } from "@/components/caisse/colis/ticket";
import { FeuilleDevis, FeuilleQuantite } from "@/components/caisse/colis/feuilles-saisie";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { articlesDe, chercherArticles } from "@/lib/caisse/familles";
import { useCatalogue } from "@/hooks/use-catalogue";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

/**
 * Caisse · 2. Colis
 * Familles en puces, articles en tuiles illustrées ; un toucher ajoute un
 * article au ticket, « sur devis » ouvre le clavier de prix.
 * Paysage : catalogue à gauche, ticket à droite. Portrait : ticket en bas.
 */
export default function CaisseColisPage() {
  return (
    <GardeClient>
      <Colis />
    </GardeClient>
  );
}

/** Ce que la ligne du ticket garde de l'article pour son image. */
const vignetteDe = (a) => ({ icone: a.icone, teinte: a.teinte, image: a.image });

function Colis() {
  const { orderItems, addItem, setItemQuantity, removeItem } = useCaisse();
  const [famille, setFamille] = useState("frequents");
  const [recherche, setRecherche] = useState("");
  const [devis, setDevis] = useState(null);
  const [ligneQuantite, setLigneQuantite] = useState(null);

  const { catalogue, erreur, chargement } = useCatalogue({ pourCaisse: true });
  const familles = catalogue?.familles || [];
  // Famille affichée : « Fréquents » s'il y en a, sinon la première
  const familleAffichee = familles.some((f) => f.cle === famille) ? famille : familles[0]?.cle;
  const articles = useMemo(
    () => (recherche.trim() ? chercherArticles(catalogue, recherche) : articlesDe(catalogue, familleAffichee)),
    [catalogue, familleAffichee, recherche]
  );

  const quantiteDe = (article) =>
    orderItems.filter((l) => l.productId === article.id || (article.surDevis && l.productId?.startsWith(`${article.id}:devis:`))).reduce((s, l) => s + l.quantity, 0);

  const quantiteFamille = (cle) =>
    cle === "frequents" ? 0 : orderItems.filter((l) => l.categoryId === cle).reduce((s, l) => s + l.quantity, 0);

  function toucher(article) {
    if (article.surDevis) {
      setDevis(article);
      return;
    }
    addItem({ id: article.id, type: article.code, name: article.nom, price: article.prix, categoryId: article.famille, vignette: vignetteDe(article) });
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_minmax(380px,420px)] lg:grid-rows-1">
      {/* Catalogue */}
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-col gap-3 border-b border-line bg-surface-page px-4 pt-4 pb-3 sm:px-5">
          <label className="relative flex h-12 items-center rounded-2xl border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
            <span className="sr-only">Rechercher un article</span>
            <Search className="ml-4 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher un article (carton, valise, TV…)"
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {recherche && (
              <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="mr-1 grid size-10 place-items-center rounded-xl text-ink-muted">
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </label>

          <div role="tablist" aria-label="Familles d'articles" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 [scrollbar-width:none]">
            {familles.map((f) => {
              const choisie = !recherche.trim() && familleAffichee === f.cle;
              const n = quantiteFamille(f.cle);
              return (
                <button
                  key={f.cle}
                  type="button"
                  role="tab"
                  aria-selected={choisie}
                  onClick={() => {
                    setFamille(f.cle);
                    setRecherche("");
                  }}
                  className={cn(
                    "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[15px] whitespace-nowrap",
                    choisie ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white font-medium text-ink"
                  )}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: f.teinte.trait }} />
                  {f.nom}
                  {n > 0 && (
                    <span className={cn("chiffres rounded-full px-1.5 text-xs font-semibold", choisie ? "bg-white/20" : "bg-brand-soft text-brand-strong")}>{n}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {chargement ? (
            <ul className="grid grid-cols-3 gap-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="h-[196px] animate-pulse rounded-2xl bg-white" />
              ))}
            </ul>
          ) : erreur ? (
            <p role="alert" className="rounded-2xl bg-danger-soft p-6 text-center text-danger">{erreur}</p>
          ) : articles.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">
              {recherche.trim() ? `Aucun article pour « ${recherche.trim()} ».` : "Aucun article dans cette famille."}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 xl:grid-cols-4">
              {articles.map((a) => {
                const q = quantiteDe(a);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => toucher(a)}
                      className={cn(
                        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-[0_1px_2px_rgba(15,23,20,.04)] active:scale-[.98]",
                        q > 0 ? "border-2 border-brand" : "border-line"
                      )}
                    >
                      {a.image ? (
                        <VignetteArticle article={a} taille="h-24 w-full" className="rounded-none" />
                      ) : (
                        <span className="grid h-24 place-items-center" style={{ background: a.teinte.fond }}>
                          <VignetteArticle article={a} taille="size-16" icone="size-10" />
                        </span>
                      )}
                      {q > 0 && (
                        <span className="chiffres absolute top-2 right-2 grid h-8 min-w-8 place-items-center rounded-full bg-brand px-2 text-sm font-semibold text-white shadow">
                          {q}
                        </span>
                      )}
                      <span className="flex flex-1 flex-col gap-0.5 p-3">
                        <span className="line-clamp-2 font-semibold leading-snug">{a.nom}</span>
                        {a.detail && <span className="line-clamp-1 text-xs text-ink-subtle">{a.detail}</span>}
                        <span className={cn("chiffres mt-auto pt-1 text-base font-semibold", a.surDevis && "font-caisse text-sm font-medium text-alerte")}>
                          {a.surDevis ? "Sur devis" : formatMontant(a.prix)}
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

      {/* Ticket : en bas en portrait (hauteur limitée), à droite en paysage */}
      <Ticket
        onQuantite={setLigneQuantite}
        className="max-h-[44dvh] border-t border-line shadow-[0_-6px_18px_rgba(15,23,20,.06)] lg:max-h-none lg:border-t-0 lg:border-l lg:shadow-none"
      />

      {devis && (
        <FeuilleDevis
          article={devis}
          onFermer={() => setDevis(null)}
          onAjouter={({ prix, description }) => {
            addItem({
              id: `${devis.id}:devis:${Date.now()}`,
              type: devis.code,
              vignette: vignetteDe(devis),
              name: description || devis.nom,
              description: description ? devis.nom : null,
              price: prix,
              categoryId: devis.famille,
            });
            toast.success(`${description || devis.nom} ajouté au ticket.`);
            setDevis(null);
          }}
        />
      )}

      {ligneQuantite && (
        <FeuilleQuantite
          ligne={ligneQuantite}
          onFermer={() => setLigneQuantite(null)}
          onRetirer={() => {
            removeItem(ligneQuantite.id);
            setLigneQuantite(null);
          }}
          onValider={(q) => {
            setItemQuantity(ligneQuantite.id, q);
            setLigneQuantite(null);
          }}
        />
      )}
    </div>
  );
}

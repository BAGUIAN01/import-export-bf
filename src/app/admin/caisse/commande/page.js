"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { useCaisse } from "@/contexts/caisse-context";
import { GardeClient } from "@/components/caisse/sans-client";
import { Ticket } from "@/components/caisse/colis/ticket";
import { FeuilleDevis, FeuilleQuantite } from "@/components/caisse/colis/feuilles-saisie";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { articlesDe, chercherArticles } from "@/lib/caisse/familles";
import { useCatalogue } from "@/hooks/use-catalogue";
import { iconeDe } from "@/lib/caisse/icones";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

/**
 * Caisse · 2. Colis
 * Colonne des familles, articles en tuiles illustrées ; un toucher ajoute
 * un article au ticket, « sur devis » ouvre le clavier de prix.
 * Paysage et PC : commande à gauche, familles au milieu, articles à droite.
 * Portrait : catalogue en haut, commande en bas. Tuiles de même taille partout.
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
  const familles = useMemo(() => catalogue?.familles || [], [catalogue]);
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

  const nbParFamille = useMemo(() => {
    const n = {};
    for (const f of familles) n[f.cle] = articlesDe(catalogue, f.cle).length;
    return n;
  }, [catalogue, familles]);
  const titre = recherche.trim()
    ? `${articles.length} résultat${articles.length > 1 ? "s" : ""} pour « ${recherche.trim()} »`
    : familles.find((f) => f.cle === familleAffichee)?.nom || "";

  return (
    // Comme la caisse dogtorso : en paysage (PC, tablette couchée), la commande
    // à gauche, la colonne des familles au milieu, les articles à droite ;
    // en portrait, le catalogue en haut et la commande en bas.
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4 lg:flex-row-reverse lg:gap-4">
      {/* Catalogue : familles + articles */}
      <section
        aria-label="Catalogue des tarifs"
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,20,.04)] sm:flex-row"
      >
        <nav
          aria-label="Familles d'articles"
          className="flex shrink-0 gap-1.5 overflow-x-auto overscroll-contain border-b border-line bg-surface-page p-2 [scrollbar-width:none] sm:w-[116px] sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-2.5"
        >
          {familles.map((f) => {
            const actif = !recherche.trim() && familleAffichee === f.cle;
            const Icone = f.cle === "frequents" ? Star : iconeDe(f.icone);
            const dansTicket = quantiteFamille(f.cle);
            return (
              <button
                key={f.cle}
                type="button"
                aria-pressed={actif}
                onClick={() => {
                  setFamille(f.cle);
                  setRecherche("");
                }}
                className={cn(
                  "relative flex min-h-[64px] min-w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] px-1 py-2 text-center sm:min-h-[82px] sm:min-w-0",
                  actif ? "bg-brand text-white shadow-[0_4px_12px_rgba(14,122,85,.25)]" : "text-ink hover:bg-white"
                )}
              >
                <Icone className="size-6" strokeWidth={1.8} aria-hidden="true" style={actif ? undefined : { color: f.teinte.trait }} />
                <span lang="fr" className="text-[13px] font-semibold leading-4 [hyphens:auto] [overflow-wrap:break-word]">{f.nom}</span>
                <span className={cn("chiffres text-[11px]", actif ? "text-white/80" : "text-ink-subtle")}>{nbParFamille[f.cle] ?? 0}</span>
                {dansTicket > 0 && (
                  <span
                    aria-label={`${dansTicket} dans le ticket`}
                    className={cn("chiffres absolute top-1.5 right-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold", actif ? "bg-white text-brand-strong" : "bg-brand text-white")}
                  >
                    {dansTicket}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-line px-4 pt-3.5 pb-2.5">
            <label className="relative flex h-[52px] items-center rounded-[14px] border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="sr-only">Rechercher un article</span>
              <Search className="ml-4 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Chercher dans tout le catalogue : carton, valise, TV…"
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {recherche && (
                <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="mr-1 grid size-10 place-items-center rounded-xl text-ink-muted">
                  <X className="size-5" aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
          <div className="flex items-baseline justify-between gap-3 px-4 pt-2.5">
            <span className="truncate text-[15px] font-semibold">{titre}</span>
            <span className="shrink-0 text-xs text-ink-subtle">Prix en euros</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-4">
            {chargement ? (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="h-[196px] animate-pulse rounded-[14px] bg-surface-muted" />
                ))}
              </ul>
            ) : erreur ? (
              <p role="alert" className="rounded-[14px] bg-danger-soft p-6 text-center text-danger">{erreur}</p>
            ) : articles.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-muted">
                {recherche.trim() ? "Aucun article trouvé." : "Aucun article dans cette famille."}
              </p>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
                {articles.map((a) => {
                  const q = quantiteDe(a);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => toucher(a)}
                        className={cn(
                          "relative flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-white text-left active:scale-[.98]",
                          q > 0 ? "border-2 border-brand bg-[#F3FAF6]" : "border border-line hover:border-line-strong"
                        )}
                      >
                        {a.image ? (
                          <VignetteArticle article={a} taille="h-24 w-full" className="rounded-none" />
                        ) : (
                          <span className="grid h-24 place-items-center" style={{ background: a.teinte.fond }}>
                            <VignetteArticle article={a} taille="size-16" icone="size-10" />
                          </span>
                        )}
                        <span
                          aria-label={q ? `${q} dans le ticket` : "Ajouter"}
                          className={cn(
                            "chiffres absolute top-2.5 right-2.5 grid size-[30px] place-items-center rounded-full text-[13px] font-semibold shadow-sm",
                            q ? "bg-brand text-white" : "bg-white/90 text-brand"
                          )}
                        >
                          {q || <Plus className="size-4" aria-hidden="true" />}
                        </span>
                        <span className="flex flex-1 flex-col gap-0.5 p-3">
                          <span className="line-clamp-2 text-[15px] font-medium leading-5">{a.nom}</span>
                          {a.detail && <span className="line-clamp-1 text-xs text-ink-subtle">{a.detail}</span>}
                          <span className={cn("chiffres mt-auto pt-1 text-lg font-semibold", a.surDevis && "font-caisse text-sm font-medium text-alerte")}>
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
      </section>

      {/* Commande : à gauche en paysage, en bas en portrait */}
      <Ticket
        onQuantite={setLigneQuantite}
        className="max-h-[44dvh] shrink-0 overflow-hidden rounded-[18px] border border-line shadow-[0_1px_2px_rgba(15,23,20,.04)] lg:h-full lg:max-h-none lg:w-[420px] xl:w-[460px] min-[1680px]:w-[560px]"
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

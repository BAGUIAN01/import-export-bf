"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Kit des pages de gestion, design dogtorso épuré :
 * un en-tête (chemin + titre + action), une rangée de chiffres (la première
 * noire), des onglets soulignés, des filtres en pastilles grises, une
 * recherche, puis un tableau (PC) qui devient une liste de cartes (tablette).
 */

export const PRINCIPAL =
  "flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)] hover:bg-brand-strong disabled:opacity-50";
export const SECONDAIRE =
  "flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 text-[15px] font-semibold text-ink hover:bg-surface-muted disabled:opacity-50";

/** En-tête de page : « Gestion / Conteneurs », titre, actions à droite. */
export function EnTete({ chemin, titre, sousTitre, actions, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        {chemin && <p className="hidden text-[13px] text-ink-muted sm:block">{chemin}</p>}
        <h1 className="flex flex-wrap items-center gap-2 text-[28px] leading-tight font-semibold tracking-tight sm:text-2xl">
          {titre}
          {children}
        </h1>
        {sousTitre && <p className="text-[15px] text-ink-muted">{sousTitre}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const BORDURES = {
  vert: "border-brand/55",
  bleu: "border-blue-500/55",
  orange: "border-orange-500/55",
  violet: "border-violet-500/55",
  ambre: "border-amber-500/60",
  rose: "border-rose-500/55",
};

/** Carte de chiffre : la première d'une rangée est `noire`, les autres blanches à bordure de couleur. */
export function StatCard({ label, value, detail, variant = "default", couleur = "vert", className }) {
  const noire = variant === "noire";
  return (
    <div
      className={cn(
        "flex min-w-[132px] flex-col gap-0.5 rounded-xl border-2 px-3 py-2.5 sm:min-w-0 sm:gap-1.5 sm:rounded-2xl sm:p-[18px]",
        noire ? "border-ink bg-ink text-white shadow-[0_8px_20px_rgba(15,23,20,.16)]" : cn("bg-white text-ink shadow-[0_1px_2px_rgba(15,23,20,.04)]", BORDURES[couleur] ?? BORDURES.vert),
        className
      )}
    >
      <span className={cn("text-xs sm:text-[13px]", noire ? "text-white/70" : "text-ink-muted")}>{label}</span>
      <span className="chiffres whitespace-nowrap text-[19px] font-medium leading-tight tracking-tight sm:text-[28px]">{value}</span>
      {detail != null && <span className={cn("max-w-[180px] truncate text-[11px] sm:max-w-none sm:text-xs", noire ? "text-white/70" : "text-ink-muted")}>{detail}</span>}
    </div>
  );
}

/** Rangée de chiffres : bande compacte qui défile au doigt sur téléphone, grille sur tablette et PC. */
export function StatGrid({ children, className }) {
  return (
    <section
      className={cn(
        "-mx-3 flex shrink-0 snap-x scroll-px-3 gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&>*]:shrink-0 [&>*]:snap-start sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] md:gap-4",
        className
      )}
    >
      {children}
    </section>
  );
}

/** Onglets soulignés (parties d'un même écran). `options` : [{ id, label, icon?, compte? }]. */
export function Onglets({ options, valeur, onChange, libelle = "Parties de la page", className }) {
  return (
    <div role="tablist" aria-label={libelle} className={cn("-mx-3 flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 [scrollbar-width:none] sm:mx-0 sm:px-0", className)}>
      {options.map(({ id, label, icon: Icone, compte }) => {
        const actif = valeur === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(id)}
            className={cn("relative flex h-12 shrink-0 items-center gap-2.5 px-3.5 text-[15px]", actif ? "font-semibold text-ink" : "font-medium text-ink-muted hover:text-ink")}
          >
            {Icone && (
              <span className={cn("grid size-7 place-items-center rounded-lg", actif ? "bg-brand-soft text-brand-strong" : "bg-surface-muted text-ink-muted")}>
                <Icone className="size-4" aria-hidden="true" />
              </span>
            )}
            {label}
            {compte != null && <span className={cn("chiffres text-xs", actif ? "text-brand-strong" : "text-ink-subtle")}>{compte}</span>}
            <span aria-hidden="true" className={cn("absolute inset-x-2 -bottom-px h-[3px] rounded-full", actif ? "bg-brand" : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}

/** Filtres d'une liste en pastilles grises. `options` : [{ id, label, compte? }]. */
export function Pastilles({ options, valeur, onChange, libelle = "Filtrer" }) {
  return (
    <div role="radiogroup" aria-label={libelle} className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:px-0">
      {options.map(({ id, label, compte }) => {
        const actif = valeur === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(id)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
              actif ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink hover:bg-surface-muted"
            )}
          >
            {label}
            {compte != null && <span className={cn("chiffres text-xs", actif ? "text-white/75" : "text-ink-subtle")}>{compte}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Champ de recherche de liste. */
export function Recherche({ valeur, onChange, placeholder = "Rechercher", libelle = "Rechercher", className }) {
  return (
    <label className={cn("relative flex h-12 min-w-0 items-center rounded-xl border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20", className)}>
      <span className="sr-only">{libelle}</span>
      <Search className="ml-3.5 size-[18px] shrink-0 text-ink-muted" aria-hidden="true" />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {valeur && (
        <button type="button" onClick={() => onChange("")} aria-label="Effacer la recherche" className="mr-1 grid size-10 place-items-center rounded-lg text-ink-muted">
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      )}
    </label>
  );
}

const TONS = {
  vert: "bg-brand-soft text-brand-strong",
  ambre: "bg-alerte-soft text-alerte",
  bleu: "bg-info-soft text-info",
  rouge: "bg-danger-soft text-danger",
  gris: "bg-surface-muted text-ink-muted",
  violet: "bg-[#EEE8F6] text-[#5B3E8C]",
};

/** Petit libellé d'état (une seule couleur douce, pas de bordure). */
export function Etat({ ton = "gris", children, className }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", TONS[ton] || TONS.gris, className)}>{children}</span>;
}

/**
 * Tableau sur PC et tablette ; liste groupée sur téléphone (comme une application).
 * `colonnes` : [{ id, titre, rendu: (ligne) => node, classe?, aDroite?,
 *   mobile?: "titre" | "detail" (défaut) | "droite" | "etat" | false,
 *   mobileRendu?: (ligne) => node (texte court sur téléphone, ex. « 23/120 colis » ; null = rien),
 *   bureau?: false (colonne du téléphone seulement) }]
 * `actions` : (ligne) => node, à droite ; sur téléphone seulement si la ligne ne
 * s'ouvre pas (sinon dans sa fiche), ou avec `actionsMobile`.
 */
export function Tableau({ colonnes, lignes, cle = "id", onLigne, chargement, vide = "Aucun résultat.", actions, actionsMobile, libelle, parPage = 40 }) {
  // Longues listes : 40 lignes, puis la suite quand on arrive en bas (ou « Voir plus »)
  const [nombre, setNombre] = useState(parPage);
  const fin = useRef(null);
  const signature = `${lignes.length}:${lignes[0]?.[cle] ?? ""}`;
  useEffect(() => setNombre(parPage), [signature, parPage]);
  const reste = lignes.length - nombre;
  useEffect(() => {
    if (reste <= 0 || !fin.current || typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver((e) => e[0].isIntersecting && setNombre((n) => n + parPage), { rootMargin: "400px" });
    o.observe(fin.current);
    return () => o.disconnect();
  }, [reste, parPage]);

  if (chargement) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }
  if (!lignes.length) {
    return <p className="rounded-2xl border border-dashed border-line-strong bg-white py-10 text-center text-[15px] text-ink-muted">{vide}</p>;
  }
  const bureau = colonnes.filter((c) => c.bureau !== false);
  const tel = colonnes.filter((c) => c.mobile !== false);
  const titre = tel.find((c) => c.mobile === "titre") || tel[0];
  const droite = tel.find((c) => c.mobile === "droite");
  const etat = tel.find((c) => c.mobile === "etat");
  const details = tel.filter((c) => c !== titre && c !== droite && c !== etat);
  const rendu = (c, l) => (c.mobileRendu || c.rendu)(l);
  // Téléphone : les actions d'une ligne qu'on ouvre passent dans sa fiche
  const avecActions = actions && (actionsMobile ?? !onLigne);
  const visibles = reste > 0 ? lignes.slice(0, nombre) : lignes;

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
        <table className="w-full min-w-[720px] text-left" aria-label={libelle}>
          <thead className="border-b border-line text-[13px] text-ink-muted">
            <tr>
              {bureau.map((c) => (
                <th key={c.id} scope="col" className={cn("px-4 py-3 font-medium", c.aDroite && "text-right", c.classe)}>
                  {c.titre}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visibles.map((l) => (
              <tr
                key={l[cle]}
                onClick={onLigne ? () => onLigne(l) : undefined}
                className={cn(onLigne && "cursor-pointer hover:bg-surface-page")}
              >
                {bureau.map((c) => (
                  <td key={c.id} className={cn("px-4 py-3 align-middle text-[15px]", c.aDroite && "text-right", c.classe)}>
                    {c.rendu(l)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    {actions(l)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Téléphone : liste groupée comme une application (titre, détail, valeur et état à droite) */}
      <ul aria-label={libelle} className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white md:hidden">
        {visibles.map((l) => {
          const morceaux = details.map((c) => ({ id: c.id, v: rendu(c, l) })).filter((m) => m.v != null && m.v !== false && m.v !== "" && m.v !== "—");
          return (
            <li key={l[cle]}>
              <div
                role={onLigne ? "button" : undefined}
                tabIndex={onLigne ? 0 : undefined}
                onClick={onLigne ? () => onLigne(l) : undefined}
                onKeyDown={onLigne ? (e) => e.key === "Enter" && onLigne(l) : undefined}
                className={cn("flex min-h-16 items-center gap-3 px-4 py-3", onLigne && "cursor-pointer select-none active:bg-surface-page")}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold leading-snug">{rendu(titre, l)}</div>
                  {morceaux.length > 0 && (
                    <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">
                      {morceaux.map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && (
                            <span aria-hidden="true" className="mx-1 text-ink-subtle">
                              ·
                            </span>
                          )}
                          {m.v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {(droite || etat) && (
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    {droite && <div className="text-[15px] font-semibold">{rendu(droite, l)}</div>}
                    {etat && rendu(etat, l)}
                  </div>
                )}
                {avecActions && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {actions(l)}
                  </div>
                )}
                {onLigne && !avecActions && <ChevronRight className="-mr-1 size-5 shrink-0 text-ink-subtle" aria-hidden="true" />}
              </div>
            </li>
          );
        })}
      </ul>
      {reste > 0 && (
        <div ref={fin} className="flex justify-center pt-1">
          <button type="button" onClick={() => setNombre((n) => n + parPage)} className="h-11 rounded-xl px-4 text-sm font-semibold text-brand-strong hover:bg-brand-soft">
            Voir plus <span className="chiffres font-normal text-ink-muted">({reste})</span>
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Téléphone : action principale d'une liste en bouton flottant, au-dessus des
 * onglets du bas (sur tablette et PC, elle reste dans l'en-tête).
 */
export function BoutonFlottant({ libelle, icone: Icone = Plus, onClick }) {
  return (
    <>
      <div aria-hidden="true" className="h-16 md:hidden" />
      <button
        type="button"
        onClick={onClick}
        className="fixed right-4 z-30 flex h-14 items-center gap-2 rounded-2xl bg-brand pr-5 pl-4 font-semibold text-white shadow-[0_8px_24px_rgba(14,122,85,.35)] active:scale-[.97] md:hidden"
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 16px)" }}
      >
        <Icone className="size-5" aria-hidden="true" />
        {libelle}
      </button>
    </>
  );
}

/** Bloc blanc arrondi (infos d'une fiche). */
export function Bloc({ titre, actions, children, className }) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-2xl border border-line bg-white p-5", className)}>
      {(titre || actions) && (
        <div className="flex items-center justify-between gap-3">
          {titre && <h2 className="text-base font-semibold">{titre}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Lignes « libellé : valeur » d'un bloc. */
export function Infos({ lignes }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px]">
      {lignes
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([libelle, valeur]) => (
          <div key={libelle} className="contents">
            <dt className="text-ink-muted">{libelle}</dt>
            <dd className="min-w-0 break-words">{valeur}</dd>
          </div>
        ))}
    </dl>
  );
}

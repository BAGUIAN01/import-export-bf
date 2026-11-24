"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { cn } from "@/lib/utils";

const correspond = (chemin, href) => chemin === href || chemin.startsWith(`${href}/`);

/**
 * Barre d'onglets en bas de l'écran, sur téléphone (comme une application) :
 * icône dans une pastille quand l'onglet est actif, libellé dessous.
 * Au-delà de 5 onglets, les suivants passent dans « Plus » (feuille du bas),
 * avec les `liens` en plus (tableau de bord, paramétrage…).
 * `onglets`, `liens` : [{ href, libelle, court?, icone }] (`court` : libellé sous l'icône).
 */
export function OngletsBas({ onglets = [], liens = [] }) {
  const chemin = (usePathname() || "").replace(/\/$/, "");
  const [plus, setPlus] = useState(false);

  const visibles = onglets.length + liens.length > 5 ? onglets.slice(0, 4) : onglets;
  const autres = [...onglets.slice(visibles.length), ...liens];
  // Actif : le lien le plus précis (« /admin » ne s'allume pas sur toutes les pages)
  const hrefActif = [...onglets, ...liens]
    .map((o) => o.href)
    .filter((h) => correspond(chemin, h))
    .sort((a, b) => b.length - a.length)[0];
  const estActif = (_chemin, href) => href === hrefActif;
  const plusActif = autres.some((o) => estActif(chemin, o.href));
  if (!visibles.length) return null;

  const cellule = (actif, Icone, libelle) => (
    <>
      <span
        aria-hidden="true"
        className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", actif ? "bg-brand-soft text-brand-strong" : "text-ink-muted")}
      >
        <Icone className="size-[22px]" strokeWidth={actif ? 2.2 : 1.8} />
      </span>
      <span className={cn("max-w-full truncate px-1 text-[11px] leading-none", actif ? "font-semibold text-ink" : "font-medium text-ink-muted")}>{libelle}</span>
    </>
  );

  return (
    <>
      <nav
        aria-label="Navigation"
        className="caisse shrink-0 border-t border-line bg-white/95 font-caisse backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${visibles.length + (autres.length ? 1 : 0)}, minmax(0, 1fr))` }}>
          {visibles.map((o) => {
            const actif = estActif(chemin, o.href);
            return (
              <li key={o.href}>
                <Link
                  href={o.href}
                  aria-current={actif ? "page" : undefined}
                  aria-label={o.court ? o.libelle : undefined}
                  className="flex h-16 flex-col items-center justify-center gap-1 select-none active:opacity-70"
                >
                  {cellule(actif, o.icone, o.court || o.libelle)}
                </Link>
              </li>
            );
          })}
          {autres.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setPlus(true)}
                aria-haspopup="dialog"
                className="flex h-16 w-full flex-col items-center justify-center gap-1 select-none active:opacity-70"
              >
                {cellule(plusActif, MoreHorizontal, "Plus")}
              </button>
            </li>
          )}
        </ul>
      </nav>

      <Feuille ouvert={plus} onFermer={() => setPlus(false)} titre="Plus">
        <ul className="-mx-2 flex flex-col gap-1">
          {autres.map((o) => {
            const Icone = o.icone;
            const actif = estActif(chemin, o.href);
            return (
              <li key={o.href}>
                <Link
                  href={o.href}
                  onClick={() => setPlus(false)}
                  aria-current={actif ? "page" : undefined}
                  className={cn("flex h-14 items-center gap-3 rounded-2xl px-3", actif ? "bg-brand-soft/60" : "active:bg-surface-page")}
                >
                  <span aria-hidden="true" className={cn("grid size-10 place-items-center rounded-xl", actif ? "bg-brand text-white" : "bg-surface-muted text-ink-muted")}>
                    <Icone className="size-5" />
                  </span>
                  <span className="flex-1 font-semibold">{o.libelle}</span>
                  <ChevronRight className="size-5 text-ink-subtle" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Feuille>
    </>
  );
}

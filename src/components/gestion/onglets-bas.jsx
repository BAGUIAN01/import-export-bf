"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, ScanLine } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { VIBRATIONS, vibrer } from "@/lib/vibrer";
import { cn } from "@/lib/utils";

const correspond = (chemin, href) => chemin === href || chemin.startsWith(`${href}/`);

/** Couleur de la tuile de chaque module dans « Plus » (comme l'accueil des modules). */
const TEINTES = {
  "/admin/shipments": "bg-info-soft text-info",
  "/admin/retraits": "bg-brand-soft text-brand-strong",
  "/admin/tarifs": "bg-alerte-soft text-alerte",
  "/admin/packages": "bg-alerte-soft text-alerte",
  "/admin/clients": "bg-info-soft text-info",
  "/admin/containers": "bg-brand-soft text-brand-strong",
  "/admin/dashboard": "bg-[#F3E8FF] text-[#6B21A8]",
  "/admin/parametrage": "bg-surface-muted text-ink-muted",
  "/admin": "bg-ink text-white",
};

/** Ouvre le scanneur de la recherche générale (barre du haut). */
export function ouvrirScanneur() {
  vibrer(VIBRATIONS.leger);
  window.dispatchEvent(new CustomEvent("recherche:ouvrir", { detail: { scanner: true } }));
}

/**
 * Barre d'onglets du téléphone : une capsule sombre qui flotte au-dessus du
 * contenu (il défile dessous), l'onglet actif dans une pastille verte.
 * `scanner` : gros bouton « Scanner » au centre (la recherche par QR code).
 * Ce qui ne tient pas (avec les `liens`) passe dans « Plus », une grille de
 * tuiles comme l'accueil des modules.
 * `onglets`, `liens` : [{ href, libelle, court?, icone }] (`court` : libellé sous l'icône).
 */
export function OngletsBas({ onglets = [], liens = [], scanner = false }) {
  const chemin = (usePathname() || "").replace(/\/$/, "");
  const [plus, setPlus] = useState(false);

  // Places de la capsule : 5, dont le scanneur s'il y est ; « Plus » prend la dernière si besoin
  const places = scanner ? 4 : 5;
  const visibles = onglets.length + liens.length > places ? onglets.slice(0, places - 1) : onglets.slice(0, places);
  const autres = [...onglets.slice(visibles.length), ...liens];
  const affichee = visibles.length > 0;

  // Le contenu garde de la place en bas pour défiler au-dessus de la capsule (globals.css)
  useEffect(() => {
    if (!affichee) return;
    document.body.classList.add("avec-onglets-bas");
    return () => document.body.classList.remove("avec-onglets-bas");
  }, [affichee]);

  if (!affichee) return null;

  // Actif : le lien le plus précis (« /admin » ne s'allume pas sur toutes les pages)
  const hrefActif = [...onglets, ...liens]
    .map((o) => o.href)
    .filter((h) => correspond(chemin, h))
    .sort((a, b) => b.length - a.length)[0];
  const plusActif = autres.some((o) => o.href === hrefActif);

  const cellule = (actif, Icone, libelle) => (
    <>
      <span
        aria-hidden="true"
        className={cn("grid h-[30px] w-[52px] place-items-center rounded-full transition-colors duration-200", actif ? "bg-brand text-white" : "text-white/65")}
      >
        <Icone className="size-[21px]" strokeWidth={actif ? 2.2 : 1.9} />
      </span>
      <span className={cn("max-w-full truncate px-0.5 text-[11px] leading-none", actif ? "font-semibold text-white" : "font-medium text-white/65")}>{libelle}</span>
    </>
  );

  const cases = [
    ...visibles.map((o) => {
      const actif = o.href === hrefActif;
      return (
        <li key={o.href}>
          <Link
            href={o.href}
            aria-current={actif ? "page" : undefined}
            aria-label={o.court ? o.libelle : undefined}
            className="flex h-[68px] flex-col items-center justify-center gap-1.5 select-none active:opacity-70"
          >
            {cellule(actif, o.icone, o.court || o.libelle)}
          </Link>
        </li>
      );
    }),
    ...(autres.length
      ? [
          <li key="plus">
            <button
              type="button"
              onClick={() => setPlus(true)}
              aria-haspopup="dialog"
              className="flex h-[68px] w-full flex-col items-center justify-center gap-1.5 select-none active:opacity-70"
            >
              {cellule(plusActif, MoreHorizontal, "Plus")}
            </button>
          </li>,
        ]
      : []),
  ];
  // Le scanneur au milieu, les onglets répartis de part et d'autre
  if (scanner) {
    cases.splice(
      Math.ceil(cases.length / 2),
      0,
      <li key="scanner" className="flex justify-center">
        <button
          type="button"
          onClick={ouvrirScanneur}
          aria-label="Scanner un code"
          className="group flex h-[68px] flex-col items-center justify-end gap-1.5 pb-[10px] select-none"
        >
          <span
            aria-hidden="true"
            className="grid size-[60px] shrink-0 place-items-center rounded-full border-4 border-ink bg-brand text-white shadow-[0_6px_16px_rgba(14,122,85,.45)] transition-transform group-active:scale-95"
          >
            <ScanLine className="size-[26px]" strokeWidth={2.2} />
          </span>
          <span className="text-[11px] leading-none font-semibold text-white">Scanner</span>
        </button>
      </li>
    );
  }

  return (
    <>
      <nav
        aria-label="Navigation"
        className="onglets-bas caisse pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 font-caisse md:hidden"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <ul
          className="pointer-events-auto grid h-[68px] rounded-[26px] bg-ink px-1 shadow-[0_14px_34px_rgba(15,23,20,.30)]"
          style={{ gridTemplateColumns: `repeat(${cases.length}, minmax(0, 1fr))` }}
        >
          {cases}
        </ul>
      </nav>

      <Feuille ouvert={plus} onFermer={() => setPlus(false)} titre="Plus">
        <ul className="grid grid-cols-3 gap-2.5">
          {autres.map((o) => {
            const Icone = o.icone;
            const actif = o.href === hrefActif;
            return (
              <li key={o.href}>
                <Link
                  href={o.href}
                  onClick={() => setPlus(false)}
                  aria-current={actif ? "page" : undefined}
                  aria-label={o.court ? o.libelle : undefined}
                  className={cn(
                    "flex h-[108px] flex-col items-center justify-center gap-2.5 rounded-[20px] border px-1 text-center",
                    actif ? "border-2 border-brand bg-brand-soft/50" : "border-line bg-surface-page active:bg-surface-muted"
                  )}
                >
                  <span aria-hidden="true" className={cn("grid size-12 place-items-center rounded-2xl", TEINTES[o.href] || "bg-surface-muted text-ink-muted")}>
                    <Icone className="size-6" />
                  </span>
                  <span className="line-clamp-2 max-w-full px-1 text-sm leading-tight font-semibold">{o.court || o.libelle}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Feuille>
    </>
  );
}

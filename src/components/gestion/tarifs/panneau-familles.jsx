"use client";

import { useEffect, useRef } from "react";
import { List, Plus } from "lucide-react";
import { iconeDe } from "@/lib/caisse/icones";
import { teinte } from "@/lib/caisse/familles";
import { cn } from "@/lib/utils";

/** Une famille est absente de la caisse si aucun de ses articles n'y est proposé. */
export const absenteDeLaCaisse = (f) => !f.articles.some((a) => a.proposeCaisse);

function Ligne({ choisie, onClick, icone: Icone, couleurs, libelle, compte, alerte }) {
  return (
    <button
      type="button"
      aria-pressed={choisie}
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center gap-2.5 rounded-xl border-2 px-2.5 py-1 text-left",
        choisie ? "border-brand bg-brand-soft" : "border-transparent hover:bg-surface-page"
      )}
    >
      <span
        aria-hidden="true"
        className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", choisie ? "bg-white text-brand-strong" : !couleurs && "bg-surface-muted text-ink")}
        style={couleurs && !choisie ? { background: couleurs.fond, color: couleurs.trait } : undefined}
      >
        <Icone className="size-5" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold text-ink">{libelle}</span>
        {alerte && <span className="truncate text-[13px] font-medium text-danger">{alerte}</span>}
      </span>
      <span className="chiffres text-sm text-ink-muted">{compte}</span>
    </button>
  );
}

/**
 * Familles du catalogue, comme le panneau des modules de dogtorso : à gauche
 * sur ordinateur (« Toutes », puis une ligne par famille, « Nouvelle famille »
 * en bas) ; sur téléphone et tablette, une rangée de puces qui défile.
 * `choisie` : id de la famille, ou "toutes".
 */
export function PanneauFamilles({ familles, total, choisie, modifiable, onChoisir, onNouvelle }) {
  const rangee = useRef(null);

  // Téléphone : la puce choisie est ramenée dans la rangée (sans faire défiler la page)
  useEffect(() => {
    const r = rangee.current;
    const el = r?.querySelector("[aria-pressed=true]");
    if (!r || !el || !r.clientWidth) return;
    const gauche = el.offsetLeft - r.offsetLeft;
    if (gauche < r.scrollLeft || gauche + el.offsetWidth > r.scrollLeft + r.clientWidth) {
      r.scrollTo({ left: gauche - (r.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [choisie, familles.length]);

  const puce = (active) =>
    cn(
      "flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-[15px] font-semibold whitespace-nowrap",
      active ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line-strong bg-white text-ink"
    );

  return (
    <>
      {/* Téléphone et tablette : puces qui défilent */}
      <div ref={rangee} role="group" aria-label="Familles" className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:-mx-4 sm:px-4 lg:hidden">
        <button type="button" aria-pressed={choisie === "toutes"} onClick={() => onChoisir("toutes")} className={puce(choisie === "toutes")}>
          Toutes <span className="chiffres text-[13px] font-medium">{total}</span>
        </button>
        {familles.map((f) => {
          const Icone = iconeDe(f.icone);
          return (
            <button key={f.id} type="button" aria-pressed={choisie === f.id} onClick={() => onChoisir(f.id)} className={puce(choisie === f.id)}>
              <Icone className="size-[18px]" strokeWidth={1.9} style={{ color: teinte(f.teinte).trait }} aria-hidden="true" />
              {f.nom}
              <span className="chiffres text-[13px] font-medium">{f.articles.length}</span>
            </button>
          );
        })}
        {modifiable && (
          <button type="button" onClick={onNouvelle} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold whitespace-nowrap text-brand-strong hover:bg-brand-soft">
            <Plus className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            Famille
          </button>
        )}
      </div>

      {/* Ordinateur : panneau gauche, qui reste visible en faisant défiler les articles */}
      <aside aria-label="Familles" className="hidden max-h-[calc(100dvh-72px-3rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white lg:sticky lg:top-0 lg:flex">
        <div className="flex min-h-0 flex-col gap-0.5 overflow-y-auto p-2">
          <Ligne choisie={choisie === "toutes"} onClick={() => onChoisir("toutes")} icone={List} libelle="Toutes" compte={total} />
          {familles.map((f) => (
            <Ligne
              key={f.id}
              choisie={choisie === f.id}
              onClick={() => onChoisir(f.id)}
              icone={iconeDe(f.icone)}
              couleurs={teinte(f.teinte)}
              libelle={f.nom}
              compte={f.articles.length}
              alerte={absenteDeLaCaisse(f) ? "Absente de la caisse" : null}
            />
          ))}
        </div>
        {modifiable && (
          <button type="button" onClick={onNouvelle} className="flex h-[52px] shrink-0 items-center gap-2.5 border-t border-line px-4 text-[15px] font-semibold text-brand-strong hover:bg-brand-soft">
            <Plus className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            Nouvelle famille
          </button>
        )}
      </aside>
    </>
  );
}

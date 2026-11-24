"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pavé numérique à l'écran : le clavier du système ne s'ouvre pas et les
 * touches font au moins 56 px. `onTouche` reçoit "0".."9", "00", "," ou "⌫".
 */
export function Clavier({ onTouche, decimales = 2, hauteur = "h-14", className }) {
  const touches = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimales > 0 ? "," : "00", "0", "⌫"];
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {touches.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onTouche(t)}
          aria-label={t === "⌫" ? "Effacer le dernier chiffre" : t === "," ? "Virgule" : t}
          className={cn(
            "chiffres grid select-none place-items-center rounded-2xl border border-line bg-white text-2xl font-medium text-ink",
            "shadow-[0_1px_0_rgba(15,23,20,.06)] active:scale-[.97] active:bg-surface-muted",
            hauteur,
            t === "⌫" && "bg-surface-muted text-ink-muted"
          )}
        >
          {t === "⌫" ? <Delete className="size-6" aria-hidden="true" /> : t}
        </button>
      ))}
    </div>
  );
}

/** Afficheur au-dessus du clavier : grand chiffre, libellé, unité. */
export function Afficheur({ libelle, valeur, unite, vide = "0", className }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface-page px-4 py-3", className)}>
      <div className="text-xs font-medium text-ink-muted">{libelle}</div>
      <div className="flex items-baseline justify-end gap-2">
        <output className={cn("chiffres text-4xl font-semibold tracking-tight", !valeur && "text-line-strong")}>
          {valeur || vide}
        </output>
        {unite && <span className="chiffres text-lg text-ink-muted">{unite}</span>}
      </div>
    </div>
  );
}

// lib/export-csv.js : lignes → fichier CSV lisible par Excel en français.
// Séparateur « ; », nombres à virgule, BOM UTF-8 (accents). Fonctions pures,
// sauf telechargerCsv. Vérifiables avec : node --test src/lib/export-csv.test.mjs

function cellule(v) {
  if (v == null) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v).replace(".", ",") : "";
  if (v instanceof Date) return v.toLocaleDateString("fr-FR");
  const t = String(v);
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** [{ Colonne: valeur, … }] → texte CSV (colonnes de la première ligne, puis les nouvelles). */
export function versCsv(lignes) {
  const colonnes = [];
  for (const l of lignes) for (const c of Object.keys(l)) if (!colonnes.includes(c)) colonnes.push(c);
  const entete = colonnes.map(cellule).join(";");
  const corps = lignes.map((l) => colonnes.map((c) => cellule(l[c])).join(";"));
  return [entete, ...corps].join("\r\n");
}

/** « colis-2026-11-25.csv » */
export function nomFichierCsv(nom, date = new Date()) {
  const j = (n) => String(n).padStart(2, "0");
  return `${nom}-${date.getFullYear()}-${j(date.getMonth() + 1)}-${j(date.getDate())}.csv`;
}

/** Télécharge les lignes en CSV (navigateur). */
export function telechargerCsv(nom, lignes) {
  const blob = new Blob(["﻿" + versCsv(lignes)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichierCsv(nom);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

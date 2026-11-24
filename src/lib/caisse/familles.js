// lib/caisse/familles.js
// Familles et articles de la caisse, construits à partir du catalogue
// existant (lib/data/packages.js) : une teinte par famille, une liste
// « Fréquents » pour l'accès en un toucher.

import { PACKAGE_TYPES, PACKAGE_CATEGORIES } from "@/lib/data/packages";

/** Couleurs des tuiles : fond de l'image et couleur du dessin. */
export const TEINTES = {
  ambre: { fond: "#FEF3E2", trait: "#B45309" },
  vert: { fond: "#E6F4EE", trait: "#0A5C40" },
  bleu: { fond: "#E8EFFD", trait: "#1D4ED8" },
  violet: { fond: "#F1EBFA", trait: "#6B46A8" },
  gris: { fond: "#EEF0EF", trait: "#3F4A45" },
  sable: { fond: "#F6EFE3", trait: "#8A5A1F" },
  rose: { fond: "#FCE9EF", trait: "#A8325A" },
  cyan: { fond: "#E3F4F7", trait: "#0E6B7A" },
};

const TEINTE_FAMILLE = {
  cartons: "ambre",
  futs: "violet",
  bagages: "cyan",
  cantines: "vert",
  electromenager: "bleu",
  tv: "gris",
  mobilier: "sable",
  vins: "rose",
  vehicules: "gris",
  divers: "vert",
  enlevement: "cyan",
};

/** Articles proposés dans « Fréquents » (codes de PACKAGE_TYPES). */
const FREQUENTS = [
  "CARTON",
  "CARTON_MEDIUM",
  "CARTON_LARGE",
  "BARRIQUE",
  "FUT_BLACK_270L",
  "VALISE_MEDIUM",
  "VALISE_LARGE",
  "SAC_LARGE",
  "CANTINE_MEDIUM",
  "TV_55",
  "FRIDGE_STANDARD",
  "ENLEVEMENT",
];

function teinteDe(categorie) {
  return TEINTES[TEINTE_FAMILLE[categorie]] || TEINTES.gris;
}

/** Tous les articles, avec leur teinte et un identifiant stable. */
export const ARTICLES = PACKAGE_TYPES.map((t) => ({
  id: `${t.category}:${t.value}:${t.label}`,
  code: t.value,
  nom: t.label,
  detail: t.desc || "",
  prix: t.price || 0,
  surDevis: !!t.isQuoteOnly,
  famille: t.category,
  icone: t.icon,
  teinte: teinteDe(t.category),
}));

/** Familles affichées en puces : « Fréquents » puis celles du catalogue. */
export const FAMILLES = [
  { cle: "frequents", nom: "Fréquents", teinte: TEINTES.vert },
  ...PACKAGE_CATEGORIES.map((c) => ({ cle: c.key, nom: c.label, teinte: teinteDe(c.key) })),
];

/** Articles d'une famille ; « frequents » suit l'ordre de FREQUENTS. */
export function articlesDe(cle) {
  if (cle === "frequents") {
    return FREQUENTS.map((code) => ARTICLES.find((a) => a.code === code && !a.surDevis)).filter(Boolean);
  }
  return ARTICLES.filter((a) => a.famille === cle);
}

/** Recherche sans accents sur le nom, le détail et le code. */
export function chercherArticles(texte) {
  const q = sansAccents(texte).trim();
  if (!q) return [];
  return ARTICLES.filter((a) => sansAccents(`${a.nom} ${a.detail} ${a.code}`).includes(q));
}

export function sansAccents(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

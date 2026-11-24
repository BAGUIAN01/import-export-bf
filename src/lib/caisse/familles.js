// lib/caisse/familles.js
// Catalogue de la caisse : familles (teinte, icône) et articles (prix, photo).
// Les données vivent en base (FamilleArticle, Article, écran Gestion › Tarifs) ;
// ce module fournit les teintes, la reprise initiale depuis lib/data/packages.js
// et la mise en forme pour la caisse.

import { PACKAGE_TYPES, PACKAGE_CATEGORIES } from "@/lib/data/packages";
import { nomIcone } from "@/lib/caisse/icones";

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

export function teinte(nom) {
  return TEINTES[nom] || TEINTES.gris;
}

/* ── Reprise initiale du catalogue (premier démarrage) ─────────── */

const DEPART_FAMILLES = {
  cartons: { teinte: "ambre", icone: "package" },
  futs: { teinte: "violet", icone: "cylinder" },
  bagages: { teinte: "cyan", icone: "luggage" },
  cantines: { teinte: "vert", icone: "archive" },
  electromenager: { teinte: "bleu", icone: "refrigerator" },
  tv: { teinte: "gris", icone: "tv" },
  mobilier: { teinte: "sable", icone: "armchair" },
  vins: { teinte: "rose", icone: "wine" },
  vehicules: { teinte: "gris", icone: "car" },
  divers: { teinte: "vert", icone: "package" },
  enlevement: { teinte: "cyan", icone: "map-pin" },
};

const DEPART_FREQUENTS = [
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

/** Familles et articles de lib/data/packages.js, au format des tables. */
export function catalogueInitial() {
  const familles = PACKAGE_CATEGORIES.map((c, i) => ({
    cle: c.key,
    nom: c.label,
    teinte: DEPART_FAMILLES[c.key]?.teinte || "gris",
    icone: DEPART_FAMILLES[c.key]?.icone || "package",
    ordre: i,
  }));
  const articles = PACKAGE_TYPES.map((t, i) => ({
    code: t.value,
    nom: t.label,
    detail: t.desc || null,
    prix: t.price || 0,
    surDevis: !!t.isQuoteOnly,
    famille: t.category,
    icone: nomIcone(t.icon),
    frequent: !t.isQuoteOnly && DEPART_FREQUENTS.includes(t.value),
    ordre: i,
  }));
  return { familles, articles };
}

/* ── Mise en forme pour la caisse ───────────────────────────────── */

/** URL de la photo d'un article (versionnée pour le cache). */
export function urlImage(article) {
  if (!article?.aImage) return null;
  const v = article.updatedAt ? new Date(article.updatedAt).getTime() : "";
  return `/api/tarifs/articles/${article.id}/image?v=${v}`;
}

/**
 * Réponse de GET /api/tarifs → catalogue de la caisse :
 * familles (« Fréquents » d'abord) et articles prêts à afficher.
 */
export function construireCatalogue(famillesApi = []) {
  const familles = famillesApi.map((f) => ({ cle: f.cle, nom: f.nom, teinte: teinte(f.teinte), icone: f.icone }));
  const articles = famillesApi.flatMap((f) =>
    (f.articles || []).map((a) => ({
      id: a.id,
      code: a.code,
      nom: a.nom,
      detail: a.detail || "",
      prix: a.prix || 0,
      surDevis: !!a.surDevis,
      frequent: !!a.frequent,
      famille: f.cle,
      icone: a.icone || f.icone,
      teinte: teinte(f.teinte),
      image: urlImage(a),
    }))
  );
  const aFrequents = articles.some((a) => a.frequent);
  return {
    familles: [...(aFrequents ? [{ cle: "frequents", nom: "Fréquents", teinte: TEINTES.vert, icone: "package" }] : []), ...familles],
    articles,
  };
}

export function articlesDe(catalogue, cle) {
  if (!catalogue) return [];
  if (cle === "frequents") return catalogue.articles.filter((a) => a.frequent && !a.surDevis);
  return catalogue.articles.filter((a) => a.famille === cle);
}

/** Recherche sans accents sur le nom, le détail et le code. */
export function chercherArticles(catalogue, texte) {
  const q = sansAccents(texte).trim();
  if (!q || !catalogue) return [];
  return catalogue.articles.filter((a) => sansAccents(`${a.nom} ${a.detail} ${a.code}`).includes(q));
}

/** Dessin d'une ligne enregistrée avant le catalogue en base (repli). */
export function vignetteParCode(code) {
  const t = PACKAGE_TYPES.find((x) => x.value === code);
  if (!t) return { icone: "package", teinte: TEINTES.gris, image: null };
  return { icone: nomIcone(t.icon), teinte: teinte(DEPART_FAMILLES[t.category]?.teinte), image: null };
}

export function sansAccents(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

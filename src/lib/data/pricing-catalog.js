// lib/data/pricing-catalog.js
// Règles communes de la grille tarifaire (table `pricings`) : écran Tarifs,
// routes API, caisse, formulaire de colis et site public lisent toutes ce module.
// Module pur (pas de React, pas de Prisma) pour pouvoir l'importer partout.

export const PRICE_MODES = {
  FIXED: "Prix fixe",
  FROM: "À partir de",
  QUOTE: "Sur devis",
};

// Catégories : la clé est celle de PACKAGE_CATEGORIES (lib/data/packages.js).
// `subtitle` et `highlighted` ne servent qu'à la grille du site public.
export const PRICING_CATEGORIES = [
  { key: "cartons", label: "Cartons", subtitle: "Région Parisienne / Province", highlighted: true },
  { key: "futs", label: "Fûts / Barriques", subtitle: "Région Parisienne / Province" },
  { key: "bagages", label: "Bagages & Sacs", subtitle: "Valises et sacs" },
  { key: "cantines", label: "Cantines", subtitle: "Toutes tailles" },
  { key: "electromenager", label: "Électroménager", subtitle: "Frigos, congélateurs, lave-linge" },
  { key: "tv", label: "Téléviseurs", subtitle: "Toutes tailles" },
  { key: "mobilier", label: "Mobilier", subtitle: "Chaises, fauteuils, literie" },
  { key: "vins", label: "Vins & Champagnes", subtitle: "Cartons de bouteilles" },
  { key: "vehicules", label: "Véhicules", subtitle: "Voitures & deux-roues" },
  { key: "divers", label: "Divers", subtitle: "Autres envois" },
  { key: "enlevement", label: "Enlèvement", subtitle: "À domicile" },
];

// L'enlèvement n'a pas de carte sur le site : il s'affiche en une ligne sous la grille.
export const SITE_FOOTNOTE_CATEGORY = "enlevement";

const CATEGORY_KEYS = new Set(PRICING_CATEGORIES.map((c) => c.key));
const CATEGORY_ORDER = new Map(PRICING_CATEGORIES.map((c, i) => [c.key, i]));

export function categoryLabel(key) {
  return PRICING_CATEGORIES.find((c) => c.key === key)?.label ?? "Sans catégorie";
}

export function formatEuro(value) {
  if (value == null || !Number.isFinite(Number(value))) return "";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value))} €`;
}

// Ce que le client lit sur le site : « 120 € / 160 € », « dès 280 € », « Sur devis ».
export function formatSitePrice(row) {
  if (!row || row.priceMode === "QUOTE") return "Sur devis";
  const base = formatEuro(row.basePrice);
  if (row.priceMode === "FROM") return `dès ${base}`;
  if (row.priceProvince != null) return `${base} / ${formatEuro(row.priceProvince)}`;
  return base;
}

// Tri : ordre des catégories, puis ordre dans la catégorie, puis nom.
export function comparePricing(a, b) {
  const ca = CATEGORY_ORDER.get(a.category) ?? 999;
  const cb = CATEGORY_ORDER.get(b.category) ?? 999;
  if (ca !== cb) return ca - cb;
  if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  return String(a.name).localeCompare(String(b.name), "fr");
}

// Une ligne de la table → un type au format de PACKAGE_TYPES (sans icône),
// pour que la caisse et le formulaire de colis n'aient rien d'autre à changer.
export function toCatalogType(row) {
  const isQuoteOnly = row.priceMode === "QUOTE";
  return {
    id: row.id,
    value: row.type,
    label: row.name,
    desc: row.description || "",
    price: isQuoteOnly ? 0 : row.basePrice,
    ...(row.priceProvince != null && !isQuoteOnly ? { priceProvince: row.priceProvince } : {}),
    ...(isQuoteOnly ? { isQuoteOnly: true } : {}),
    priceMode: row.priceMode,
    category: row.category,
    imageUrl: row.imageUrl || null,
    isActive: row.isActive,
    showOnWebsite: row.showOnWebsite,
  };
}

// Code technique d'un nouvel article : « Trottinette électrique » → TROTTINETTE_ELECTRIQUE.
export function typeCodeFromName(name) {
  const code = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return code || "ARTICLE";
}

function toPrice(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/**
 * Valide le corps d'une création (partial=false) ou d'une modification (partial=true).
 * Un champ absent du corps (undefined) n'est pas touché ; `null` le vide.
 * Retourne { data, errors } ; `errors` est vide si tout va bien.
 */
export function validatePricingInput(body = {}, { partial = false, current = null } = {}) {
  const data = {};
  const errors = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has("name")) {
    const name = String(body.name ?? "").trim();
    if (!name) errors.name = "Le nom de l'article est requis";
    else if (name.length > 80) errors.name = "80 caractères au maximum";
    else data.name = name;
  }

  if (has("description")) {
    const d = body.description == null ? "" : String(body.description).trim();
    if (d.length > 120) errors.description = "120 caractères au maximum";
    else data.description = d || null;
  }

  if (!partial || has("category")) {
    if (!CATEGORY_KEYS.has(body.category)) errors.category = "Choisissez une catégorie";
    else data.category = body.category;
  }

  if (!partial || has("priceMode")) {
    if (!PRICE_MODES[body.priceMode]) errors.priceMode = "Type de prix inconnu";
    else data.priceMode = body.priceMode;
  }

  const mode = data.priceMode ?? current?.priceMode ?? "FIXED";

  if (mode === "QUOTE") {
    // Sur devis : pas de prix affiché. On garde basePrice à 0 (colonne obligatoire).
    if (!partial || has("priceMode") || has("basePrice")) data.basePrice = 0;
    if (!partial || has("priceMode") || has("priceProvince")) data.priceProvince = null;
  } else {
    if (!partial || has("basePrice") || has("priceMode")) {
      const base = toPrice(has("basePrice") ? body.basePrice : current?.basePrice);
      if (base == null || Number.isNaN(base)) errors.basePrice = "Indiquez le prix Région parisienne";
      else if (base < 0) errors.basePrice = "Le prix ne peut pas être négatif";
      else data.basePrice = base;
    }
    if (has("priceProvince")) {
      const prov = toPrice(body.priceProvince);
      if (Number.isNaN(prov)) errors.priceProvince = "Prix Province invalide";
      else if (prov != null && prov < 0) errors.priceProvince = "Le prix ne peut pas être négatif";
      else data.priceProvince = prov;
    }
  }

  for (const flag of ["showOnWebsite", "isActive"]) {
    if (has(flag)) data[flag] = Boolean(body[flag]);
  }

  if (has("sortOrder")) {
    const n = Number(body.sortOrder);
    if (Number.isInteger(n)) data.sortOrder = n;
  }

  return { data, errors };
}

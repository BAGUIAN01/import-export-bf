// lib/caisse/montants.js
// Calculs et formats de la caisse (fonctions pures, sans React).
// Vérifiables avec : node --test src/lib/caisse/montants.test.mjs

/** Devise de la caisse. Les tarifs actuels (lib/data/packages.js) sont en euros. */
export const DEVISE = { code: "EUR", symbole: "€", decimales: 2 };

/** Arrondi au centime (ou à `decimales`), sans les erreurs de virgule flottante. */
export function arrondi(n, decimales = DEVISE.decimales) {
  const v = Number(n) || 0;
  // Décalage par la notation exponentielle : 1.005 → "1.005e2" = 100.5 (et non 100.4999…)
  const decale = Number(`${v}e${decimales}`);
  if (!Number.isFinite(decale)) return Math.round(v * 10 ** decimales) / 10 ** decimales;
  return Number(`${Math.round(decale)}e-${decimales}`);
}

/** 1234.5 → "1 234,50 €" (espace fine insécable entre les milliers). */
export function formatMontant(n, devise = DEVISE) {
  const texte = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: devise.decimales,
    maximumFractionDigits: devise.decimales,
  }).format(arrondi(n, devise.decimales));
  return `${texte.replace(/\s/g, " ")} ${devise.symbole}`;
}

/** 1234.5 → "1 234,50" (sans symbole), pour l'afficheur du clavier. */
export function formatNombre(n, decimales = DEVISE.decimales) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
    .format(arrondi(n, decimales))
    .replace(/\s/g, " ");
}

/** "12,5" → 12.5 ; texte vide ou invalide → 0. */
export function saisieVersNombre(saisie) {
  const n = parseFloat(String(saisie ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Applique une touche du clavier à l'écran à une saisie texte.
 * Touches : "0".."9", "00", ",", "⌫", "C".
 * `decimales` : 0 pour une quantité, 2 pour un montant.
 */
export function toucheClavier(saisie, touche, { decimales = DEVISE.decimales, longueurMax = 9 } = {}) {
  const s = String(saisie ?? "");
  if (touche === "C") return "";
  if (touche === "⌫") return s.slice(0, -1);
  if (touche === ",") {
    if (decimales === 0 || s.includes(",")) return s;
    return (s || "0") + ",";
  }
  if (!/^\d+$/.test(touche)) return s;
  const [entier, fraction] = s.split(",");
  if (fraction !== undefined) {
    if (fraction.length >= decimales) return s;
    return s + touche.slice(0, decimales - fraction.length);
  }
  if (entier.replace(/^0+/, "").length + touche.length > longueurMax) return s;
  const suite = (entier === "0" ? "" : entier) + touche;
  return suite.replace(/^0+(?=\d)/, "") || "0";
}

/**
 * Montant de la remise. `remise` = { type: "pourcent" | "montant", valeur }.
 * Toujours entre 0 et le sous-total.
 */
export function calculerRemise(sousTotal, remise) {
  if (!remise || !(remise.valeur > 0)) return 0;
  const brut = remise.type === "pourcent" ? (sousTotal * remise.valeur) / 100 : remise.valeur;
  return arrondi(Math.min(Math.max(0, brut), Math.max(0, sousTotal)));
}

/**
 * Répartit l'argent reçu : ce qui est encaissé (borné au net), la monnaie
 * à rendre (espèces seulement) et le reste dû.
 * Mode « ARRIVEE » : rien n'est encaissé, tout est dû au retrait.
 */
export function repartirPaiement(net, recu, mode) {
  const netA = arrondi(net);
  if (mode === "ARRIVEE") return { paye: 0, monnaie: 0, reste: netA };
  const r = arrondi(Math.max(0, recu));
  const paye = Math.min(r, netA);
  return {
    paye,
    monnaie: mode === "ESPECES" ? arrondi(Math.max(0, r - netA)) : 0,
    reste: arrondi(netA - paye),
  };
}

/** Montants proposés en un toucher : le net exact puis les coupures au-dessus. */
export function montantsRapides(net) {
  const n = arrondi(net);
  if (n <= 0) return [];
  const paliers = [5, 10, 20, 50, 100, 200, 500];
  const propositions = [n];
  for (const p of paliers) {
    const v = Math.ceil(n / p) * p;
    if (v > n && !propositions.includes(v)) propositions.push(v);
    if (propositions.length >= 4) break;
  }
  return propositions;
}

/** Initiales pour l'avatar : « OUEDRAOGO Rasmata » → « OR ». */
export function initiales(nom = "") {
  const mots = String(nom).trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  return ((mots[0][0] || "") + (mots.length > 1 ? mots[mots.length - 1][0] : "")).toUpperCase();
}

/** Saisie du clavier affichée avec les milliers : « 374184 » → « 374 184 », « 1250,5 » → « 1 250,5 ». */
export function grouperSaisie(saisie) {
  const s = String(saisie ?? "");
  if (!s) return "";
  const [entier, fraction] = s.split(",");
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fraction !== undefined ? `${groupe},${fraction}` : groupe;
}

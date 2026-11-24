// lib/devises.js : devises des agences (fonctions pures).
// Les tarifs et les montants enregistrés sont dans la devise de référence (EUR).
// Une agence dans une autre devise affiche et encaisse dans sa devise :
// 1 € = `taux` unités de la devise de l'agence.
// Vérifiables avec : node --test src/lib/devises.test.mjs

import { arrondi, formatMontant } from "./caisse/montants.js";

export const DEVISE_REFERENCE = "EUR";

export const DEVISES = {
  EUR: { code: "EUR", symbole: "€", libelle: "Euro", decimales: 2 },
  XOF: { code: "XOF", symbole: "FCFA", libelle: "Franc CFA", decimales: 0 },
  USD: { code: "USD", symbole: "$", libelle: "Dollar US", decimales: 2 },
};

/** Parités fixes officielles : 1 € = 655,957 FCFA (zone franc). */
export const PARITES_FIXES = { EUR: 1, XOF: 655.957 };

export function devise(code) {
  return DEVISES[code] || DEVISES.EUR;
}

/** Taux effectif d'une agence : la parité fixe si elle s'applique, sinon le taux saisi. */
export function tauxAgence(agence) {
  if (!agence || agence.devise === DEVISE_REFERENCE) return 1;
  if (agence.pariteFixe && PARITES_FIXES[agence.devise]) return PARITES_FIXES[agence.devise];
  return agence.taux > 0 ? agence.taux : 1;
}

/** Montant en euros → devise de l'agence (arrondi à l'unité pour le FCFA). */
export function versDevise(montantReference, agence) {
  const d = devise(agence?.devise);
  return arrondi((Number(montantReference) || 0) * tauxAgence(agence), d.decimales);
}

/** Montant dans la devise de l'agence → euros (pour l'enregistrer). */
export function versReference(montantDevise, agence) {
  return arrondi((Number(montantDevise) || 0) / tauxAgence(agence), 2);
}

/** « 142 500 FCFA » à partir d'un montant en euros. */
export function formatDevise(montantReference, agence) {
  return formatMontant(versDevise(montantReference, agence), devise(agence?.devise));
}

/** « 1 € = 655,957 FCFA » */
export function libelleTaux(agence) {
  if (!agence || agence.devise === DEVISE_REFERENCE) return "Devise de référence";
  const t = tauxAgence(agence);
  return `1 € = ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(t)} ${devise(agence.devise).symbole}`;
}

// lib/telephone.js : numéros de téléphone avec indicatif (fonctions pures).
// Stockage : format international sans espaces (« +33612345678 », « +22670123456 »).
// Vérifiables avec : node --test src/lib/telephone.test.mjs

import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js/min";
import { INDICATIFS } from "./data/indicatifs.js";

const PAR_ISO = Object.fromEntries(INDICATIFS.map((c) => [c.iso2, c]));
// Indicatifs les plus longs d'abord : « +226 » avant « +22 »
const PAR_INDICATIF = [...INDICATIFS].sort((a, b) => b.dial.length - a.dial.length);

export const chiffres = (s) => (String(s ?? "").match(/\d/g) || []).join("");

export function paysTelephone(iso2) {
  return PAR_ISO[iso2] || PAR_ISO.FR;
}

/** Nombre maximal de chiffres du numéro national (d'après l'exemple du pays). */
export function longueurMax(iso2) {
  return chiffres(paysTelephone(iso2).sample).length || 10;
}

/** « 0612345678 » + FR → « 06 12 34 56 78 » (coupé à la longueur du pays). */
export function formaterNational(saisie, iso2) {
  const d = chiffres(saisie).slice(0, longueurMax(iso2));
  if (!d) return "";
  return new AsYouType(iso2).input(d);
}

/** Numéro national + pays → « +33612345678 » ; vide si aucun chiffre. */
export function versInternational(national, iso2) {
  const d = chiffres(national);
  if (!d) return "";
  const p = parsePhoneNumberFromString(d, iso2);
  if (p?.number) return p.number;
  return `${paysTelephone(iso2).dial}${d.replace(/^0/, "")}`;
}

/**
 * Valeur stockée → { iso2, national } pour l'affichage dans le champ.
 * Accepte « +22670123456 », « 0022670123456 » ou un numéro national.
 */
export function lireTelephone(valeur, isoParDefaut = "FR") {
  const v = String(valeur ?? "").trim();
  if (!v) return { iso2: isoParDefaut, national: "" };
  if (v.startsWith("+") || v.startsWith("00")) {
    const international = `+${chiffres(v).replace(/^00/, "")}`;
    const p = parsePhoneNumberFromString(international);
    if (p?.country && PAR_ISO[p.country]) {
      return { iso2: p.country, national: formaterNational(p.formatNational(), p.country) };
    }
    const d = chiffres(international);
    const pays = PAR_INDICATIF.find((c) => d.startsWith(chiffres(c.dial)));
    if (pays) {
      const reste = d.slice(chiffres(pays.dial).length);
      // France : le numéro national commence par 0
      const national = pays.iso2 === "FR" && reste && !reste.startsWith("0") ? `0${reste}` : reste;
      return { iso2: pays.iso2, national: formaterNational(national, pays.iso2) };
    }
  }
  return { iso2: isoParDefaut, national: formaterNational(v, isoParDefaut) };
}

/** Normalise une saisie libre en format international (pays par défaut si pas d'indicatif). */
export function normaliserTelephone(valeur, isoParDefaut = "FR") {
  const { iso2, national } = lireTelephone(valeur, isoParDefaut);
  return versInternational(national, iso2);
}

export function telephoneValide(international) {
  const p = parsePhoneNumberFromString(String(international ?? ""));
  return !!p?.isValid();
}

/** « +22670123456 » → « +226 70 12 34 56 » ; une valeur non reconnue reste telle quelle. */
export function affichageTelephone(valeur) {
  const v = String(valeur ?? "").trim();
  if (!v) return "";
  const p = parsePhoneNumberFromString(v.startsWith("00") ? `+${v.slice(2)}` : v, "FR");
  return p?.isValid() ? p.formatInternational() : v;
}

/**
 * Pour chercher un client par téléphone : chiffres sans 0 ni 00 de tête,
 * qui se retrouvent dans « +33612345678 » comme dans « 0612345678 ».
 * Renvoie null si la saisie n'est pas un numéro.
 */
export function rechercheTelephone(saisie) {
  const s = String(saisie ?? "").trim();
  if (!/^[+\d][\d\s.\-()]*$/.test(s)) return null;
  const d = chiffres(s).replace(/^00/, "").replace(/^0/, "");
  return d.length >= 4 ? d : null;
}

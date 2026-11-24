// lib/retraits.js : remise des colis au destinataire (fonctions pures).
import { arrondi } from "./caisse/montants.js";
import { versDevise, versReference } from "./devises.js";

/** Reste dû en euros sur un envoi. */
export function resteEnvoi(envoi) {
  return arrondi(Math.max(0, (envoi?.totalAmount || 0) - (envoi?.paidAmount || 0)));
}

/**
 * Montant tapé dans la devise de l'agence → euros à enregistrer.
 * Si l'agent encaisse exactement le reste affiché, on enregistre le reste
 * exact en euros (pas d'écart d'arrondi de conversion).
 */
export function paiementEnEuros(montantDevise, envoi, agence) {
  const reste = resteEnvoi(envoi);
  const resteDevise = versDevise(reste, agence);
  if (Number(montantDevise) >= resteDevise) return reste;
  return Math.min(reste, versReference(montantDevise, agence));
}

/** La remise est possible : tout est vérifié, tout est payé, un nom est donné. */
export function remisePossible({ colis, verifies, reste, nom }) {
  return colis.length > 0 && colis.every((c) => verifies.includes(c.id)) && reste <= 0.009 && String(nom || "").trim().length > 0;
}

// lib/caisse/paiement.js : modes de paiement de la caisse.
// Les valeurs sont celles que POST /api/caisse/orders traduit vers l'enum
// Prisma PaymentMethod (ESPECES → CASH, CARTE → CARD, MOBILE → MOBILE_MONEY,
// VIREMENT → TRANSFER). « ARRIVEE » : rien n'est encaissé, le destinataire
// paie au retrait (paymentStatus PENDING).

export const MODES_PAIEMENT = [
  { valeur: "ESPECES", libelle: "Espèces", reference: false },
  { valeur: "CARTE", libelle: "Carte", reference: true },
  { valeur: "MOBILE", libelle: "Mobile money", reference: true },
  { valeur: "VIREMENT", libelle: "Virement", reference: true },
  { valeur: "ARRIVEE", libelle: "À l'arrivée", reference: false },
];

export function libelleMode(valeur) {
  return MODES_PAIEMENT.find((m) => m.valeur === valeur)?.libelle || valeur || "";
}

/** Remises proposées en un toucher. */
export const REMISES_RAPIDES = [
  { type: "pourcent", valeur: 5 },
  { type: "pourcent", valeur: 10 },
  { type: "pourcent", valeur: 15 },
  { type: "montant", valeur: 5 },
  { type: "montant", valeur: 10 },
  { type: "montant", valeur: 20 },
];

export const MOTIFS_REMISE = ["Fidélité", "Geste commercial", "Plusieurs colis", "Erreur de tarif"];

/** Note enregistrée avec l'envoi : note libre, référence, remise, paiement à l'arrivée. */
export function noteEnvoi({ note, reference, mode, remise }) {
  return [
    note?.trim(),
    reference?.trim() ? `Réf. paiement : ${reference.trim()}` : null,
    remise?.motif ? `Remise : ${remise.motif}` : null,
    mode === "ARRIVEE" ? "Paiement à l'arrivée" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// lib/conteneurs.js : étapes d'un conteneur et action suivante (fonctions pures).
// Un conteneur joue le rôle de la « session » de la caisse : on l'ouvre, il se
// remplit, on le ferme au départ (une à deux fois par mois), puis il arrive.

export const STATUTS_CONTENEUR = {
  PREPARATION: { libelle: "En chargement", classe: "bg-alerte-soft text-alerte", etape: 0 },
  LOADED: { libelle: "Fermé", classe: "bg-info-soft text-info", etape: 1 },
  IN_TRANSIT: { libelle: "En route", classe: "bg-info-soft text-info", etape: 2 },
  CUSTOMS: { libelle: "En douane", classe: "bg-[#EEE8F6] text-[#5B3E8C]", etape: 3 },
  DELIVERED: { libelle: "Arrivé", classe: "bg-brand-soft text-brand-strong", etape: 4 },
  CANCELLED: { libelle: "Annulé", classe: "bg-danger-soft text-danger", etape: -1 },
};

export const ETAPES_CONTENEUR = ["PREPARATION", "LOADED", "IN_TRANSIT", "CUSTOMS", "DELIVERED"];

/**
 * Action proposée pour faire avancer le conteneur.
 * `demandePlomb` : la fermeture demande le n° du plomb.
 */
export function actionSuivante(statut) {
  switch (statut) {
    case "PREPARATION":
      return { libelle: "Fermer le conteneur", statut: "LOADED", demandePlomb: true };
    case "LOADED":
      return { libelle: "Marquer parti", statut: "IN_TRANSIT", date: "actualDeparture" };
    case "IN_TRANSIT":
      return { libelle: "Marquer en douane", statut: "CUSTOMS" };
    case "CUSTOMS":
      return { libelle: "Marquer arrivé", statut: "DELIVERED", date: "actualArrival" };
    default:
      return null;
  }
}

/** Corps de PUT /api/containers/[id] pour l'action suivante. */
export function corpsAction(action, { plomb, maintenant = new Date() } = {}) {
  const corps = { status: action.statut };
  if (action.date) corps[action.date] = maintenant.toISOString();
  if (action.demandePlomb) corps.sealNumber = plomb || null;
  return corps;
}

/** Jours entre aujourd'hui et une date (négatif si passée), null sans date. */
export function joursAvant(date, maintenant = new Date()) {
  if (!date) return null;
  const a = new Date(maintenant);
  a.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - a) / 86400000);
}

/** Ordre d'affichage : en chargement d'abord, puis en route, puis arrivés. */
export function trierConteneurs(liste) {
  const rang = (c) => (c.status === "PREPARATION" || c.status === "LOADED" ? 0 : c.status === "DELIVERED" ? 2 : 1);
  return [...liste].sort((a, b) => rang(a) - rang(b) || new Date(b.departureDate || 0) - new Date(a.departureDate || 0));
}

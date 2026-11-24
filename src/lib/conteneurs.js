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

/**
 * Ce que demande chaque étape quand on y passe : date réelle (départ,
 * arrivée), n° de plomb (fermeture), lieu et message proposés pour le suivi.
 */
export const ETAPES_DETAIL = {
  PREPARATION: { court: "Chargement", verbe: "Rouvrir le chargement", message: "Le conteneur est en chargement." },
  LOADED: { court: "Fermé", verbe: "Fermer le conteneur", plomb: true, lieu: "Agence de départ", message: "Le conteneur est fermé et plombé." },
  IN_TRANSIT: { court: "Parti", verbe: "Marquer parti", date: "actualDeparture", lieu: "Port de départ", message: "Le conteneur est parti." },
  CUSTOMS: { court: "Douane", verbe: "Marquer en douane", lieu: "Douane", message: "Le conteneur est en douane." },
  DELIVERED: { court: "Arrivé", verbe: "Marquer arrivé", date: "actualArrival", lieu: "Agence d'arrivée", message: "Le conteneur est arrivé : les colis peuvent être retirés." },
};

/** Corps de PUT /api/containers/[id] pour passer à une étape. */
export function corpsEtape(statut, { date, plomb } = {}) {
  const e = ETAPES_DETAIL[statut];
  const corps = { status: statut };
  if (e?.date) corps[e.date] = (date ? new Date(date) : new Date()).toISOString();
  if (e?.plomb && plomb !== undefined) corps.sealNumber = String(plomb).trim() || null;
  return corps;
}

/** Vrai si l'étape `cible` vient avant l'étape actuelle (correction). */
export function estRecul(actuel, cible) {
  return ETAPES_CONTENEUR.indexOf(cible) < ETAPES_CONTENEUR.indexOf(actuel);
}

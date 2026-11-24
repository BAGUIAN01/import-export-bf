// lib/roles.js : profils du personnel (enum Prisma UserRole) tels qu'affichés.

export const ROLES_LIBELLES = {
  ADMIN: "Administrateur",
  CHEF_CAISSE: "Chef de caisse",
  STAFF: "Caissier",
  AGENT: "Agent de retrait",
  TRACKER: "Gestionnaire",
  CLIENT: "Client",
};

/** Profils proposés à la création d'un compte, avec ce qu'ils font. */
export const PROFILS = [
  { role: "STAFF", aide: "Enregistre les colis et encaisse à la caisse." },
  { role: "CHEF_CAISSE", aide: "La caisse, plus les remises, les conteneurs et les encaissements." },
  { role: "AGENT", aide: "Remet les colis aux destinataires à l'agence d'arrivée." },
  { role: "TRACKER", aide: "Conteneurs, colis, clients et tarifs ; pas la caisse." },
  { role: "ADMIN", aide: "Tout, y compris le paramétrage et les comptes." },
];

/** Droits qui ne sont pas un écran (affichés dans Profils et droits). */
export const DROITS_ACTIONS = [
  { libelle: "Accorder une remise à la caisse", roles: ["ADMIN", "CHEF_CAISSE"] },
  { libelle: "Créer et fermer un conteneur", roles: ["ADMIN", "CHEF_CAISSE", "TRACKER"] },
  { libelle: "Modifier les tarifs et les photos", roles: ["ADMIN", "TRACKER"] },
  { libelle: "Remettre des colis au destinataire", roles: ["ADMIN", "CHEF_CAISSE", "AGENT"] },
  { libelle: "Gérer les comptes et les agences", roles: ["ADMIN"] },
];

export function libelleRole(role) {
  return ROLES_LIBELLES[role] || role || "";
}

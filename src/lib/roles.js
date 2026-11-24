// lib/roles.js : libellés des rôles (enum Prisma UserRole) tels qu'affichés.

export const ROLES_LIBELLES = {
  ADMIN: "Administrateur",
  STAFF: "Caissier",
  AGENT: "Agent de retrait",
  TRACKER: "Gestionnaire",
  CLIENT: "Client",
};

export function libelleRole(role) {
  return ROLES_LIBELLES[role] || role || "";
}

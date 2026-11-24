// lib/caisse/clients.js : affichage des clients dans la caisse.

/** « OUÉDRAOGO Rasmata » : nom en capitales puis prénom. */
export function nomAffiche(c) {
  if (!c) return "";
  const nom = (c.lastName || "").trim().toLocaleUpperCase("fr-FR");
  const prenom = (c.firstName || "").trim();
  return [nom, prenom].filter(Boolean).join(" ") || c.company || c.name || "Sans nom";
}

/** Client prêt pour le contexte de la caisse (champ `name` attendu par le bordereau). */
export function versClientCaisse(c) {
  return { ...c, name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.company || "Sans nom" };
}

/** Reste dû sur les envois du client (montant total − déjà payé). */
export function resteDu(c) {
  const reste = (c?.totalShipmentsAmount || 0) - (c?.totalSpent || 0);
  return reste > 0.009 ? reste : 0;
}

/** « +226 70 12 34 56 », « +33 6 12 34 56 78 » ; une valeur non reconnue reste telle quelle. */
export { affichageTelephone as telephoneAffiche } from "@/lib/telephone";

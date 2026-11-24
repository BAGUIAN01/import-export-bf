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

/** « 06 12 34 56 78 » ou « +226 70 12 34 56 ». */
export function telephoneAffiche(tel) {
  if (!tel) return "";
  const t = String(tel).replace(/[^\d+]/g, "");
  if (t.startsWith("+33") && t.length === 12) return `+33 ${t.slice(3, 4)} ${t.slice(4).replace(/(\d{2})(?=\d)/g, "$1 ")}`;
  if (t.startsWith("+226") && t.length === 12) return `+226 ${t.slice(4).replace(/(\d{2})(?=\d)/g, "$1 ")}`;
  if (/^0\d{9}$/.test(t)) return t.replace(/(\d{2})(?=\d)/g, "$1 ");
  return tel;
}

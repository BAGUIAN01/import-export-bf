// lib/agences.js : agences (côté serveur).
import { prisma } from "@/lib/prisma";

export const MODES_PAIEMENT_AGENCE = ["ESPECES", "CARTE", "MOBILE", "VIREMENT", "ARRIVEE"];
export const DEVISES_VALIDES = ["EUR", "XOF", "USD"];
export const ROLES_AGENCE = ["DEPART", "ARRIVEE", "DEUX"];

/** Premier appel : les deux agences de départ et d'arrivée. */
export async function assurerAgences() {
  if ((await prisma.agence.count()) > 0) return;
  await prisma.agence.createMany({
    data: [
      {
        nom: "Agence de Paris",
        ville: "Paris",
        pays: "France",
        role: "DEPART",
        devise: "EUR",
        taux: 1,
        pariteFixe: true,
        modesPaiement: ["ESPECES", "CARTE", "MOBILE", "VIREMENT", "ARRIVEE"],
        prefixeRecu: "P-",
        ordre: 0,
      },
      {
        nom: "Agence de Ouagadougou",
        ville: "Ouagadougou",
        pays: "Burkina Faso",
        role: "ARRIVEE",
        devise: "XOF",
        taux: 655.957,
        pariteFixe: true,
        modesPaiement: ["ESPECES", "MOBILE"],
        prefixeRecu: "O-",
        ordre: 1,
      },
    ],
  });
}

/**
 * Agence de l'utilisateur ; sans rattachement, la première agence qui fait
 * le rôle demandé (DEPART pour la caisse, ARRIVEE pour les retraits).
 */
export async function agenceDe(userId, role = "DEPART") {
  await assurerAgences();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { agence: true } }) : null;
  if (user?.agence?.isActive) return user.agence;
  return prisma.agence.findFirst({
    where: { isActive: true, role: { in: [role, "DEUX"] } },
    orderBy: { ordre: "asc" },
  });
}

/** Corps de POST/PUT → { data } ou { erreur } (fonction pure). */
export function lireAgence(body, { partiel = false } = {}) {
  const data = {};
  const present = (k) => body[k] !== undefined;
  for (const [cle, libelle] of [["nom", "le nom"], ["ville", "la ville"], ["pays", "le pays"]]) {
    if (!partiel || present(cle)) {
      const v = String(body[cle] ?? "").trim();
      if (!v) return { erreur: `Indiquez ${libelle} de l'agence.` };
      data[cle] = v;
    }
  }
  if (present("role")) {
    if (!ROLES_AGENCE.includes(body.role)) return { erreur: "Rôle d'agence inconnu." };
    data.role = body.role;
  }
  if (present("devise")) {
    if (!DEVISES_VALIDES.includes(body.devise)) return { erreur: "Devise inconnue." };
    data.devise = body.devise;
  }
  if (present("pariteFixe")) data.pariteFixe = !!body.pariteFixe;
  if (present("taux")) {
    const t = Number(String(body.taux).replace(",", "."));
    if (!Number.isFinite(t) || t <= 0) return { erreur: "Le taux doit être un nombre positif." };
    data.taux = t;
  }
  if (present("modesPaiement")) {
    if (!Array.isArray(body.modesPaiement)) return { erreur: "Modes de paiement invalides." };
    data.modesPaiement = body.modesPaiement.filter((m) => MODES_PAIEMENT_AGENCE.includes(m));
  }
  if (present("prefixeRecu")) data.prefixeRecu = String(body.prefixeRecu ?? "").trim().toUpperCase().slice(0, 6) || "R-";
  if (present("adresse")) data.adresse = String(body.adresse ?? "").trim() || null;
  if (present("telephone")) data.telephone = String(body.telephone ?? "").trim() || null;
  if (present("isActive")) data.isActive = !!body.isActive;
  return { data };
}

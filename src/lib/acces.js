// lib/acces.js : contrôles d'accès des routes API (côté serveur).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Session de l'utilisateur ou réponse d'erreur.
 * `roles` : rôles autorisés (absent = toute personne connectée).
 * Usage : const { session, refus } = await exigerSession(["ADMIN"]); if (refus) return refus;
 */
export async function exigerSession(roles) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { refus: NextResponse.json({ error: "Connexion requise" }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.user.role)) {
    return { refus: NextResponse.json({ error: "Vous n'avez pas le droit de faire cette action" }, { status: 403 }) };
  }
  return { session };
}

/** Rôles qui modifient le catalogue des tarifs. */
export const ROLES_TARIFS = ["ADMIN", "TRACKER"];

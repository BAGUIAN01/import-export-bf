// lib/pricing-server.js
// Aides serveur partagées par les routes /api/pricing.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";

export async function requireSession({ adminOnly = false } = {}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  if (adminOnly && session.user?.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Seul l'administrateur peut modifier les tarifs" },
        { status: 403 }
      ),
    };
  }
  return { session };
}

export function authorName(session) {
  return session?.user?.name || session?.user?.email || null;
}

// La grille du site public (page d'accueil) se régénère à chaque modification.
export function refreshPublicPricing() {
  try {
    revalidatePath("/");
  } catch (e) {
    console.error("revalidatePath('/') a échoué :", e);
  }
}

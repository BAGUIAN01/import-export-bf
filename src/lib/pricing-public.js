// lib/pricing-public.js
// Lecture serveur de la grille affichée sur le site public (page d'accueil).
import { prisma } from "@/lib/prisma";
import { comparePricing } from "@/lib/data/pricing-catalog";

/**
 * Articles visibles sur le site, triés comme dans Gestion → Tarifs.
 * Retourne `null` si la base ne répond pas : la page garde alors sa grille d'origine.
 */
export async function getPublicPricing() {
  try {
    const rows = await prisma.pricing.findMany({
      where: { showOnWebsite: true, category: { not: null } },
      select: {
        type: true,
        name: true,
        description: true,
        category: true,
        sortOrder: true,
        priceMode: true,
        basePrice: true,
        priceProvince: true,
      },
    });
    rows.sort(comparePricing);
    return rows;
  } catch (e) {
    console.error("Grille tarifaire du site : lecture impossible", e);
    return null;
  }
}

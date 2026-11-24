// lib/tarifs.js : catalogue des tarifs en base (côté serveur).
import { prisma } from "@/lib/prisma";
import { catalogueInitial } from "@/lib/caisse/familles";

/** Premier appel : reprend le catalogue de lib/data/packages.js dans les tables. */
export async function assurerCatalogue() {
  const n = await prisma.familleArticle.count();
  if (n > 0) return;
  const { familles, articles } = catalogueInitial();
  await prisma.$transaction(async (tx) => {
    // Une autre requête a pu remplir les tables entre-temps
    if ((await tx.familleArticle.count()) > 0) return;
    const ids = {};
    for (const f of familles) {
      const cree = await tx.familleArticle.create({ data: f });
      ids[f.cle] = cree.id;
    }
    await tx.article.createMany({
      data: articles
        .filter((a) => ids[a.famille])
        .map(({ famille, ...a }) => ({ ...a, familleId: ids[famille] })),
    });
  });
}

const CHAMPS_ARTICLE = {
  id: true,
  code: true,
  nom: true,
  detail: true,
  prix: true,
  surDevis: true,
  icone: true,
  frequent: true,
  proposeCaisse: true,
  ordre: true,
  familleId: true,
  updatedAt: true,
};

/**
 * Familles avec leurs articles (sans les photos : `aImage` dit s'il y en a une).
 * `pourCaisse` : seulement ce que la caisse propose.
 */
export async function listerCatalogue({ pourCaisse = false } = {}) {
  await assurerCatalogue();
  const [familles, avecImage] = await Promise.all([
    prisma.familleArticle.findMany({
      where: { isActive: true },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      include: {
        articles: {
          where: { isActive: true, ...(pourCaisse ? { proposeCaisse: true } : {}) },
          orderBy: [{ ordre: "asc" }, { nom: "asc" }],
          select: CHAMPS_ARTICLE,
        },
      },
    }),
    prisma.article.findMany({ where: { image: { not: null } }, select: { id: true } }),
  ]);
  const images = new Set(avecImage.map((a) => a.id));
  return familles
    .map((f) => ({ ...f, articles: f.articles.map((a) => ({ ...a, aImage: images.has(a.id) })) }))
    .filter((f) => !pourCaisse || f.articles.length > 0);
}

/** Photo envoyée par l'écran Tarifs : data URL JPEG/PNG/WebP de moins de 600 Ko. */
export function imageValide(image) {
  if (image === null || image === undefined || image === "") return true;
  return typeof image === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) && image.length < 800_000;
}

export const TEINTES_VALIDES = ["ambre", "vert", "bleu", "violet", "gris", "sable", "rose", "cyan"];

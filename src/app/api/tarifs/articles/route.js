// POST /api/tarifs/articles : nouvel article du catalogue.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession, ROLES_TARIFS } from "@/lib/acces";
import { imageValide } from "@/lib/tarifs";
import { lireArticle } from "@/lib/tarifs-article";

export async function POST(request) {
  const { session, refus } = await exigerSession(ROLES_TARIFS);
  if (refus) return refus;
  try {
    const body = await request.json();
    const { data, erreur } = lireArticle(body);
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
    if (!imageValide(body.image)) return NextResponse.json({ error: "La photo n'est pas valable (JPEG, PNG ou WebP, moins de 600 Ko)." }, { status: 400 });
    if (!(await prisma.familleArticle.findUnique({ where: { id: data.familleId } }))) {
      return NextResponse.json({ error: "Famille introuvable." }, { status: 400 });
    }
    const ordre = (await prisma.article.aggregate({ where: { familleId: data.familleId }, _max: { ordre: true } }))._max.ordre ?? 0;
    const article = await prisma.article.create({
      data: { ...data, image: body.image || null, ordre: data.ordre ?? ordre + 1 },
      select: { id: true, code: true, nom: true, detail: true, prix: true, surDevis: true, icone: true, frequent: true, proposeCaisse: true, ordre: true, familleId: true, updatedAt: true, image: true },
    });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "CREATE_ARTICLE", resource: "article", resourceId: article.id, details: JSON.stringify({ nom: article.nom, prix: article.prix }) },
    });
    const { image, ...reste } = article;
    return NextResponse.json({ article: { ...reste, aImage: !!image } }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/tarifs/articles:", error);
    return NextResponse.json({ error: "L'article n'a pas pu être créé." }, { status: 500 });
  }
}

// PUT /api/tarifs/articles/[id] : modifier (photo comprise : `image` data URL, ou null pour l'enlever).
// DELETE /api/tarifs/articles/[id] : retirer du catalogue (masqué, l'historique des colis reste).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession, ROLES_TARIFS } from "@/lib/acces";
import { imageValide } from "@/lib/tarifs";
import { lireArticle } from "@/lib/tarifs-article";

const SELECTION = { id: true, code: true, nom: true, detail: true, prix: true, surDevis: true, icone: true, frequent: true, proposeCaisse: true, ordre: true, familleId: true, updatedAt: true, image: true };

export async function PUT(request, { params }) {
  const { session, refus } = await exigerSession(ROLES_TARIFS);
  if (refus) return refus;
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, erreur } = lireArticle(body, { partiel: true });
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
    if (body.image !== undefined) {
      if (!imageValide(body.image)) return NextResponse.json({ error: "La photo n'est pas valable (JPEG, PNG ou WebP, moins de 600 Ko)." }, { status: 400 });
      data.image = body.image || null;
    }
    const article = await prisma.article.update({ where: { id }, data, select: SELECTION });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "UPDATE_ARTICLE", resource: "article", resourceId: id, details: JSON.stringify(Object.keys(data)) },
    });
    const { image, ...reste } = article;
    return NextResponse.json({ article: { ...reste, aImage: !!image } });
  } catch (error) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
    console.error("Erreur PUT /api/tarifs/articles/[id]:", error);
    return NextResponse.json({ error: "L'article n'a pas pu être modifié." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { session, refus } = await exigerSession(ROLES_TARIFS);
  if (refus) return refus;
  try {
    const { id } = await params;
    await prisma.article.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({ data: { userId: session.user.id, action: "DELETE_ARTICLE", resource: "article", resourceId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
    console.error("Erreur DELETE /api/tarifs/articles/[id]:", error);
    return NextResponse.json({ error: "L'article n'a pas pu être retiré." }, { status: 500 });
  }
}

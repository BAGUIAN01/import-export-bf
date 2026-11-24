// PUT /api/tarifs/familles/[id] : nom, teinte, icône, ordre, masquer.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession, ROLES_TARIFS } from "@/lib/acces";
import { TEINTES_VALIDES } from "@/lib/tarifs";
import { ICONES } from "@/lib/caisse/icones";

export async function PUT(request, { params }) {
  const { session, refus } = await exigerSession(ROLES_TARIFS);
  if (refus) return refus;
  try {
    const { id } = await params;
    const body = await request.json();
    const data = {};
    if (body.nom !== undefined) {
      const nom = String(body.nom).trim();
      if (!nom) return NextResponse.json({ error: "Donnez un nom à la famille." }, { status: 400 });
      data.nom = nom;
    }
    if (body.teinte !== undefined && TEINTES_VALIDES.includes(body.teinte)) data.teinte = body.teinte;
    if (body.icone !== undefined && ICONES[body.icone]) data.icone = body.icone;
    if (body.ordre !== undefined) data.ordre = parseInt(body.ordre, 10) || 0;
    if (body.isActive !== undefined) {
      if (body.isActive === false && (await prisma.article.count({ where: { familleId: id, isActive: true } })) > 0) {
        return NextResponse.json({ error: "Retirez ou déplacez d'abord les articles de cette famille." }, { status: 400 });
      }
      data.isActive = !!body.isActive;
    }
    const famille = await prisma.familleArticle.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "UPDATE_FAMILLE_ARTICLE", resource: "familleArticle", resourceId: id, details: JSON.stringify(Object.keys(data)) },
    });
    return NextResponse.json({ famille });
  } catch (error) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Famille introuvable." }, { status: 404 });
    console.error("Erreur PUT /api/tarifs/familles/[id]:", error);
    return NextResponse.json({ error: "La famille n'a pas pu être modifiée." }, { status: 500 });
  }
}

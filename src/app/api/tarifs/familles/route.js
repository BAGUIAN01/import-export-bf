// POST /api/tarifs/familles : nouvelle famille d'articles.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession, ROLES_TARIFS } from "@/lib/acces";
import { TEINTES_VALIDES } from "@/lib/tarifs";
import { ICONES } from "@/lib/caisse/icones";
import { sansAccents } from "@/lib/caisse/familles";

export async function POST(request) {
  const { session, refus } = await exigerSession(ROLES_TARIFS);
  if (refus) return refus;
  try {
    const body = await request.json();
    const nom = String(body.nom || "").trim();
    if (!nom) return NextResponse.json({ error: "Donnez un nom à la famille." }, { status: 400 });
    const teinte = TEINTES_VALIDES.includes(body.teinte) ? body.teinte : "gris";
    const icone = ICONES[body.icone] ? body.icone : "package";
    const base = sansAccents(nom).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "famille";
    let cle = base;
    for (let i = 2; await prisma.familleArticle.findUnique({ where: { cle } }); i++) cle = `${base}-${i}`;
    const ordre = (await prisma.familleArticle.aggregate({ _max: { ordre: true } }))._max.ordre ?? 0;

    const famille = await prisma.familleArticle.create({ data: { cle, nom, teinte, icone, ordre: ordre + 1 } });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "CREATE_FAMILLE_ARTICLE", resource: "familleArticle", resourceId: famille.id, details: JSON.stringify({ nom }) },
    });
    return NextResponse.json({ famille: { ...famille, articles: [] } }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/tarifs/familles:", error);
    return NextResponse.json({ error: "La famille n'a pas pu être créée." }, { status: 500 });
  }
}

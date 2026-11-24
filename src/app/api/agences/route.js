// GET /api/agences : agences (et ?courante=depart|arrivee : celle de l'utilisateur).
// POST /api/agences : nouvelle agence (administrateur).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { agenceDe, assurerAgences, lireAgence } from "@/lib/agences";

export async function GET(request) {
  const { session, refus } = await exigerSession();
  if (refus) return refus;
  try {
    const courante = new URL(request.url).searchParams.get("courante");
    if (courante) {
      const agence = await agenceDe(session.user.id, courante === "arrivee" ? "ARRIVEE" : "DEPART");
      return NextResponse.json({ agence });
    }
    await assurerAgences();
    const agences = await prisma.agence.findMany({
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      include: { _count: { select: { users: true } } },
    });
    return NextResponse.json({ agences: agences.map(({ _count, ...a }) => ({ ...a, utilisateurs: _count.users })) });
  } catch (error) {
    console.error("Erreur GET /api/agences:", error);
    return NextResponse.json({ error: "Les agences n'ont pas pu être chargées." }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, refus } = await exigerSession(["ADMIN"]);
  if (refus) return refus;
  try {
    const { data, erreur } = lireAgence(await request.json());
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
    const ordre = (await prisma.agence.aggregate({ _max: { ordre: true } }))._max.ordre ?? 0;
    const agence = await prisma.agence.create({ data: { ...data, ordre: ordre + 1 } });
    await prisma.auditLog.create({ data: { userId: session.user.id, action: "CREATE_AGENCE", resource: "agence", resourceId: agence.id, details: JSON.stringify({ nom: agence.nom }) } });
    return NextResponse.json({ agence: { ...agence, utilisateurs: 0 } }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/agences:", error);
    return NextResponse.json({ error: "L'agence n'a pas pu être créée." }, { status: 500 });
  }
}

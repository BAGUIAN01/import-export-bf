// PUT /api/agences/[id] : modifier une agence (devise, taux, modes, reçu…).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { lireAgence } from "@/lib/agences";

export async function PUT(request, { params }) {
  const { session, refus } = await exigerSession(["ADMIN"]);
  if (refus) return refus;
  try {
    const { id } = await params;
    const { data, erreur } = lireAgence(await request.json(), { partiel: true });
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
    const agence = await prisma.agence.update({ where: { id }, data, include: { _count: { select: { users: true } } } });
    await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPDATE_AGENCE", resource: "agence", resourceId: id, details: JSON.stringify(data) } });
    const { _count, ...reste } = agence;
    return NextResponse.json({ agence: { ...reste, utilisateurs: _count.users } });
  } catch (error) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    console.error("Erreur PUT /api/agences/[id]:", error);
    return NextResponse.json({ error: "L'agence n'a pas pu être modifiée." }, { status: 500 });
  }
}

// GET /api/utilisateurs : comptes du personnel. POST : nouveau compte.
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { lireUtilisateur, SELECTION_UTILISATEUR } from "@/lib/utilisateurs";

export async function GET() {
  const { refus } = await exigerSession(["ADMIN"]);
  if (refus) return refus;
  try {
    const utilisateurs = await prisma.user.findMany({
      where: { role: { not: "CLIENT" } },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: SELECTION_UTILISATEUR,
    });
    return NextResponse.json({ utilisateurs });
  } catch (error) {
    console.error("Erreur GET /api/utilisateurs:", error);
    return NextResponse.json({ error: "Les utilisateurs n'ont pas pu être chargés." }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, refus } = await exigerSession(["ADMIN"]);
  if (refus) return refus;
  try {
    const { data, motDePasse, erreur } = lireUtilisateur(await request.json());
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
    if (await prisma.user.findUnique({ where: { phone: data.phone } })) {
      return NextResponse.json({ error: "Un compte existe déjà avec ce téléphone." }, { status: 400 });
    }
    if (data.email && (await prisma.user.findUnique({ where: { email: data.email } }))) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 400 });
    }
    const utilisateur = await prisma.user.create({
      data: { ...data, password: await hash(motDePasse, 10), isActive: data.isActive ?? true },
      select: SELECTION_UTILISATEUR,
    });
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "CREATE_USER", resource: "user", resourceId: utilisateur.id, details: JSON.stringify({ role: utilisateur.role }) },
    });
    return NextResponse.json({ utilisateur }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/utilisateurs:", error);
    return NextResponse.json({ error: "Le compte n'a pas pu être créé." }, { status: 500 });
  }
}

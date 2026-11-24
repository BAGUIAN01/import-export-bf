// PUT /api/utilisateurs/[id] : profil, agence, activation, nouveau mot de passe.
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { lireUtilisateur, SELECTION_UTILISATEUR } from "@/lib/utilisateurs";

export async function PUT(request, { params }) {
  const { session, refus } = await exigerSession(["ADMIN"]);
  if (refus) return refus;
  try {
    const { id } = await params;
    const { data, motDePasse, erreur } = lireUtilisateur(await request.json(), { partiel: true });
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });

    const actuel = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
    if (!actuel || actuel.role === "CLIENT") return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

    // On ne se retire pas à soi-même l'administration, et il reste un administrateur actif
    const perdAdmin = actuel.role === "ADMIN" && ((data.role && data.role !== "ADMIN") || data.isActive === false);
    if (perdAdmin) {
      if (id === session.user.id) return NextResponse.json({ error: "Vous ne pouvez pas retirer vos propres droits d'administrateur." }, { status: 400 });
      const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true, id: { not: id } } });
      if (admins === 0) return NextResponse.json({ error: "Il doit rester au moins un administrateur actif." }, { status: 400 });
    }
    if (data.phone && (await prisma.user.findFirst({ where: { phone: data.phone, id: { not: id } } }))) {
      return NextResponse.json({ error: "Un autre compte utilise déjà ce téléphone." }, { status: 400 });
    }
    if (data.email && (await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } }))) {
      return NextResponse.json({ error: "Un autre compte utilise déjà cet e-mail." }, { status: 400 });
    }
    if (motDePasse) data.password = await hash(motDePasse, 10);

    const utilisateur = await prisma.user.update({ where: { id }, data, select: SELECTION_UTILISATEUR });
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_USER",
        resource: "user",
        resourceId: id,
        details: JSON.stringify({ champs: Object.keys(data).filter((k) => k !== "password"), motDePasse: !!motDePasse }),
      },
    });
    return NextResponse.json({ utilisateur });
  } catch (error) {
    console.error("Erreur PUT /api/utilisateurs/[id]:", error);
    return NextResponse.json({ error: "Le compte n'a pas pu être modifié." }, { status: 500 });
  }
}

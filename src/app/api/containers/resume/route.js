// app/api/containers/resume/route.js
// GET /api/containers/resume : conteneurs avec leurs chiffres (colis, envois,
// montants, remis) pour l'écran Conteneurs de la gestion.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [conteneurs, sommes, remis] = await Promise.all([
      prisma.container.findMany({
        where: { status: { not: "CANCELLED" } },
        orderBy: [{ departureDate: "desc" }, { createdAt: "desc" }],
        take: 60,
        select: {
          id: true,
          containerNumber: true,
          name: true,
          status: true,
          capacity: true,
          departureDate: true,
          actualDeparture: true,
          arrivalDate: true,
          actualArrival: true,
          origin: true,
          destination: true,
          currentLocation: true,
          sealNumber: true,
          _count: { select: { packages: true, shipments: true } },
        },
      }),
      prisma.shipment.groupBy({
        by: ["containerId"],
        where: { containerId: { not: null } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      prisma.shipment.groupBy({
        by: ["containerId"],
        where: { containerId: { not: null }, deliveredAt: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const sommeDe = new Map(sommes.map((s) => [s.containerId, s._sum]));
    const remisDe = new Map(remis.map((r) => [r.containerId, r._count._all]));

    const resultat = conteneurs.map((c) => {
      const s = sommeDe.get(c.id) || {};
      return {
        ...c,
        _count: undefined,
        packagesCount: c._count.packages,
        shipmentsCount: c._count.shipments,
        totalAmount: s.totalAmount || 0,
        paidAmount: s.paidAmount || 0,
        deliveredCount: remisDe.get(c.id) || 0,
      };
    });

    return NextResponse.json({ containers: resultat });
  } catch (error) {
    console.error("Erreur GET /api/containers/resume:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

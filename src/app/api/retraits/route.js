// GET /api/retraits : conteneurs arrivés et envois à remettre.
// ?conteneur=<id> : envois de ce conteneur (par défaut le dernier arrivé).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { agenceDe } from "@/lib/agences";

const ROLES_RETRAITS = ["ADMIN", "CHEF_CAISSE", "AGENT"];

export async function GET(request) {
  const { session, refus } = await exigerSession(ROLES_RETRAITS);
  if (refus) return refus;
  try {
    const demande = new URL(request.url).searchParams.get("conteneur");
    const [agence, conteneurs] = await Promise.all([
      agenceDe(session.user.id, "ARRIVEE"),
      prisma.container.findMany({
        where: { status: { in: ["DELIVERED", "CUSTOMS"] } },
        orderBy: [{ actualArrival: "desc" }, { arrivalDate: "desc" }],
        take: 12,
        select: { id: true, containerNumber: true, status: true, arrivalDate: true, actualArrival: true, _count: { select: { shipments: true } } },
      }),
    ]);
    const choisi = conteneurs.find((c) => c.id === demande) || conteneurs.find((c) => c.status === "DELIVERED") || conteneurs[0];

    const envois = choisi
      ? await prisma.shipment.findMany({
          where: { containerId: choisi.id },
          orderBy: [{ deliveredAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
          select: {
            id: true,
            shipmentNumber: true,
            totalAmount: true,
            paidAmount: true,
            paymentStatus: true,
            deliveredAt: true,
            receivedBy: true,
            receivedIdNumber: true,
            deliveryNote: true,
            packagesCount: true,
            client: { select: { id: true, firstName: true, lastName: true, phone: true, recipientName: true, recipientPhone: true, recipientCity: true } },
            packages: { select: { id: true, packageNumber: true, description: true, totalQuantity: true, weight: true, types: true }, orderBy: { createdAt: "asc" } },
          },
        })
      : [];

    const remis = envois.filter((e) => e.deliveredAt).length;
    return NextResponse.json({
      agence,
      conteneurs: conteneurs.map(({ _count, ...c }) => ({ ...c, shipmentsCount: _count.shipments })),
      conteneur: choisi ? { ...choisi, _count: undefined, shipmentsCount: choisi._count.shipments, remis } : null,
      envois,
    });
  } catch (error) {
    console.error("Erreur GET /api/retraits:", error);
    return NextResponse.json({ error: "Les retraits n'ont pas pu être chargés." }, { status: 500 });
  }
}

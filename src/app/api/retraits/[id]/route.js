// POST /api/retraits/[id] : remettre les colis d'un envoi au destinataire.
// Corps : { paiement?: { montantDevise, mode, reference }, receivedBy, receivedIdNumber, note }
// Le paiement est tapé dans la devise de l'agence et enregistré en euros.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { agenceDe } from "@/lib/agences";
import { paiementEnEuros, resteEnvoi } from "@/lib/retraits";
import { arrondi } from "@/lib/caisse/montants";
import { formatDevise } from "@/lib/devises";

const ROLES = ["ADMIN", "CHEF_CAISSE", "AGENT"];
const MODES = { ESPECES: "CASH", CARTE: "CARD", MOBILE: "MOBILE_MONEY", VIREMENT: "TRANSFER" };

export async function POST(request, { params }) {
  const { session, refus } = await exigerSession(ROLES);
  if (refus) return refus;
  try {
    const { id } = await params;
    const body = await request.json();
    const nom = String(body.receivedBy || "").trim();
    if (!nom) return NextResponse.json({ error: "Indiquez le nom de la personne qui retire les colis." }, { status: 400 });

    const envoi = await prisma.shipment.findUnique({
      where: { id },
      select: { id: true, shipmentNumber: true, totalAmount: true, paidAmount: true, paymentMethod: true, deliveredAt: true, container: { select: { status: true } } },
    });
    if (!envoi) return NextResponse.json({ error: "Envoi introuvable." }, { status: 404 });
    if (envoi.deliveredAt) return NextResponse.json({ error: "Ces colis ont déjà été remis." }, { status: 400 });
    if (!["DELIVERED", "CUSTOMS"].includes(envoi.container?.status)) {
      return NextResponse.json({ error: "Le conteneur n'est pas encore arrivé." }, { status: 400 });
    }

    const agence = await agenceDe(session.user.id, "ARRIVEE");
    let paye = 0;
    const p = body.paiement;
    if (p && Number(p.montantDevise) > 0) {
      if (!MODES[p.mode]) return NextResponse.json({ error: "Choisissez le mode de paiement." }, { status: 400 });
      paye = paiementEnEuros(Number(p.montantDevise), envoi, agence);
    }
    const nouveauPaye = arrondi((envoi.paidAmount || 0) + paye);
    const reste = resteEnvoi({ totalAmount: envoi.totalAmount, paidAmount: nouveauPaye });
    if (reste > 0.009) {
      return NextResponse.json({ error: `Il reste ${formatDevise(reste, agence)} à payer avant la remise.` }, { status: 400 });
    }

    const note = [String(body.note || "").trim(), p?.reference ? `Réf. paiement : ${String(p.reference).trim()}` : null, paye > 0 ? `Payé au retrait : ${formatDevise(paye, agence)}` : null]
      .filter(Boolean)
      .join(" · ");

    const maintenant = new Date();
    await prisma.$transaction([
      prisma.shipment.update({
        where: { id },
        data: {
          paidAmount: nouveauPaye,
          paymentStatus: "PAID",
          ...(paye > 0 ? { paymentMethod: MODES[p.mode], paidAt: maintenant } : {}),
          deliveredAt: maintenant,
          receivedBy: nom,
          receivedIdNumber: String(body.receivedIdNumber || "").trim() || null,
          deliveryNote: note || null,
        },
      }),
      prisma.package.updateMany({ where: { shipmentId: id }, data: { status: "DELIVERED", deliveryDate: maintenant } }),
    ]);
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REMISE_DESTINATAIRE",
        resource: "shipment",
        resourceId: id,
        details: JSON.stringify({ shipmentNumber: envoi.shipmentNumber, receivedBy: nom, payeEuros: paye, agence: agence?.nom }),
      },
    });
    return NextResponse.json({ ok: true, deliveredAt: maintenant.toISOString(), paidAmount: nouveauPaye });
  } catch (error) {
    console.error("Erreur POST /api/retraits/[id]:", error);
    return NextResponse.json({ error: "La remise n'a pas pu être enregistrée." }, { status: 500 });
  }
}

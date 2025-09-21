// app/api/packages/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ===================== Helpers (autonomes) ===================== */

const toNumOrNull = (v) =>
  v === "" || v === undefined || v === null || Number.isNaN(Number(v))
    ? null
    : Number(v);

const toDateOrNull = (v) => (v ? new Date(v) : null);

const isValidPaymentStatus = (s) =>
  ["PENDING", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"].includes(s);

const isValidPaymentMethod = (m) =>
  ["CASH", "CARD", "TRANSFER", "MOBILE_MONEY", "CHEQUE"].includes(m);

const derivePaymentStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);
  if (paid <= 0) return "PENDING";
  if (paid < total) return "PARTIAL";
  return "PAID";
};

const VALID_PACKAGE_STATUSES = [
  "REGISTERED",
  "COLLECTED",
  "IN_CONTAINER",
  "IN_TRANSIT",
  "CUSTOMS",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

// Les types valides doivent matcher ton schema/prix
const validTypes = [
  "CARTON","CARTON_MEDIUM","CARTON_LARGE",
  "BARRIQUE","FUT_BLACK_270L",
  "VEHICLE","SUV_4X4","MOTORCYCLE",
  "ELECTRONICS","FRIDGE_SMALL","FRIDGE_STANDARD","FRIDGE_LARGE","FRIDGE_AMERICAN",
  "FREEZER_SMALL","FREEZER_MEDIUM","FREEZER_LARGE","FREEZER_XLARGE",
  "WASHING_MACHINE","STOVE",
  "TV_32","TV_40","TV_48","TV_55","TV_65","TV_75","TV_80","TV_OTHER",
  "VALISE_SMALL","VALISE_MEDIUM","VALISE_LARGE","VALISE_XLARGE",
  "SAC_MEDIUM","SAC_LARGE","SAC_XLARGE",
  "CANTINE_SMALL","CANTINE_MEDIUM","CANTINE_LARGE","CANTINE_XLARGE",
  "CHAIR_STACKABLE","CHAIR_STANDARD","OFFICE_CHAIR","ARMCHAIR","SOFA_SEAT","MATTRESS_SEAT",
  "WINE_6_BOTTLES","WINE_12_BOTTLES","CHAMPAGNE_6_BOTTLES","CHAMPAGNE_12_BOTTLES",
  "GENERATOR_SMALL","CLOTHING","FOOD","DOCUMENTS","INDUSTRIAL","OTHER"
];

function parseTypesFromBodyOrExisting(body, existing) {
  // Priorité: selectedTypes -> types -> legacy -> existing.types
  if (Array.isArray(body?.selectedTypes)) {
    return body.selectedTypes;
  }
  if (body?.types !== undefined) {
    try {
      return typeof body.types === "string" ? JSON.parse(body.types) : body.types;
    } catch {
      throw new Error("Format de 'types' invalide");
    }
  }
  if (body?.type && !body?.selectedTypes && body?.types === undefined) {
    const q = Math.max(1, parseInt(body.quantity ?? 1, 10) || 1);
    const unit = Number(body.basePrice ?? 50) || 50;
    if (!validTypes.includes(body.type)) {
      throw new Error(`Type invalide: ${body.type}`);
    }
    return [{ type: body.type, quantity: q, unitPrice: unit, isQuoteOnly: false }];
  }
  // fallback: garder types existants
  try {
    return typeof existing.types === "string"
      ? JSON.parse(existing.types || "[]")
      : Array.isArray(existing.types)
      ? existing.types
      : [];
  } catch {
    return [];
  }
}

function computeBaseFromTypes(typesData, fallbackBasePrice, fallbackQuantity) {
  const totalQuantity =
    typesData?.reduce((s, it) => s + Number(it.quantity || 0), 0) ||
    Number(fallbackQuantity || 1);

  const basePrice =
    typesData?.reduce(
      (s, it) =>
        s +
        (it.isQuoteOnly
          ? 0
          : Number(it.unitPrice || 0) * Number(it.quantity || 0)),
      0
    ) || Number(fallbackBasePrice || 0);

  return { totalQuantity, basePrice };
}

async function recalcShipmentAggregates(shipmentId) {
  if (!shipmentId) return;

  const pkgs = await prisma.package.findMany({
    where: { shipmentId },
    select: {
      totalQuantity: true,
      basePrice: true,
      pickupFee: true,
      insuranceFee: true,
      customsFee: true,
      discount: true,
      totalAmount: true,
    },
  });

  const packagesCount = pkgs.length;
  const totalQuantity = pkgs.reduce((s, p) => s + (p.totalQuantity || 0), 0);
  const subtotal = pkgs.reduce((s, p) => s + (p.basePrice || 0), 0);
  const pickupFeeTotal = pkgs.reduce((s, p) => s + (p.pickupFee || 0), 0);
  const insuranceFeeTotal = pkgs.reduce((s, p) => s + (p.insuranceFee || 0), 0);
  const customsFeeTotal = pkgs.reduce((s, p) => s + (p.customsFee || 0), 0);
  const discountTotal = pkgs.reduce((s, p) => s + (p.discount || 0), 0);
  const totalAmount = pkgs.reduce((s, p) => s + (p.totalAmount || 0), 0);

  // On ne touche pas aux champs de paiement (paidAmount/method/paidAt) ici.
  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      packagesCount,
      totalQuantity,
      subtotal,
      pickupFeeTotal,
      insuranceFeeTotal,
      customsFeeTotal,
      discountTotal,
      totalAmount,
      // Le statut de paiement de la shipment peut dépendre d'une logique globale.
      // Si tu veux dériver automatiquement ici, dé-commente et apporte la donnée paidAmount globale.
      // paymentStatus: derivePaymentStatus(totalAmount, paidGlobalAmount),
    },
  });
}

/* ===================== GET /api/packages/[id] ===================== */
export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Les clients ne peuvent voir que leurs colis
    const where = { id };
    if (session.user.role === "CLIENT") {
      const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!client) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      where["clientId"] = client.id;
    }

    const pkg = await prisma.package.findFirst({
      where,
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            recipientName: true,
            recipientCity: true,
            recipientAddress: true,
          },
        },
        container: {
          select: {
            id: true,
            containerNumber: true,
            name: true,
            status: true,
            departureDate: true,
            arrivalDate: true,
          },
        },
        shipment: {
          select: { id: true, shipmentNumber: true, paymentStatus: true },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Colis introuvable" }, { status: 404 });
    }

    let parsedTypes = [];
    try {
      parsedTypes =
        typeof pkg.types === "string" ? JSON.parse(pkg.types) : pkg.types || [];
    } catch {
      parsedTypes = [];
    }

    return NextResponse.json({ data: { ...pkg, parsedTypes } });
  } catch (e) {
    console.error("GET /api/packages/[id] error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ===================== PUT /api/packages/[id] ===================== */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const existing = await prisma.package.findUnique({
      where: { id },
      include: { shipment: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Colis introuvable" }, { status: 404 });
    }

    const body = await request.json();

    // ------ Conteneur obligatoire ------
    const containerId = body.containerId?.trim?.() || body.containerId;
    if (!containerId) {
      return NextResponse.json(
        { error: "Conteneur obligatoire (containerId manquant)" },
        { status: 400 }
      );
    }
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });
    if (!container) {
      return NextResponse.json({ error: "Conteneur introuvable" }, { status: 400 });
    }

    // ------ Client obligatoire (si changé) ------
    const clientId = body.clientId?.trim?.() || existing.clientId;
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
    }

    // ------ Types / quantités / base ------
    let typesData;
    try {
      typesData = parseTypesFromBodyOrExisting(body, existing);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Validation des types nouveaux
    if (!Array.isArray(typesData) || !typesData.length) {
      return NextResponse.json(
        { error: "Au moins un type doit être sélectionné" },
        { status: 400 }
      );
    }
    for (const t of typesData) {
      if (!t?.type || !validTypes.includes(t.type)) {
        return NextResponse.json(
          { error: `Type invalide: ${t?.type}` },
          { status: 400 }
        );
      }
      const q = Number(t.quantity || 0);
      if (!Number.isFinite(q) || q < 1) {
        return NextResponse.json(
          { error: `Quantité invalide pour ${t.type}` },
          { status: 400 }
        );
      }
    }

    const { totalQuantity, basePrice } = computeBaseFromTypes(
      typesData,
      body.basePrice ?? existing.basePrice,
      body.totalQuantity ?? existing.totalQuantity
    );

    // ------ Champs et calculs annexes ------
    const normalizedValue     = toNumOrNull(body.value ?? existing.value);
    const normalizedWeight    = toNumOrNull(body.weight ?? existing.weight);
    const normalizedPickupFee = toNumOrNull(
      body.pickupFee ?? existing.pickupFee ?? (body.pickupAddress ? 20 : 0)
    ) ?? 0;
    const normalizedCustoms   = toNumOrNull(
      body.customsFee ?? existing.customsFee ?? 15
    ) ?? 0;
    const discount            = Math.max(
      0,
      toNumOrNull(body.discount ?? existing.discount) ?? 0
    );

    const isInsured = body.isInsured ?? existing.isInsured ?? false;
    const insuranceFee =
      isInsured && normalizedValue != null
        ? Math.max(10, normalizedValue * 0.02)
        : 0;

    const totalAmount = Math.max(
      0,
      Number(basePrice || 0) +
        Number(normalizedPickupFee || 0) +
        Number(insuranceFee || 0) +
        Number(normalizedCustoms || 0) -
        Number(discount || 0)
    );

    // Paiement (au niveau du colis)
    const paidAmountRaw = toNumOrNull(body.paidAmount ?? existing.paidAmount);
    const paidAmount    = Math.max(0, paidAmountRaw ?? 0);

    const paymentStatus =
      body.paymentStatus && isValidPaymentStatus(body.paymentStatus)
        ? body.paymentStatus
        : derivePaymentStatus(totalAmount, paidAmount);

    const paidAt =
      paidAmount > 0
        ? toDateOrNull(body.paidAt) ?? existing.paidAt ?? new Date()
        : null;

    const paymentMethod =
      body.paymentMethod &&
      String(body.paymentMethod).trim() !== "" &&
      isValidPaymentMethod(body.paymentMethod)
        ? body.paymentMethod
        : existing.paymentMethod ?? null;

    // Statut opérationnel
    const status =
      body.status && VALID_PACKAGE_STATUSES.includes(body.status)
        ? body.status
        : existing.status;

    // Relation shipment (optionnelle) — on connecte si fourni
    const connectShipment =
      body.shipmentId ? { shipment: { connect: { id: body.shipmentId } } } : {};

    // ------ Mise à jour ------
    const updated = await prisma.package.update({
      where: { id },
      data: {
        client:    { connect: { id: clientId } },
        container: { connect: { id: containerId } },

        ...connectShipment,

        // types multi
        types: JSON.stringify(typesData),

        description: body.description ?? existing.description,
        totalQuantity,
        weight: normalizedWeight,
        dimensions: body.dimensions ?? existing.dimensions ?? null,
        value: normalizedValue,
        priority: body.priority ?? existing.priority ?? "NORMAL",
        isFragile: body.isFragile ?? existing.isFragile ?? false,
        isInsured,

        pickupAddress: body.pickupAddress ?? existing.pickupAddress ?? null,
        pickupDate: toDateOrNull(body.pickupDate) ?? existing.pickupDate ?? null,
        pickupTime: body.pickupTime ?? existing.pickupTime ?? null,
        deliveryAddress:
          body.deliveryAddress ?? existing.deliveryAddress ?? client.recipientAddress ?? null,
        specialInstructions:
          body.specialInstructions ?? existing.specialInstructions ?? null,
        notes: body.notes ?? existing.notes ?? null,

        basePrice,
        pickupFee: normalizedPickupFee,
        insuranceFee,
        customsFee: normalizedCustoms,
        discount,
        totalAmount,

        paymentStatus,
        paymentMethod,
        paidAmount,
        paidAt,

        status,
      },
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            recipientCity: true,
            recipientName: true,
            recipientAddress: true,
          },
        },
        container: {
          select: { id: true, containerNumber: true, name: true, status: true },
        },
        shipment: { select: { id: true, shipmentNumber: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Audit (best-effort)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_PACKAGE",
          resource: "package",
          resourceId: updated.id,
          details: JSON.stringify({
            containerId,
            clientId,
            shipmentId: updated.shipment?.id ?? null,
            typesCount: typesData.length,
            totalQuantity,
          }),
        },
      });
    } catch {}

    // Recalcule les agrégats shipment si le colis est rattaché à une expédition
    await recalcShipmentAggregates(updated.shipment?.id ?? existing.shipment?.id ?? null);

    return NextResponse.json({
      message: "Colis mis à jour",
      package: { ...updated, parsedTypes: typesData },
    });
  } catch (e) {
    console.error("PUT /api/packages/[id] error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du colis" },
      { status: 500 }
    );
  }
}

/* ===================== DELETE /api/packages/[id] ===================== */
export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const existing = await prisma.package.findUnique({
      where: { id },
      select: { id: true, shipmentId: true, packageNumber: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Colis introuvable" }, { status: 404 });
    }

    await prisma.package.delete({ where: { id } });

    // Audit (best-effort)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE_PACKAGE",
          resource: "package",
          resourceId: id,
          details: JSON.stringify({ packageNumber: existing.packageNumber }),
        },
      });
    } catch {}

    // Recalcule les agrégats de la shipment si besoin
    await recalcShipmentAggregates(existing.shipmentId);

    // Option: si packagesCount = 0 tu peux supprimer la shipment (ici on la garde).
    return NextResponse.json({ message: "Colis supprimé" });
  } catch (e) {
    console.error("DELETE /api/packages/[id] error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du colis" },
      { status: 500 }
    );
  }
}

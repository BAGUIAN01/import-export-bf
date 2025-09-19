// app/api/packages/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const toNumOrNull = (v) =>
  v === "" || v === undefined || v === null || Number.isNaN(Number(v))
    ? null
    : Number(v);

const toIntOr = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const toDateOrNull = (v) => (v ? new Date(v) : null);

const isValidPaymentStatus = (s) =>
  ["PENDING", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"].includes(s);

const derivePaymentStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);
  if (paid <= 0) return "PENDING";
  if (paid < total) return "PARTIAL";
  return "PAID";
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    // Construction des filtres
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    // Si c'est un client, ne voir que ses colis
    if (session.user.role === "CLIENT") {
      const userClient = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (userClient) {
        where.clientId = userClient.id;
      }
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            recipientCity: true,
            recipientName: true,
          },
        },
        container: {
          select: {
            id: true,
            containerNumber: true,
            name: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.package.count({ where });

    return NextResponse.json({
      data: packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/packages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    // --- Validation requis minimal ---
    if (
      !body.clientId ||
      !body.type ||
      !body.description ||
      !body.deliveryAddress
    ) {
      return NextResponse.json(
        {
          error:
            "Champs requis manquants (clientId, type, description, deliveryAddress)",
        },
        { status: 400 }
      );
    }

    const validTypes = [
      "CARTON",
      "BARRIQUE",
      "VEHICLE",
      "MOTORCYCLE",
      "ELECTRONICS",
      "CLOTHING",
      "FOOD",
      "DOCUMENTS",
      "OTHER",
    ];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Type invalide. Attendu: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // --- IDs & existence ---
    const clientId = body.clientId?.trim?.() || body.clientId;
    const containerId = body.containerId?.trim?.() || body.containerId || null;

    const [client, user] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!client)
      return NextResponse.json(
        { error: "Client introuvable (clientId invalide)" },
        { status: 400 }
      );
    if (!user)
      return NextResponse.json(
        { error: "Utilisateur de session introuvable" },
        { status: 401 }
      );

    let container = null;
    if (containerId) {
      container = await prisma.container.findUnique({
        where: { id: containerId },
      });
      if (!container) {
        return NextResponse.json(
          { error: "Conteneur introuvable (containerId invalide)" },
          { status: 400 }
        );
      }
    }

    // --- Numéro colis ---
    const year = new Date().getFullYear();
    const count = (await prisma.package.count()) + 1;
    const packageNumber = `PKG${year}${String(count).padStart(5, "0")}`;

    // --- Pricing de référence (fallback) ---
    const pricing = await prisma.pricing.findFirst({
      where: { type: body.type, isActive: true },
    });

    // --- Normalisations ---
    const normalizedValue = toNumOrNull(body.value);
    const normalizedWeight = toNumOrNull(body.weight);

    const basePrice = toNumOrNull(body.basePrice) ?? pricing?.basePrice ?? 50;

    const normalizedPickupFee =
      toNumOrNull(body.pickupFee) ??
      (body.pickupAddress ? pricing?.pickupFee ?? 20 : 0);

    const normalizedCustoms =
      toNumOrNull(body.customsFee) ?? pricing?.customsFee ?? 15;

    const discount = Math.max(0, toNumOrNull(body.discount) ?? 0);

    const isInsured = !!body.isInsured;
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

    // --- Paiement ---
    const paidAmount = Math.max(0, toNumOrNull(body.paidAmount) ?? 0);
    const paymentStatus =
      body.paymentStatus && isValidPaymentStatus(body.paymentStatus)
        ? body.paymentStatus
        : derivePaymentStatus(totalAmount, paidAmount);
    const paidAt =
      paidAmount > 0
        ? body.paidAt
          ? new Date(body.paidAt)
          : new Date()
        : null;
    const paymentMethod = body.paymentMethod ?? null;

    // --- Création ---
    const newPackage = await prisma.package.create({
      data: {
        packageNumber,
        client: { connect: { id: client.id } },
        user: { connect: { id: user.id } },
        ...(container ? { container: { connect: { id: container.id } } } : {}),

        type: body.type,
        description: body.description,
        quantity: toIntOr(body.quantity, 1),
        weight: normalizedWeight,
        dimensions: body.dimensions || null, // toléré si encore envoyé par l'UI
        value: normalizedValue,
        priority: body.priority ?? "NORMAL",
        isFragile: !!body.isFragile,
        isInsured,
        pickupAddress: body.pickupAddress || null,
        pickupDate: toDateOrNull(body.pickupDate),
        pickupTime: body.pickupTime || null,
        deliveryAddress: body.deliveryAddress,
        specialInstructions: body.specialInstructions || null,
        notes: body.notes || null,

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

        status: "REGISTERED",
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
          },
        },
        container: {
          select: { id: true, containerNumber: true, name: true, status: true },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // --- Audit non bloquant ---
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PACKAGE",
          resource: "package",
          resourceId: newPackage.id,
          details: JSON.stringify({ packageNumber }),
        },
      });
    } catch {}

    return NextResponse.json(
      { message: "Colis créé avec succès", package: newPackage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/packages:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: `Contrainte de clé étrangère violée${
            error.meta?.field_name ? ` (${error.meta.field_name})` : ""
          }`,
        },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          error:
            "Une référence liée est introuvable (client / conteneur / utilisateur)",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du colis" },
      { status: 500 }
    );
  }
}

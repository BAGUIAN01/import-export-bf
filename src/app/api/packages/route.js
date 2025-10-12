// app/api/packages/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------- Helpers ----------
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

const isValidPaymentMethod = (m) =>
  ["CASH", "CARD", "TRANSFER", "MOBILE_MONEY", "CHEQUE"].includes(m);

const derivePaymentStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);
  if (paid <= 0) return "PENDING";
  if (paid < total) return "PARTIAL";
  return "PAID";
};

// Fonction pour recalculer les agrégats d'un shipment
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
  
  // Recalculer le totalAmount à partir des composants pour assurer la cohérence
  const totalAmount = Math.max(0, subtotal + pickupFeeTotal + insuranceFeeTotal + customsFeeTotal - discountTotal);
  
  // ⚠️ IMPORTANT: Le paiement est géré au niveau du SHIPMENT uniquement
  // On ne touche pas aux champs paidAmount, paidAt, paymentMethod, paymentStatus du shipment
  // Ces champs doivent être mis à jour uniquement via l'API de paiement du shipment

  console.log(`🔄 Recalcul agrégats shipment ${shipmentId}:`, {
    packagesCount,
    totalAmount,
    note: 'Paiement géré au niveau shipment, non recalculé ici',
  });

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
      // Ne pas toucher aux champs de paiement
    },
  });
  
  console.log(`✅ Shipment ${shipmentId} mis à jour avec succès`);
}

// Tous les types permis (doivent correspondre au schema.prisma)
const validTypes = [
  "CARTON",
  "CARTON_MEDIUM",
  "CARTON_LARGE",
  "BARRIQUE",
  "FUT_BLACK_270L",
  "VEHICLE",
  "SUV_4X4",
  "MOTORCYCLE",
  "ELECTRONICS",
  "FRIDGE_SMALL",
  "FRIDGE_STANDARD",
  "FRIDGE_LARGE",
  "FRIDGE_AMERICAN",
  "FREEZER_SMALL",
  "FREEZER_MEDIUM",
  "FREEZER_LARGE",
  "FREEZER_XLARGE",
  "WASHING_MACHINE",
  "STOVE",
  "TV_32",
  "TV_40",
  "TV_48",
  "TV_55",
  "TV_65",
  "TV_75",
  "TV_80",
  "TV_OTHER",
  "VALISE_SMALL",
  "VALISE_MEDIUM",
  "VALISE_LARGE",
  "VALISE_XLARGE",
  "SAC_MEDIUM",
  "SAC_LARGE",
  "SAC_XLARGE",
  "CANTINE_SMALL",
  "CANTINE_MEDIUM",
  "CANTINE_LARGE",
  "CANTINE_XLARGE",
  "CHAIR_STACKABLE",
  "CHAIR_STANDARD",
  "OFFICE_CHAIR",
  "ARMCHAIR",
  "SOFA_SEAT",
  "MATTRESS_SEAT",
  "WINE_6_BOTTLES",
  "WINE_12_BOTTLES",
  "CHAMPAGNE_6_BOTTLES",
  "CHAMPAGNE_12_BOTTLES",
  "GENERATOR_SMALL",
  "CLOTHING",
  "FOOD",
  "DOCUMENTS",
  "INDUSTRIAL",
  "OTHER",
];

// ---------- GET /api/packages ----------
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
    const shipmentId = searchParams.get("shipmentId");

    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    // IMPORTANT : plus de shipmentId scalaire → filtrer via la relation
    if (shipmentId) where.shipment = { id: shipmentId };

    // Un client ne voit que ses colis
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
          select: { id: true, containerNumber: true, name: true, status: true },
        },
        shipment: {
          select: { id: true, shipmentNumber: true, paymentStatus: true },
        },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const packagesWithParsedTypes = packages.map((pkg) => ({
      ...pkg,
      parsedTypes: (() => {
        try {
          return JSON.parse(pkg.types);
        } catch {
          return [];
        }
      })(),
    }));

    const total = await prisma.package.count({ where });

    return NextResponse.json({
      data: packagesWithParsedTypes,
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

// ---------- POST /api/packages ----------
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    // ====== CAS 1: Payload Wizard (batch groupé) ======
    // { clientId, containerId, sharedData, packages: [...] }
    if (Array.isArray(body.packages)) {
      const { clientId, containerId = null, sharedData = {} } = body;
      if (!containerId) {
        return NextResponse.json(
          {
            error:
              "containerId manquant : un conteneur est obligatoire pour l'expédition.",
          },
          { status: 400 }
        );
      }
      if (!clientId) {
        return NextResponse.json(
          { error: "clientId manquant (format batch/wizard)" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (!user)
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 401 }
        );

      // RÈGLE: Un seul shipment par client par conteneur
      // Vérifier si un shipment existe déjà pour ce client + conteneur
      let shipment = await prisma.shipment.findFirst({
        where: {
          clientId,
          containerId,
        },
      });

      // Variable pour tracker si on utilise un shipment existant
      const isExistingShipment = !!shipment;

      // Si un shipment existe déjà, on l'utilise
      if (isExistingShipment) {
        console.log(`♻️  Shipment existant trouvé: ${shipment.shipmentNumber} pour client ${clientId} + conteneur ${containerId}`);
      } else {
        // Sinon, créer un nouveau shipment
        const year = new Date().getFullYear();
        const shCount = (await prisma.shipment.count()) + 1;
        const shipmentNumber = `SHP${year}${String(shCount).padStart(5, "0")}`;

        console.log(`🆕 Création d'un nouveau shipment: ${shipmentNumber} pour client ${clientId} + conteneur ${containerId}`);

        shipment = await prisma.shipment.create({
          data: {
            shipmentNumber,
            client: { connect: { id: clientId } },
            user: { connect: { id: user.id } },
            ...(containerId
              ? { container: { connect: { id: containerId } } }
              : {}),

            // Partagés
            pickupAddress: sharedData.pickupAddress || null,
            pickupDate: sharedData.pickupDate
              ? new Date(sharedData.pickupDate)
              : null,
            pickupTime: sharedData.pickupTime || null,
            deliveryAddress: body.deliveryAddress || null,
            specialInstructions: sharedData.specialInstructions || null,

            // Paiement groupé partagé (status final recalculé plus bas)
            paymentMethod: sharedData.paymentMethod || null,
            paidAmount: 0, // Sera recalculé après création des packages
            paidAt: sharedData.paidAt ? new Date(sharedData.paidAt) : null,
            paymentStatus: "PENDING", // Sera recalculé après création des packages
          },
        });
      }

      // Créer chaque package et les lier à l'expédition
      const created = [];
      for (const pkg of body.packages) {
        const single = {
          clientId,
          containerId: pkg.containerId ?? containerId ?? null,
          selectedTypes: pkg.selectedTypes,
          description: pkg.description,
          weight: pkg.weight,
          value: pkg.value,
          priority: pkg.priority,
          isFragile: pkg.isFragile,
          isInsured: pkg.isInsured,
          pickupFee: pkg.pickupFee,
          insuranceFee: pkg.insuranceFee,
          customsFee: pkg.customsFee,
          discount: pkg.discount,
          pickupAddress: pkg.pickupAddress ?? sharedData.pickupAddress ?? null,
          pickupDate: pkg.pickupDate ?? sharedData.pickupDate ?? null,
          pickupTime: pkg.pickupTime ?? sharedData.pickupTime ?? null,
          deliveryAddress: pkg.deliveryAddress ?? body.deliveryAddress ?? null,
          specialInstructions:
            pkg.specialInstructions ?? sharedData.specialInstructions ?? null,

          // Paiement — on copie le shared pour cohérence
          paidAmount: Number(sharedData.paidAmount || 0),
          paymentMethod: sharedData.paymentMethod || null,
          paidAt: sharedData.paidAt || null,

          // Lien expédition (on passe l'id, la fonction interne fera connect)
          shipmentId: shipment.id,
        };

        const result = await createSinglePackageInternal(single, session);
        if (result.error) {
          if (created.length === 0) {
            // rollback minimal si 1er colis échoue
            await prisma.shipment.delete({ where: { id: shipment.id } });
          }
          return NextResponse.json(
            { error: result.error },
            { status: result.status || 400 }
          );
        }
        created.push(result.package);
      }

      // Recalculer tous les agrégats du shipment (pas seulement les nouveaux colis)
      await recalcShipmentAggregates(shipment.id);

      return NextResponse.json(
        {
          message: isExistingShipment 
            ? `Colis ajoutés à l'expédition existante ${shipment.shipmentNumber}`
            : "Expédition créée",
          shipment: { id: shipment.id, shipmentNumber: shipment.shipmentNumber },
          packages: created,
          isExistingShipment,
        },
        { status: 201 }
      );
    }

    // ====== CAS 2: batch simple (array d'objets colis) ======
    if (Array.isArray(body)) {
      const results = [];
      const shipmentIds = new Set();
      
      for (const item of body) {
        const res = await createSinglePackageInternal(item, session);
        if (res.error) {
          return NextResponse.json(
            { error: res.error, index: results.length },
            { status: res.status || 400 }
          );
        }
        results.push(res.package);
        
        // Collecter les shipmentIds pour recalculer les agrégats après
        if (res.package.shipmentId) {
          shipmentIds.add(res.package.shipmentId);
        }
      }
      
      // Recalculer les agrégats pour tous les shipments concernés
      for (const shipmentId of shipmentIds) {
        await recalcShipmentAggregates(shipmentId);
      }
      
      return NextResponse.json(
        { message: "Colis créés", count: results.length, packages: results },
        { status: 201 }
      );
    }

    // ====== CAS 3: unitaire ======
    const single = await createSinglePackageInternal(body, session);
    if (single.error) {
      return NextResponse.json(
        { error: single.error },
        { status: single.status || 400 }
      );
    }
    
    // Recalculer les agrégats si le colis est lié à un shipment
    if (single.package.shipmentId) {
      await recalcShipmentAggregates(single.package.shipmentId);
    }
    
    return NextResponse.json(
      { message: "Colis créé avec succès", package: single.package },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/packages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du colis" },
      { status: 500 }
    );
  }
}

// ---------- createSinglePackageInternal ----------
// ---------- createSinglePackageInternal (strict container required) ----------
async function createSinglePackageInternal(body, session) {
  try {
    // --------- 1) Détection de format + parsing types ----------
    const isLegacyFormat = body.type && !body.types && !body.selectedTypes;
    const isMultiTypesFormat = Array.isArray(body.selectedTypes);
    const isDirectTypesFormat = body.types !== undefined;

    let typesData = [];
    let totalQuantity = 1;
    let basePrice = 0;

    if (isLegacyFormat) {
      // Ancien format: un seul type + quantity/basePrice
      if (!validTypes.includes(body.type)) {
        return { error: `Type invalide: ${body.type}`, status: 400 };
      }
      const q = Math.max(1, parseInt(body.quantity ?? 1, 10) || 1);
      const unit = Number(body.basePrice ?? 50) || 50;

      typesData = [
        { type: body.type, quantity: q, unitPrice: unit, isQuoteOnly: false },
      ];
      totalQuantity = q;
      basePrice = unit * q;
    } else if (isMultiTypesFormat) {
      // Nouveau format UI (plusieurs types)
      if (!body.selectedTypes.length) {
        return { error: "Au moins un type doit être sélectionné", status: 400 };
      }
      for (const item of body.selectedTypes) {
        if (!item?.type || !validTypes.includes(item.type)) {
          return { error: `Type invalide: ${item?.type}`, status: 400 };
        }
        const q = Number(item.quantity || 0);
        if (!Number.isFinite(q) || q < 1) {
          return { error: `Quantité invalide pour ${item.type}`, status: 400 };
        }
      }
      typesData = body.selectedTypes;
      totalQuantity = typesData.reduce(
        (s, it) => s + Number(it.quantity || 0),
        0
      );
      basePrice = typesData.reduce(
        (s, it) =>
          s +
          (it.isQuoteOnly
            ? 0
            : Number(it.unitPrice || 0) * Number(it.quantity || 0)),
        0
      );
    } else if (isDirectTypesFormat) {
      // Format "direct": body.types (string JSON ou array)
      try {
        typesData =
          typeof body.types === "string" ? JSON.parse(body.types) : body.types;
        if (!Array.isArray(typesData) || !typesData.length) {
          throw new Error("Types doit être un array non vide");
        }
      } catch {
        return { error: "Format de types invalide", status: 400 };
      }

      totalQuantity =
        Number(body.totalQuantity) ||
        typesData.reduce((s, it) => s + Number(it.quantity || 0), 0);

      basePrice =
        Number(body.basePrice) ||
        typesData.reduce(
          (s, it) =>
            s +
            (it.isQuoteOnly
              ? 0
              : Number(it.unitPrice || 0) * Number(it.quantity || 0)),
          0
        );
    } else {
      return {
        error:
          "Format de données invalide. Utilisez 'type' (legacy), 'selectedTypes' (nouveau), 'types' (direct) ou le batch wizard.",
        status: 400,
      };
    }

    // --------- 2) Champs requis minimaux ----------
    if (!body.clientId || !body.description) {
      return {
        error: "Champs requis manquants (clientId, description)",
        status: 400,
      };
    }

    // ⚠️ Conteneur obligatoire (exigence stricte)
    const clientId = body.clientId?.trim?.() || body.clientId;
    const containerId = body.containerId?.trim?.() || body.containerId;
    if (!containerId) {
      return {
        error: "Conteneur obligatoire (containerId manquant)",
        status: 400,
      };
    }

    // --------- 3) Existence entités ----------
    const [client, user, container] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.container.findUnique({ where: { id: containerId } }),
    ]);
    if (!client) return { error: "Client introuvable", status: 400 };
    if (!user)
      return { error: "Utilisateur de session introuvable", status: 401 };
    if (!container) return { error: "Conteneur introuvable", status: 400 };

    // --------- 4) Calculs & normalisations ----------
    const normalizedValue = toNumOrNull(body.value);
    const normalizedWeight = toNumOrNull(body.weight);
    const normalizedPickupFee =
      toNumOrNull(body.pickupFee) ?? (body.pickupAddress ? 20 : 0);
    const normalizedCustoms = toNumOrNull(body.customsFee) ?? 15;
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

    // ⚠️ IMPORTANT: Le paiement est géré au niveau du SHIPMENT uniquement
    // Les colis sont créés sans information de paiement
    const paidAmount = 0;
    const paymentStatus = "PENDING";
    const paidAt = null;
    const paymentMethod = null;

    // --------- 5) Génération packageNumber (retry si P2002) ----------
    const genPackageNumber = () => {
      const year = new Date().getFullYear();
      // 5 chiffres pseudo-aléatoires pour éviter les collisions en concurrence
      const suffix = String(Math.floor(Math.random() * 100000)).padStart(
        5,
        "0"
      );
      return `PKG${year}${suffix}`;
    };

    let packageNumber = genPackageNumber();
    let lastErr = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // --------- 6) Création du colis ----------
        const newPackage = await prisma.package.create({
          data: {
            packageNumber,
            client: { connect: { id: client.id } },
            user: { connect: { id: user.id } },
            container: { connect: { id: container.id } }, // obligatoire

            // Lien à une expédition si fourni → via RELATION
            ...(body.shipmentId
              ? { shipment: { connect: { id: body.shipmentId } } }
              : {}),

            // Contenu multi-types
            types: JSON.stringify(typesData),

            // Infos colis
            description: body.description,
            totalQuantity,
            weight: normalizedWeight,
            dimensions: body.dimensions || null,
            value: normalizedValue,
            priority: body.priority ?? "NORMAL",
            isFragile: !!body.isFragile,
            isInsured,

            // Logistique
            pickupAddress: body.pickupAddress || null,
            pickupDate: toDateOrNull(body.pickupDate),
            pickupTime: body.pickupTime || null,
            deliveryAddress:
              body.deliveryAddress || client.recipientAddress || null,
            specialInstructions: body.specialInstructions || null,
            notes: body.notes || null,

            // Tarifs
            basePrice,
            pickupFee: normalizedPickupFee,
            insuranceFee,
            customsFee: normalizedCustoms,
            discount,
            totalAmount,

            // Paiement
            paymentStatus,
            paymentMethod,
            paidAmount,
            paidAt,

            // Statut opérationnel par défaut
            status:
              body.status &&
              [
                "REGISTERED",
                "COLLECTED",
                "IN_CONTAINER",
                "IN_TRANSIT",
                "CUSTOMS",
                "DELIVERED",
                "RETURNED",
                "CANCELLED",
              ].includes(body.status)
                ? body.status
                : "REGISTERED",
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
              select: {
                id: true,
                containerNumber: true,
                name: true,
                status: true,
              },
            },
            shipment: { select: { id: true, shipmentNumber: true } },
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        // --------- 7) Audit (best-effort) ----------
        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "CREATE_PACKAGE",
              resource: "package",
              resourceId: newPackage.id,
              details: JSON.stringify({
                packageNumber,
                typesCount: typesData.length,
                totalQuantity,
                format: isLegacyFormat
                  ? "legacy"
                  : isMultiTypesFormat
                  ? "multi-types"
                  : "direct-types",
                shipmentId: body.shipmentId ?? null,
                containerId: container.id,
              }),
            },
          });
        } catch {}

        // Succès (le recalcul sera fait par l'appelant si nécessaire)
        return { package: { ...newPackage, parsedTypes: typesData } };
      } catch (e) {
        lastErr = e;
        // Conflit d'unicité sur packageNumber → on régénère et on ré-essaie
        if (e?.code === "P2002") {
          packageNumber = genPackageNumber();
          continue;
        }
        // Autre erreur → on sort
        throw e;
      }
    }

    // Si on sort de la boucle → collision persistante ou autre
    if (lastErr?.code === "P2002") {
      return {
        error: "Impossible de générer un numéro de colis unique. Réessayez.",
        status: 500,
      };
    }
    throw lastErr;
  } catch (e) {
    console.error("createSinglePackageInternal error:", e);
    return { error: "Erreur interne", status: 500 };
  }
}

// Génération robuste d'un numéro colis unique, avec retry
async function createPackageWithUniqueNumber(prisma, year, data, include) {
  // On part du nombre de colis déjà créés cette année
  const baseSeq =
    (await prisma.package.count({
      where: { packageNumber: { startsWith: `PKG${year}` } },
    })) + 1;

  const maxAttempts = 10; // essaie jusqu'à 10 numéros consécutifs

  for (let i = 0; i < maxAttempts; i++) {
    const seq = baseSeq + i;
    const packageNumber = `PKG${year}${String(seq).padStart(5, "0")}`;

    try {
      return await prisma.package.create({
        data: { ...data, packageNumber },
        include,
      });
    } catch (e) {
      // Collision d'unicité → on tente le numéro suivant
      if (
        e?.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        e.meta.target.includes("packageNumber")
      ) {
        continue;
      }
      // Autre erreur → on remonte
      throw e;
    }
  }

  throw new Error(
    "Impossible de générer un numéro de colis unique après plusieurs tentatives."
  );
}

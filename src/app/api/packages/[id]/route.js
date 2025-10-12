// app/api/packages/[id]/route.js
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
const toDateOrNull = (v) => (v === "" || v == null ? null : new Date(v));
const isValidPaymentStatus = (s) =>
  ["PENDING", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"].includes(s);
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
      paidAmount: true,
      paidAt: true,
      paymentMethod: true,
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
  
  // IMPORTANT: Calculer aussi le montant total payé à partir des colis
  const paidAmount = pkgs.reduce((s, p) => s + (p.paidAmount || 0), 0);
  
  const paymentStatus = derivePaymentStatus(totalAmount, paidAmount);
  
  // Trouver la date de paiement la plus récente et le dernier moyen de paiement utilisé
  const paidPackages = pkgs.filter(p => p.paidAt);
  let paidAt = null;
  let paymentMethod = null;
  
  if (paidPackages.length > 0) {
    // Trier par date de paiement décroissante
    const sortedByDate = paidPackages.sort((a, b) => 
      new Date(b.paidAt) - new Date(a.paidAt)
    );
    paidAt = sortedByDate[0].paidAt;
    paymentMethod = sortedByDate[0].paymentMethod;
  }

  console.log(`🔄 Recalcul agrégats shipment ${shipmentId}:`, {
    packagesCount,
    totalAmount,
    paidAmount,
    paymentStatus,
    paidAt,
    paymentMethod,
    packages: pkgs.map(p => ({ 
      totalAmount: p.totalAmount, 
      paidAmount: p.paidAmount, 
      paidAt: p.paidAt 
    }))
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
      paidAmount,
      paymentStatus,
      paidAt,
      paymentMethod,
    },
  });
  
  console.log(`✅ Shipment ${shipmentId} mis à jour avec succès`);
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // Await params

    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        client: true,
        container: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        files: true,
        invoiceItems: {
          include: {
            invoice: true,
          },
        },
        payments: true,
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Colis non trouvé" }, { status: 404 });
    }

    // Vérification des permissions
    if (session.user.role === "CLIENT") {
      const userClient = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (!userClient || pkg.clientId !== userClient.id) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    return NextResponse.json({ data: pkg });
  } catch (error) {
    console.error("Erreur GET /api/packages/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const existingPackage = await prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      return NextResponse.json({ error: "Colis non trouvé" }, { status: 404 });
    }

    // Vérifs relations
    if (body.clientId && body.clientId !== existingPackage.clientId) {
      const clientExists = await prisma.client.findUnique({
        where: { id: body.clientId },
        select: { id: true },
      });
      if (!clientExists)
        return NextResponse.json(
          { error: "Client non trouvé" },
          { status: 400 }
        );
    }
    if (body.containerId !== undefined && body.containerId !== null) {
      const containerExists = await prisma.container.findUnique({
        where: { id: body.containerId },
        select: { id: true },
      });
      if (!containerExists)
        return NextResponse.json(
          { error: "Conteneur non trouvé" },
          { status: 400 }
        );
    }

    // Normalisations côté chiffres
    const normalizedValue =
      body.value !== undefined
        ? toNumOrNull(body.value)
        : existingPackage.value;
    const normalizedWeight =
      body.weight !== undefined
        ? toNumOrNull(body.weight)
        : existingPackage.weight;

    const typeNew = body.type ?? existingPackage.type;

    // Pricing fallback
    const pricing = await prisma.pricing.findFirst({
      where: { type: typeNew, isActive: true },
    });

    // basePrice : front > existant > pricing > 50
    const basePrice =
      (body.basePrice !== undefined
        ? toNumOrNull(body.basePrice)
        : existingPackage.basePrice) ??
      pricing?.basePrice ??
      50;

    // pickupAddress final
    const pickupAddressNew =
      body.pickupAddress !== undefined
        ? body.pickupAddress
        : existingPackage.pickupAddress;

    // pickupFee : front > existant > (si adresse: pricing/20 sinon 0)
    let pickupFee;
    if (body.pickupFee !== undefined) {
      pickupFee = toNumOrNull(body.pickupFee) ?? 0;
    } else if (existingPackage.pickupFee != null) {
      pickupFee = existingPackage.pickupFee;
    } else {
      pickupFee = pickupAddressNew ? pricing?.pickupFee ?? 20 : 0;
    }

    // customs & discount
    const customsFee =
      (body.customsFee !== undefined
        ? toNumOrNull(body.customsFee)
        : existingPackage.customsFee) ?? 0;

    const discount = Math.max(
      0,
      (body.discount !== undefined
        ? toNumOrNull(body.discount)
        : existingPackage.discount) ?? 0
    );

    // assurance & insuranceFee serveur
    const isInsured =
      body.isInsured !== undefined
        ? !!body.isInsured
        : existingPackage.isInsured;

    const valueForInsurance = normalizedValue ?? 0;
    const insuranceFee =
      isInsured && valueForInsurance > 0
        ? Math.max(10, valueForInsurance * 0.02)
        : 0;

    // totalAmount
    const totalAmount = Math.max(
      0,
      Number(basePrice || 0) +
        Number(pickupFee || 0) +
        Number(insuranceFee || 0) +
        Number(customsFee || 0) -
        Number(discount || 0)
    );

    // Paiement : paidAmount, status, paidAt
    const paidAmount =
      body.paidAmount !== undefined
        ? Math.max(0, toNumOrNull(body.paidAmount) ?? 0)
        : existingPackage.paidAmount ?? 0;

    const paymentStatus =
      body.paymentStatus && isValidPaymentStatus(body.paymentStatus)
        ? body.paymentStatus
        : derivePaymentStatus(totalAmount, paidAmount);

    let paidAt;
    if (body.paidAt !== undefined) {
      paidAt = body.paidAt ? new Date(body.paidAt) : null;
    } else {
      if ((existingPackage.paidAmount ?? 0) === 0 && paidAmount > 0) {
        paidAt = new Date();
      } else if (paidAmount === 0) {
        paidAt = null;
      } else {
        paidAt = existingPackage.paidAt;
      }
    }

    // Construction data
    const data = {
      ...(body.clientId ? { client: { connect: { id: body.clientId } } } : {}),
      ...(body.containerId === null
        ? { container: { disconnect: true } }
        : body.containerId
        ? { container: { connect: { id: body.containerId } } }
        : {}),

      type: body.type ?? undefined,
      description: body.description ?? undefined,
      quantity:
        body.quantity !== undefined
          ? toIntOr(body.quantity, existingPackage.quantity ?? 1)
          : undefined,
      weight: body.weight !== undefined ? toNumOrNull(body.weight) : undefined,
      dimensions: body.dimensions ?? undefined,
      value: body.value !== undefined ? toNumOrNull(body.value) : undefined,
      priority: body.priority ?? undefined,
      isFragile: body.isFragile !== undefined ? !!body.isFragile : undefined,
      isInsured,
      pickupAddress:
        body.pickupAddress !== undefined ? pickupAddressNew || null : undefined,
      pickupDate:
        body.pickupDate !== undefined
          ? toDateOrNull(body.pickupDate)
          : undefined,
      pickupTime:
        body.pickupTime !== undefined ? body.pickupTime || null : undefined,
      deliveryAddress: body.deliveryAddress ?? undefined,
      specialInstructions:
        body.specialInstructions !== undefined
          ? body.specialInstructions || null
          : undefined,
      notes: body.notes !== undefined ? body.notes || null : undefined,
      paymentMethod:
        body.paymentMethod ?? existingPackage.paymentMethod ?? undefined,

      basePrice,
      pickupFee,
      insuranceFee,
      customsFee,
      discount,
      totalAmount,

      paidAmount,
      paymentStatus,
      paidAt,

      updatedAt: new Date(),
    };

    const updatedPackage = await prisma.package.update({
      where: { id },
      data,
      include: {
        client: true,
        container: true,
        user: true,
        shipment: {
          select: { id: true },
        },
      },
    });

    // Recalculer les agrégats du shipment si le colis est lié à une expédition
    if (updatedPackage.shipmentId) {
      await recalcShipmentAggregates(updatedPackage.shipmentId);
    }

    // Audit non bloquant
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_PACKAGE",
          resource: "package",
          resourceId: id,
          details: JSON.stringify({
            changes: Object.keys(body),
            packageNumber: updatedPackage.packageNumber,
          }),
        },
      });
    } catch (e) {
      console.warn("Audit log erreur:", e);
    }

    return NextResponse.json({
      message: "Colis modifié avec succès",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("Erreur PUT /api/packages/[id]:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Référence invalide - Vérifiez que le client et le conteneur existent",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la modification du colis" },
      { status: 500 }
    );
  }
}
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // Await params

    // Vérifier que le colis existe et peut être supprimé
    const packageToDelete = await prisma.package.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        payments: true,
      },
      select: {
        id: true,
        packageNumber: true,
        clientId: true,
        shipmentId: true,
        invoiceItems: true,
        payments: true,
      },
    });

    if (!packageToDelete) {
      return NextResponse.json({ error: "Colis non trouvé" }, { status: 404 });
    }
    
    // Sauvegarder le shipmentId avant suppression
    const shipmentId = packageToDelete.shipmentId;

    // Empêcher la suppression si des paiements existent
    if (packageToDelete.payments.length > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer un colis avec des paiements associés",
        },
        { status: 400 }
      );
    }

    // Supprimer les éléments de facture liés
    if (packageToDelete.invoiceItems.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: { packageId: id },
      });
    }

    // Supprimer les fichiers liés
    await prisma.file.deleteMany({
      where: { packageId: id },
    });

    // Supprimer le colis
    await prisma.package.delete({
      where: { id },
    });

    // Log audit - Vérifier que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (userExists) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "DELETE_PACKAGE",
            resource: "package",
            resourceId: id,
            details: JSON.stringify({
              packageNumber: packageToDelete.packageNumber,
              clientId: packageToDelete.clientId,
              shipmentId,
            }),
          },
        });
      } catch (auditError) {
        console.warn("Erreur lors de la création du log d'audit:", auditError);
      }
    }

    // Recalculer les agrégats du shipment si le colis était lié à une expédition
    if (shipmentId) {
      await recalcShipmentAggregates(shipmentId);
    }

    return NextResponse.json({
      message: "Colis supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/packages/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du colis" },
      { status: 500 }
    );
  }
}

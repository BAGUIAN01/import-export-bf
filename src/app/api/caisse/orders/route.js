// app/api/caisse/orders/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fonction de mapping des modes de paiement de la caisse vers l'enum Prisma
function mapPaymentMethod(caisseMethod) {
  if (!caisseMethod) return null;
  
  const mapping = {
    "ESPECES": "CASH",
    "CARTE": "CARD",
    "MOBILE": "MOBILE_MONEY",
    "VIREMENT": "TRANSFER",
  };
  
  return mapping[caisseMethod] || null;
}

// POST /api/caisse/orders - Créer une commande et générer une expédition
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, orderItems, orderTotal, orderSubtotal, orderOptions, paymentInfo, containerId } = body;

    // Validation
    if (!clientId) {
      return NextResponse.json({ error: "clientId manquant" }, { status: 400 });
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ error: "Aucun article dans la commande" }, { status: 400 });
    }

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Récupérer ou créer un conteneur actif
    let container = null;
    if (containerId) {
      container = await prisma.container.findUnique({
        where: { id: containerId },
      });
    }

    // Si pas de conteneur fourni, prendre le dernier conteneur actif (PREPARATION ou LOADED)
    if (!container) {
      container = await prisma.container.findFirst({
        where: {
          status: {
            in: ["PREPARATION", "LOADED"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Si toujours pas de conteneur, créer un nouveau conteneur
    if (!container) {
      const year = new Date().getFullYear();
      const cntCount = (await prisma.container.count()) + 1;
      const containerNumber = `CNT${year}${String(cntCount).padStart(5, "0")}`;

      container = await prisma.container.create({
        data: {
          containerNumber,
          name: `Conteneur ${containerNumber}`,
          status: "PREPARATION",
          origin: "France",
          destination: "Burkina Faso",
        },
      });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    // Vérifier si un shipment existe déjà pour ce client + conteneur
    let shipment = await prisma.shipment.findFirst({
      where: {
        clientId,
        containerId: container.id,
      },
    });

    const isExistingShipment = !!shipment;

    // Créer un nouveau shipment si nécessaire
    if (!shipment) {
      const year = new Date().getFullYear();
      const shCount = (await prisma.shipment.count()) + 1;
      const shipmentNumber = `SHP${year}${String(shCount).padStart(5, "0")}`;

      shipment = await prisma.shipment.create({
        data: {
          shipmentNumber,
          client: { connect: { id: clientId } },
          user: { connect: { id: user.id } },
          container: { connect: { id: container.id } },
          paymentMethod: mapPaymentMethod(paymentInfo?.modePaiement),
          paidAmount: paymentInfo?.montantRecu || 0,
          paidAt: paymentInfo?.paidAt ? new Date(paymentInfo.paidAt) : null,
          paymentStatus: paymentInfo?.montantRecu >= orderTotal ? "PAID" : paymentInfo?.montantRecu > 0 ? "PARTIAL" : "PENDING",
          specialInstructions: orderOptions?.specialInstructions || null,
          notes: orderOptions?.notes || null,
        },
      });
    } else {
      // Mettre à jour le paiement si un shipment existe déjà
      const currentPaidAmount = shipment.paidAmount || 0;
      const newPaidAmount = currentPaidAmount + (paymentInfo?.montantRecu || 0);
      const newTotal = (shipment.totalAmount || 0) + orderTotal;

      shipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          paymentMethod: paymentInfo?.modePaiement ? mapPaymentMethod(paymentInfo.modePaiement) : shipment.paymentMethod,
          paidAmount: newPaidAmount,
          paidAt: paymentInfo?.paidAt ? new Date(paymentInfo.paidAt) : shipment.paidAt,
          paymentStatus: newPaidAmount >= newTotal ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING",
        },
      });
    }

    // Récupérer les tarifs pour chaque type de colis
    const pricings = await prisma.pricing.findMany({
      where: { isActive: true },
    });

    const pricingMap = {};
    pricings.forEach((p) => {
      pricingMap[p.type] = p;
    });

    // Créer les packages pour chaque item de la commande
    const createdPackages = [];
    const discountPerPackage = orderOptions?.discount ? orderOptions.discount / orderItems.length : 0;
    const additionalFeesPerPackage = orderOptions?.additionalFees ? orderOptions.additionalFees / orderItems.length : 0;

    for (const item of orderItems) {
      // Utiliser productId comme type de colis (correspond au value dans PACKAGE_TYPES)
      const packageType = item.type || item.productId || "CARTON";
      
      // Trouver le pricing correspondant au type
      const pricing = pricingMap[packageType] || pricingMap["CARTON"]; // Fallback sur CARTON

      if (!pricing) {
        console.warn(`Pricing non trouvé pour le type: ${packageType}`);
        continue;
      }

      // Calculer les montants
      const basePrice = pricing.basePrice * item.quantity;
      const pickupFee = pricing.pickupFee || 0;
      const insuranceFee = item.isInsured && item.value ? Math.max(10, item.value * 0.02) : 0;
      const customsFee = 15; // Frais douaniers par défaut
      const discount = discountPerPackage;
      const totalAmount = Math.max(0, basePrice + pickupFee + insuranceFee + customsFee - discount + additionalFeesPerPackage);

      // Générer un numéro de colis unique
      const year = new Date().getFullYear();
      let packageNumber;
      let attempts = 0;
      do {
        const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
        packageNumber = `PKG${year}${suffix}`;
        attempts++;
        if (attempts > 10) {
          throw new Error("Impossible de générer un numéro de colis unique");
        }
      } while (await prisma.package.findUnique({ where: { packageNumber } }));

      // Créer le package
      const newPackage = await prisma.package.create({
        data: {
          packageNumber,
          client: { connect: { id: clientId } },
          container: { connect: { id: container.id } },
          shipment: { connect: { id: shipment.id } },
          user: { connect: { id: user.id } },
          types: JSON.stringify([{ type: packageType, quantity: item.quantity }]),
          description: item.name || item.description || `Colis ${packageType}`,
          totalQuantity: item.quantity,
          weight: item.weight || null,
          dimensions: item.dimensions || null,
          value: item.value || null,
          priority: orderOptions?.priority || "NORMAL",
          isFragile: item.isFragile || false,
          isInsured: item.isInsured || false,
          basePrice,
          pickupFee,
          insuranceFee,
          customsFee,
          discount,
          totalAmount,
          status: "REGISTERED",
          paymentStatus: "PENDING", // Le paiement est géré au niveau du shipment
        },
      });

      createdPackages.push(newPackage);
    }

    // Recalculer les agrégats du shipment
    const allPackages = await prisma.package.findMany({
      where: { shipmentId: shipment.id },
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

    const packagesCount = allPackages.length;
    const totalQuantity = allPackages.reduce((s, p) => s + (p.totalQuantity || 0), 0);
    const subtotal = allPackages.reduce((s, p) => s + (p.basePrice || 0), 0);
    const pickupFeeTotal = allPackages.reduce((s, p) => s + (p.pickupFee || 0), 0);
    const insuranceFeeTotal = allPackages.reduce((s, p) => s + (p.insuranceFee || 0), 0);
    const customsFeeTotal = allPackages.reduce((s, p) => s + (p.customsFee || 0), 0);
    const discountTotal = allPackages.reduce((s, p) => s + (p.discount || 0), 0);
    const totalAmount = Math.max(0, subtotal + pickupFeeTotal + insuranceFeeTotal + customsFeeTotal - discountTotal);

    // Mettre à jour le shipment avec les agrégats
    shipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        packagesCount,
        totalQuantity,
        subtotal,
        pickupFeeTotal,
        insuranceFeeTotal,
        customsFeeTotal,
        discountTotal,
        totalAmount,
      },
    });

    // Log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_ORDER_FROM_CAISSE",
          resource: "shipment",
          resourceId: shipment.id,
          details: JSON.stringify({
            shipmentNumber: shipment.shipmentNumber,
            clientId,
            containerId: container.id,
            packagesCount: createdPackages.length,
            orderTotal,
            paymentMethod: paymentInfo?.modePaiement,
            paidAmount: paymentInfo?.montantRecu || 0,
            isExistingShipment,
          }),
        },
      });
    } catch (auditError) {
      console.warn("Erreur lors de la création du log d'audit:", auditError);
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
      },
      container: {
        id: container.id,
        containerNumber: container.containerNumber,
      },
      packages: createdPackages.map((p) => ({
        id: p.id,
        packageNumber: p.packageNumber,
      })),
      isExistingShipment,
    });
  } catch (error) {
    console.error("Erreur POST /api/caisse/orders:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de la commande" },
      { status: 500 }
    );
  }
}


// app/api/shipments/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { derivePaymentStatus } from "@/lib/utils/package-helpers";

// GET /api/shipments/[id]
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Récupération du shipment avec ses relations
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            city: true,
            country: true,
            recipientName: true,
            recipientPhone: true,
            recipientEmail: true,
            recipientAddress: true,
            recipientCity: true,
            recipientRelation: true,
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
            capacity: true,
            currentLoad: true,
          },
        },
        user: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true 
          } 
        },
        packages: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                recipientCity: true,
                recipientAddress: true,
              },
            },
            container: { 
              select: { 
                id: true, 
                name: true, 
                containerNumber: true, 
                status: true 
              } 
            },
            user: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true 
              } 
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Expédition introuvable" }, { status: 404 });
    }

    // Vérifier les permissions pour les clients
    if (session.user.role === "CLIENT") {
      const userClient = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (!userClient || userClient.id !== shipment.clientId) {
        return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
      }
    }

    // Calculer les statistiques
    const packages = shipment.packages || [];
    const stats = {
      packagesCount: packages.length,
      totalQuantity: packages.reduce((sum, p) => sum + (p.totalQuantity || 0), 0),
      totalWeight: packages.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0),
      totalValue: packages.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0),
      statusBreakdown: packages.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
      paymentBreakdown: packages.reduce((acc, p) => {
        acc[p.paymentStatus] = (acc[p.paymentStatus] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      shipment,
      packages,
      stats,
    });

  } catch (error) {
    console.error("Erreur GET /api/shipments/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/shipments/[id]
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que le shipment existe
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existingShipment) {
      return NextResponse.json({ error: "Expédition introuvable" }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData = {};

    if (body.containerId !== undefined) {
      updateData.containerId = body.containerId;
    }

    if (body.pickupAddress !== undefined) {
      updateData.pickupAddress = body.pickupAddress;
    }

    if (body.pickupDate !== undefined) {
      updateData.pickupDate = body.pickupDate ? new Date(body.pickupDate) : null;
    }

    if (body.pickupTime !== undefined) {
      updateData.pickupTime = body.pickupTime;
    }

    if (body.deliveryAddress !== undefined) {
      updateData.deliveryAddress = body.deliveryAddress;
    }

    if (body.specialInstructions !== undefined) {
      updateData.specialInstructions = body.specialInstructions;
    }

    if (body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.paymentStatus;
    }

    if (body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.paymentMethod;
    }

    if (body.paidAmount !== undefined) {
      updateData.paidAmount = Number(body.paidAmount);
    }

    if (body.paidAt !== undefined) {
      updateData.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // Recalculer automatiquement le paymentStatus si paidAmount est modifié
    if (body.paidAmount !== undefined) {
      const paidAmount = Number(body.paidAmount);
      const totalAmount = existingShipment.totalAmount || 0;
      
      updateData.paymentStatus = derivePaymentStatus(totalAmount, paidAmount);
      
      console.log(`🔄 Recalcul paymentStatus pour shipment ${id}:`, {
        paidAmount,
        totalAmount,
        paymentStatus: updateData.paymentStatus
      });
    }

    // Debug: afficher les données avant mise à jour
    console.log(`🔍 Données de mise à jour pour shipment ${id}:`, updateData);

    // Mise à jour
    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: updateData,
    });

    // Debug: afficher les données après mise à jour
    console.log(`✅ Shipment ${id} mis à jour:`, {
      paidAmount: updatedShipment.paidAmount,
      paymentStatus: updatedShipment.paymentStatus,
      paymentMethod: updatedShipment.paymentMethod,
      paidAt: updatedShipment.paidAt
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_SHIPMENT",
        resource: "shipment",
        resourceId: id,
        details: {
          shipmentId: id,
          shipmentNumber: existingShipment.shipmentNumber,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      message: "Expédition modifiée avec succès",
      shipment: updatedShipment,
    });

  } catch (error) {
    console.error("Erreur PUT /api/shipments/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'expédition" },
      { status: 500 }
    );
  }
}

// DELETE /api/shipments/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le shipment existe
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { packages: true }
        }
      }
    });

    if (!shipment) {
      return NextResponse.json({ error: "Expédition introuvable" }, { status: 404 });
    }

    // Vérifier s'il y a des colis
    if (shipment._count.packages > 0) {
      return NextResponse.json(
        { 
          error: `Impossible de supprimer cette expédition car elle contient ${shipment._count.packages} colis. Supprimez d'abord tous les colis.` 
        },
        { status: 400 }
      );
    }

    // Suppression
    await prisma.shipment.delete({
      where: { id },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_SHIPMENT",
        resource: "shipment",
        resourceId: id,
        details: {
          shipmentId: id,
          shipmentNumber: shipment.shipmentNumber,
          packagesCount: shipment._count.packages,
        },
      },
    });

    return NextResponse.json({
      message: "Expédition supprimée avec succès",
    });

  } catch (error) {
    console.error("Erreur DELETE /api/shipments/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'expédition" },
      { status: 500 }
    );
  }
}

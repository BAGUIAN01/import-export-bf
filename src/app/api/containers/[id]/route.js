import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // Await params

    const container = await prisma.container.findUnique({
      where: { id },
      include: {
        packages: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                clientCode: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        trackingUpdates: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            timestamp: "desc",
          },
        },
        _count: {
          select: {
            packages: true,
            trackingUpdates: true,
          },
        },
      },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Conteneur non trouvé" },
        { status: 404 }
      );
    }

    // Calcul des statistiques
    const stats = {
      packagesCount: container._count.packages,
      totalAmount: container.packages.reduce(
        (sum, pkg) => sum + pkg.totalAmount,
        0
      ),
      totalWeight: container.packages.reduce(
        (sum, pkg) => sum + (pkg.weight || 0),
        0
      ),
      avgPackageValue:
        container.packages.length > 0
          ? container.packages.reduce((sum, pkg) => sum + pkg.totalAmount, 0) /
            container.packages.length
          : 0,
      lastUpdate: container.trackingUpdates[0]?.timestamp || null,
      clientsCount: new Set(container.packages.map((pkg) => pkg.clientId)).size,
      statusBreakdown: container.packages.reduce((acc, pkg) => {
        acc[pkg.status] = (acc[pkg.status] || 0) + 1;
        return acc;
      }, {}),
      paymentBreakdown: container.packages.reduce((acc, pkg) => {
        acc[pkg.paymentStatus] = (acc[pkg.paymentStatus] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      container: {
        ...container,
        currentLoad: container.packages.length, // Mettre à jour avec le vrai compte
        packagesCount: container.packages.length,
        _count: undefined,
      },
      stats,
    });
  } catch (error) {
    console.error("Erreur GET /api/containers/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // Await params
    const body = await request.json();

    // Vérifier que le conteneur existe
    const existingContainer = await prisma.container.findUnique({
      where: { id },
    });

    if (!existingContainer) {
      return NextResponse.json(
        { error: "Conteneur non trouvé" },
        { status: 404 }
      );
    }

    // Validation des données (optionnelle, selon vos besoins)
    const updateData = {};

    // Champs modifiables
    if (body.name !== undefined) updateData.name = body.name?.trim() || null;
    if (body.departureDate !== undefined)
      updateData.departureDate = body.departureDate
        ? new Date(body.departureDate)
        : null;
    if (body.actualDeparture !== undefined)
      updateData.actualDeparture = body.actualDeparture
        ? new Date(body.actualDeparture)
        : null;
    if (body.arrivalDate !== undefined)
      updateData.arrivalDate = body.arrivalDate
        ? new Date(body.arrivalDate)
        : null;
    if (body.actualArrival !== undefined)
      updateData.actualArrival = body.actualArrival
        ? new Date(body.actualArrival)
        : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.capacity !== undefined)
      updateData.capacity = parseInt(body.capacity);
    if (body.maxWeight !== undefined)
      updateData.maxWeight = parseFloat(body.maxWeight);
    if (body.currentLocation !== undefined)
      updateData.currentLocation = body.currentLocation?.trim() || null;
    if (body.transportCompany !== undefined)
      updateData.transportCompany = body.transportCompany?.trim() || null;
    if (body.driverName !== undefined)
      updateData.driverName = body.driverName?.trim() || null;
    if (body.driverPhone !== undefined)
      updateData.driverPhone = body.driverPhone?.trim() || null;
    if (body.plateNumber !== undefined)
      updateData.plateNumber = body.plateNumber?.trim() || null;
    if (body.transportCost !== undefined)
      updateData.transportCost = body.transportCost
        ? parseFloat(body.transportCost)
        : null;
    if (body.customsCost !== undefined)
      updateData.customsCost = body.customsCost
        ? parseFloat(body.customsCost)
        : null;
    if (body.totalCost !== undefined)
      updateData.totalCost = body.totalCost ? parseFloat(body.totalCost) : null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    updateData.updatedAt = new Date();

    // Mise à jour du conteneur
    const updatedContainer = await prisma.container.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { packages: true },
        },
      },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_CONTAINER",
        resource: "container",
        resourceId: id,
        details: JSON.stringify({
          containerNumber: updatedContainer.containerNumber,
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    return NextResponse.json({
      message: "Conteneur modifié avec succès",
      container: {
        ...updatedContainer,
        packagesCount: updatedContainer._count.packages,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Erreur PUT /api/containers/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du conteneur" },
      { status: 500 }
    );
  }
}
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le conteneur existe et peut être supprimé
    const containerToDelete = await prisma.container.findUnique({
      where: { id },
      include: {
        packages: true,
        trackingUpdates: true,
      },
    });

    if (!containerToDelete) {
      return NextResponse.json(
        { error: "Conteneur non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la suppression si des colis sont liés et en cours
    const activePackages = containerToDelete.packages.filter(
      (pkg) => !["DELIVERED", "CANCELLED", "RETURNED"].includes(pkg.status)
    );

    if (activePackages.length > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer le conteneur. ${activePackages.length} colis sont encore en cours de traitement.`,
        },
        { status: 400 }
      );
    }

    // Transaction pour supprimer en cascade
    await prisma.$transaction(async (tx) => {
      // Supprimer les mises à jour de tracking
      await tx.trackingUpdate.deleteMany({
        where: { containerId: id },
      });

      // Mettre à jour les colis pour retirer la référence au conteneur
      await tx.package.updateMany({
        where: { containerId: id },
        data: { containerId: null },
      });

      // Supprimer le conteneur
      await tx.container.delete({
        where: { id },
      });
    });

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE_CONTAINER",
          resource: "container",
          resourceId: id,
          details: JSON.stringify({
            containerNumber: containerToDelete.containerNumber,
            packagesCount: containerToDelete.packages.length,
          }),
        },
      });
    } catch (auditError) {
      console.warn("Erreur audit log:", auditError);
    }

    return NextResponse.json({
      message: "Conteneur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/containers/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du conteneur" },
      { status: 500 }
    );
  }
}

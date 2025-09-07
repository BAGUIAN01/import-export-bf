
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

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
              },
            },
          },
        },
        trackingUpdates: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Conteneur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ data: container });
  } catch (error) {
    console.error('Erreur GET /api/containers/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que le conteneur existe
    const existingContainer = await prisma.container.findUnique({
      where: { id },
    });

    if (!existingContainer) {
      return NextResponse.json({ error: 'Conteneur non trouvé' }, { status: 404 });
    }

    // Calcul du coût total si les coûts sont modifiés
    let updateData = { ...body };
    const transportCost = body.transportCost || existingContainer.transportCost || 0;
    const customsCost = body.customsCost || existingContainer.customsCost || 0;
    const totalCost = transportCost + customsCost;
    
    if (totalCost > 0) {
      updateData.totalCost = totalCost;
    }

    // Conversion des dates
    if (body.departureDate) {
      updateData.departureDate = new Date(body.departureDate);
    }
    if (body.arrivalDate) {
      updateData.arrivalDate = new Date(body.arrivalDate);
    }

    const updatedContainer = await prisma.container.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        packages: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_CONTAINER',
          resource: 'container',
          resourceId: id,
          details: JSON.stringify({ 
            changes: Object.keys(body),
            containerNumber: updatedContainer.containerNumber 
          }),
        },
      });
    } catch (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    return NextResponse.json({
      message: 'Conteneur modifié avec succès',
      container: updatedContainer,
    });

  } catch (error) {
    console.error('Erreur PUT /api/containers/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du conteneur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
      return NextResponse.json({ error: 'Conteneur non trouvé' }, { status: 404 });
    }

    // Empêcher la suppression si des colis sont liés et en cours
    const activePackages = containerToDelete.packages.filter(pkg => 
      !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(pkg.status)
    );

    if (activePackages.length > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer le conteneur. ${activePackages.length} colis sont encore en cours de traitement.` },
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
          action: 'DELETE_CONTAINER',
          resource: 'container',
          resourceId: id,
          details: JSON.stringify({ 
            containerNumber: containerToDelete.containerNumber,
            packagesCount: containerToDelete.packages.length
          }),
        },
      });
    } catch (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    return NextResponse.json({
      message: 'Conteneur supprimé avec succès',
    });

  } catch (error) {
    console.error('Erreur DELETE /api/containers/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du conteneur' },
      { status: 500 }
    );
  }
}
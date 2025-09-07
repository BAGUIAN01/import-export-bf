// app/api/containers/[id]/status/route.js - Endpoint spécialisé pour mise à jour de statut
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const { status, currentLocation, notes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Le statut est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    const validStatuses = [
      'PREPARATION', 'LOADED', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'CANCELLED'
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Récupérer l'ancien statut pour l'audit
    const currentContainer = await prisma.container.findUnique({
      where: { id },
      select: { status: true, containerNumber: true },
    });

    if (!currentContainer) {
      return NextResponse.json({ error: 'Conteneur non trouvé' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (currentLocation) {
      updateData.currentLocation = currentLocation;
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Mise à jour du statut avec actualisation des dates
    if (status === 'IN_TRANSIT' && !currentContainer.actualDeparture) {
      updateData.actualDeparture = new Date();
    }
    if (status === 'DELIVERED') {
      updateData.actualArrival = new Date();
    }

    const updatedContainer = await prisma.container.update({
      where: { id },
      data: updateData,
      include: {
        packages: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Créer une mise à jour de tracking automatique
    if (currentLocation) {
      try {
        await prisma.trackingUpdate.create({
          data: {
            containerId: id,
            userId: session.user.id,
            location: currentLocation,
            description: `Conteneur mis à jour: ${status}`,
            isPublic: true,
            timestamp: new Date(),
          },
        });
      } catch (trackingError) {
        console.warn('Erreur création tracking update:', trackingError);
      }
    }

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_CONTAINER_STATUS',
          resource: 'container',
          resourceId: id,
          details: JSON.stringify({
            oldStatus: currentContainer.status,
            newStatus: status,
            currentLocation,
            notes,
            containerNumber: currentContainer.containerNumber,
          }),
        },
      });
    } catch (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    return NextResponse.json({
      message: 'Statut du conteneur mis à jour avec succès',
      container: updatedContainer,
    });

  } catch (error) {
    console.error('Erreur PATCH /api/containers/[id]/status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
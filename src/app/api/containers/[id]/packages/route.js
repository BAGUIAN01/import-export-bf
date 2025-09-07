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

    const packages = await prisma.package.findMany({
      where: { containerId: id },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: packages });
  } catch (error) {
    console.error('Erreur GET /api/containers/[id]/packages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const { packageIds } = await request.json();

    if (!packageIds || !Array.isArray(packageIds)) {
      return NextResponse.json(
        { error: 'Liste des IDs de colis requise' },
        { status: 400 }
      );
    }

    // Vérifier que le conteneur existe et peut accueillir les colis
    const container = await prisma.container.findUnique({
      where: { id },
      select: { 
        id: true, 
        capacity: true, 
        currentLoad: true, 
        status: true,
        containerNumber: true 
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Conteneur non trouvé' }, { status: 404 });
    }

    if (container.status !== 'PREPARATION') {
      return NextResponse.json(
        { error: 'Impossible d\'ajouter des colis à un conteneur qui n\'est pas en préparation' },
        { status: 400 }
      );
    }

    const availableSpace = container.capacity - container.currentLoad;
    if (packageIds.length > availableSpace) {
      return NextResponse.json(
        { error: `Capacité insuffisante. Espace disponible: ${availableSpace} colis` },
        { status: 400 }
      );
    }

    // Vérifier que tous les colis existent et peuvent être assignés
    const packages = await prisma.package.findMany({
      where: {
        id: { in: packageIds },
        containerId: null,
        status: 'REGISTERED',
      },
    });

    if (packages.length !== packageIds.length) {
      return NextResponse.json(
        { error: 'Certains colis ne peuvent pas être assignés (déjà dans un conteneur ou statut incorrect)' },
        { status: 400 }
      );
    }

    // Transaction pour assigner les colis et mettre à jour le conteneur
    const result = await prisma.$transaction(async (tx) => {
      // Assigner les colis au conteneur
      await tx.package.updateMany({
        where: { id: { in: packageIds } },
        data: { 
          containerId: id,
          status: 'IN_CONTAINER',
          updatedAt: new Date(),
        },
      });

      // Mettre à jour la charge du conteneur
      const updatedContainer = await tx.container.update({
        where: { id },
        data: {
          currentLoad: container.currentLoad + packages.length,
          updatedAt: new Date(),
        },
      });

      return updatedContainer;
    });

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ASSIGN_PACKAGES_TO_CONTAINER',
          resource: 'container',
          resourceId: id,
          details: JSON.stringify({
            containerNumber: container.containerNumber,
            packageIds,
            packagesCount: packages.length,
          }),
        },
      });
    } catch (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    return NextResponse.json({
      message: `${packages.length} colis assignés au conteneur avec succès`,
      container: result,
    });

  } catch (error) {
    console.error('Erreur POST /api/containers/[id]/packages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation des colis' },
      { status: 500 }
    );
  }
}
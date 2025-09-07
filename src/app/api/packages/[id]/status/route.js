import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;
    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Le statut est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    const validStatuses = [
      'REGISTERED', 'COLLECTED', 'IN_CONTAINER', 
      'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'RETURNED', 'CANCELLED'
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Récupérer l'ancien statut pour l'audit
    const currentPackage = await prisma.package.findUnique({
      where: { id },
      select: { status: true, packageNumber: true },
    });

    if (!currentPackage) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        container: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_PACKAGE_STATUS',
        resource: 'package',
        resourceId: id,
        details: JSON.stringify({
          oldStatus: currentPackage.status,
          newStatus: status,
          notes,
          packageNumber: currentPackage.packageNumber,
        }),
      },
    });

    // Notification automatique (optionnel)
    if (updatedPackage.client && ['IN_TRANSIT', 'DELIVERED'].includes(status)) {
      // Ici vous pourriez envoyer une notification WhatsApp/SMS
      // await sendNotification(updatedPackage.client, status, updatedPackage.packageNumber);
    }

    return NextResponse.json({
      message: 'Statut mis à jour avec succès',
      package: updatedPackage,
    });

  } catch (error) {
    console.error('Erreur PATCH /api/packages/[id]/status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
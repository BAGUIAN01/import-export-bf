// app/api/packages/[id]/route.js
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
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    // Vérification des permissions
    if (session.user.role === 'CLIENT') {
      const userClient = await prisma.client.findFirst({
        where: { userId: session.user.id }
      });
      if (!userClient || pkg.clientId !== userClient.id) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }

    return NextResponse.json({ data: pkg });
  } catch (error) {
    console.error('Erreur GET /api/packages/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params; // Await params
    const body = await request.json();

    // Vérifier que le colis existe
    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    // Vérifier que le client existe (si changé)
    if (body.clientId && body.clientId !== existingPackage.clientId) {
      const clientExists = await prisma.client.findUnique({
        where: { id: body.clientId },
        select: { id: true }
      });

      if (!clientExists) {
        return NextResponse.json(
          { error: 'Client non trouvé' },
          { status: 400 }
        );
      }
    }

    // Vérifier que le conteneur existe (si spécifié)
    if (body.containerId) {
      const containerExists = await prisma.container.findUnique({
        where: { id: body.containerId },
        select: { id: true }
      });

      if (!containerExists) {
        return NextResponse.json(
          { error: 'Conteneur non trouvé' },
          { status: 400 }
        );
      }
    }

    // Recalcul du prix si nécessaire
    let updateData = { ...body };
    if (body.type !== existingPackage.type || body.weight !== existingPackage.weight) {
      const pricing = await prisma.pricing.findFirst({
        where: { 
          type: body.type || existingPackage.type,
          isActive: true 
        },
      });

      const basePrice = pricing?.basePrice || existingPackage.basePrice;
      const pickupFee = (body.pickupAddress || existingPackage.pickupAddress) ? 
        (pricing?.pickupFee || 20) : 0;
      const insuranceFee = (body.isInsured && body.value) ? 
        (body.value * 0.02) : 0;
      const customsFee = 15;
      const totalAmount = basePrice + pickupFee + insuranceFee + customsFee;

      updateData = {
        ...updateData,
        basePrice,
        pickupFee,
        insuranceFee,
        customsFee,
        totalAmount,
      };
    }

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        ...updateData,
        pickupDate: body.pickupDate ? new Date(body.pickupDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        container: true,
        user: true,
      },
    });

    // Log audit - Vérifier que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (userExists) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE_PACKAGE',
            resource: 'package',
            resourceId: id,
            details: JSON.stringify({ 
              changes: Object.keys(body),
              packageNumber: updatedPackage.packageNumber 
            }),
          },
        });
      } catch (auditError) {
        console.warn('Erreur lors de la création du log d\'audit:', auditError);
        // Continue sans bloquer la réponse
      }
    }

    return NextResponse.json({
      message: 'Colis modifié avec succès',
      package: updatedPackage,
    });

  } catch (error) {
    console.error('Erreur PUT /api/packages/[id]:', error);
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Référence invalide - Vérifiez que le client et le conteneur existent' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la modification du colis' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params; // Await params

    // Vérifier que le colis existe et peut être supprimé
    const packageToDelete = await prisma.package.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        payments: true,
      },
    });

    if (!packageToDelete) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    // Empêcher la suppression si des paiements existent
    if (packageToDelete.payments.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un colis avec des paiements associés' },
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
      select: { id: true }
    });

    if (userExists) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'DELETE_PACKAGE',
            resource: 'package',
            resourceId: id,
            details: JSON.stringify({ 
              packageNumber: packageToDelete.packageNumber,
              clientId: packageToDelete.clientId 
            }),
          },
        });
      } catch (auditError) {
        console.warn('Erreur lors de la création du log d\'audit:', auditError);
        // Continue sans bloquer la réponse
      }
    }

    return NextResponse.json({
      message: 'Colis supprimé avec succès',
    });

  } catch (error) {
    console.error('Erreur DELETE /api/packages/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du colis' },
      { status: 500 }
    );
  }
}
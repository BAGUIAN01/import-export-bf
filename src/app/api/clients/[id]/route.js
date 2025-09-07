import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        packages: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            packages: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Erreur récupération client:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du client" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ message: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await request.json();

    // Vérification que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    });

    if (!existingClient) {
      return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    }

    // Vérification unicité du téléphone (sauf pour le client actuel)
    if (body.phone && body.phone !== existingClient.phone) {
      const phoneExists = await prisma.client.findFirst({
        where: { 
          phone: body.phone,
          id: { not: params.id }
        }
      });

      if (phoneExists) {
        return NextResponse.json(
          { message: "Un autre client avec ce numéro de téléphone existe déjà" },
          { status: 400 }
        );
      }
    }

    // Mise à jour du client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName?.trim(),
        lastName: body.lastName?.trim(),
        phone: body.phone?.trim(),
        email: body.email?.trim() || null,
        address: body.address?.trim(),
        city: body.city?.trim(),
        country: body.country,
        postalCode: body.postalCode?.trim() || null,
        company: body.company?.trim() || null,
        siret: body.siret?.trim() || null,
        recipientName: body.recipientName?.trim(),
        recipientPhone: body.recipientPhone?.trim(),
        recipientEmail: body.recipientEmail?.trim() || null,
        recipientAddress: body.recipientAddress?.trim(),
        recipientCity: body.recipientCity?.trim(),
        recipientRelation: body.recipientRelation?.trim() || null,
        isVip: body.isVip !== undefined ? !!body.isVip : undefined,
        creditLimit: body.creditLimit !== undefined ? body.creditLimit : undefined,
        notes: body.notes?.trim() || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Client modifié avec succès",
      client,
    });
  } catch (error) {
    console.error("Erreur modification client:", error);
    return NextResponse.json(
      { message: "Erreur lors de la modification du client" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (!['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: "Seuls les administrateurs peuvent supprimer des clients" }, { status: 403 });
    }

    const { id } = await params;

    // Vérification que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            packages: true,
          },
        },
      },
    });

    if (!existingClient) {
      return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    }

    // Vérification des colis associés
    if (existingClient._count.packages > 0) {
      return NextResponse.json(
        { 
          message: `Impossible de supprimer le client. Il a ${existingClient._count.packages} colis associé(s). Supprimez d'abord les colis ou désactivez le client.` 
        },
        { status: 400 }
      );
    }

    // Suppression du client
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Client supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression client:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du client" },
      { status: 500 }
    );
  }
}
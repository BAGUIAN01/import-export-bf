// app/api/clients/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const validateClientData = (data) => {
  const errors = {};
  
  if (!data.firstName?.trim()) errors.firstName = "Le prénom est requis";
  if (!data.lastName?.trim()) errors.lastName = "Le nom est requis";
  if (!data.phone?.trim()) errors.phone = "Le téléphone est requis";
  if (!data.address?.trim()) errors.address = "L'adresse est requise";
  if (!data.city?.trim()) errors.city = "La ville est requise";
  if (!data.country?.trim()) errors.country = "Le pays est requis";
  
  // Destinataire
  if (!data.recipientName?.trim()) errors.recipientName = "Le nom du destinataire est requis";
  if (!data.recipientPhone?.trim()) errors.recipientPhone = "Le téléphone du destinataire est requis";
  if (!data.recipientAddress?.trim()) errors.recipientAddress = "L'adresse du destinataire est requise";
  if (!data.recipientCity?.trim()) errors.recipientCity = "La ville du destinataire est requise";
  
  // Validation email
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email invalide";
  }
  if (data.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.recipientEmail)) {
    errors.recipientEmail = "Email du destinataire invalide";
  }
  
  return errors;
};

// GET /api/clients/[id]
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Récupération du client avec ses colis et statistiques
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        packages: {
          orderBy: { createdAt: "desc" },
          include: {
            container: {
              select: {
                id: true,
                containerNumber: true,
                name: true,
                status: true,
              }
            }
          }
        },
        _count: {
          select: { packages: true }
        }
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Si c'est un client connecté, vérifier qu'il accède à ses propres données
    if (session.user.role === "CLIENT") {
      const userClient = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (!userClient || userClient.id !== client.id) {
        return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
      }
    }

    // Calcul des statistiques du client
    const packages = client.packages;
    const totalSpent = packages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0);
    const packagesCount = packages.length;
    const avgOrderValue = packagesCount > 0 ? totalSpent / packagesCount : 0;
    const lastOrderDate = packagesCount > 0 ? packages[0].createdAt : null;

    // Statistiques par statut
    const statusBreakdown = packages.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {});

    // Statistiques par statut de paiement
    const paymentBreakdown = packages.reduce((acc, pkg) => {
      acc[pkg.paymentStatus] = (acc[pkg.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      totalSpent,
      packagesCount,
      avgOrderValue,
      lastOrderDate,
      statusBreakdown,
      paymentBreakdown,
    };

    // Mise à jour du totalSpent si nécessaire
    if (client.totalSpent !== totalSpent) {
      await prisma.client.update({
        where: { id },
        data: { totalSpent },
      });
      client.totalSpent = totalSpent;
    }

    return NextResponse.json({
      client: {
        ...client,
        packagesCount: client._count.packages,
        _count: undefined,
      },
      packages,
      stats,
    });

  } catch (error) {
    console.error("Erreur GET /api/clients/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/clients/[id]
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Vérification de l'existence du client
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Validation des données
    const errors = validateClientData(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Données invalides", errors }, { status: 400 });
    }

    // Vérification de l'unicité du téléphone (sauf pour le client actuel)
    if (body.phone !== existingClient.phone) {
      const phoneExists = await prisma.client.findFirst({
        where: { 
          phone: body.phone,
          id: { not: id }
        }
      });
      
      if (phoneExists) {
        return NextResponse.json(
          { error: "Un autre client avec ce numéro de téléphone existe déjà" },
          { status: 400 }
        );
      }
    }

    // Mise à jour du client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        address: body.address.trim(),
        city: body.city.trim(),
        country: body.country.trim(),
        postalCode: body.postalCode?.trim() || null,
        company: body.company?.trim() || null,
        recipientName: body.recipientName.trim(),
        recipientPhone: body.recipientPhone.trim(),
        recipientEmail: body.recipientEmail?.trim() || null,
        recipientAddress: body.recipientAddress.trim(),
        recipientCity: body.recipientCity.trim(),
        recipientRelation: body.recipientRelation?.trim() || null,
        isVip: !!body.isVip,
        isActive: body.isActive !== undefined ? !!body.isActive : existingClient.isActive,
        notes: body.notes?.trim() || null,
      },
    });

    // Log d'audit — details en OBJET JSON + clientId
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_CLIENT",
        resource: "client",
        resourceId: id,
        details: {
          clientId: id,
          clientCode: existingClient.clientCode,
          changes: Object.keys(body),
        },
        // Optionnel si tu veux tracer le contexte :
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json({
      message: "Client modifié avec succès",
      client: updatedClient,
    });

  } catch (error) {
    console.error("Erreur PUT /api/clients/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Vérification de l'existence du client
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { packages: true }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Vérification s'il y a des colis associés
    if (client._count.packages > 0) {
      return NextResponse.json(
        { 
          error: `Impossible de supprimer ce client car il a ${client._count.packages} colis associé(s). Supprimez d'abord tous ses colis.` 
        },
        { status: 400 }
      );
    }

    // Suppression du client
    await prisma.client.delete({
      where: { id },
    });

    // Log d'audit — details en OBJET JSON + clientId
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_CLIENT",
        resource: "client",
        resourceId: id,
        details: {
          clientId: id,
          clientCode: client.clientCode,
          packagesCount: client._count.packages,
        },
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json({
      message: "Client supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur DELETE /api/clients/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client" },
      { status: 500 }
    );
  }
}

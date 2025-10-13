// app/api/clients/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helpers
const generateClientCode = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.client.count();
  return `CLI${year}${String(count + 1).padStart(4, "0")}`;
};

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

// GET /api/clients
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const country = searchParams.get("country");
    const includeStats = searchParams.get("includeStats") === "true";

    // Construction des filtres
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { clientCode: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "vip") where.isVip = true;
    if (country && country !== "all") where.country = country;

    // Récupération des clients avec les shipments et montants
    const clients = await prisma.client.findMany({
      where,
      include: {
        packages: {
          select: {
            id: true,
            totalAmount: true,
            shipmentId: true,
          },
        },
        shipments: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            paymentStatus: true,
            packagesCount: true,
          },
        },
        _count: {
          select: { 
            packages: true,
            shipments: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrichissement des données clients avec les montants
    const clientsWithCount = clients.map(client => {
      // Calculer le total dépensé basé sur les shipments (logique de paiement centralisée)
      const totalSpent = client.shipments.reduce((sum, shipment) => sum + (shipment.paidAmount || 0), 0);
      
      // Calculer le total des montants des shipments
      const totalShipmentsAmount = client.shipments.reduce((sum, shipment) => sum + (shipment.totalAmount || 0), 0);
      
      // Calculer le nombre total de colis via les shipments
      const totalPackagesCount = client.shipments.reduce((sum, shipment) => sum + (shipment.packagesCount || 0), 0);

      return {
        ...client,
        packagesCount: totalPackagesCount,
        totalSpent,
        totalShipmentsAmount,
        shipmentsCount: client._count.shipments,
        // Garder l'ancien calcul pour compatibilité
        legacyTotalSpent: client.packages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0),
        _count: undefined, // Retirer le champ _count
        packages: undefined, // Retirer les packages détaillés
        shipments: undefined, // Retirer les shipments détaillés
      };
    });

    const total = await prisma.client.count({ where });

    let stats = null;
    if (includeStats) {
      const allClients = await prisma.client.findMany({
        select: {
          isActive: true,
          isVip: true,
          createdAt: true,
          _count: {
            select: { 
              packages: true,
              shipments: true,
            }
          }
        }
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Calcul des statistiques financières
      const financialStats = await prisma.shipment.aggregate({
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
        _count: {
          id: true,
        },
      });

      stats = {
        total: allClients.length,
        active: allClients.filter(c => c.isActive).length,
        vip: allClients.filter(c => c.isVip).length,
        newThisMonth: allClients.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length,
        withOrders: allClients.filter(c => c._count.shipments > 0).length,
        // Statistiques financières
        totalRevenue: financialStats._sum.totalAmount || 0,
        totalPaid: financialStats._sum.paidAmount || 0,
        totalShipments: financialStats._count.id || 0,
      };
    }

    return NextResponse.json({
      data: clientsWithCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Erreur GET /api/clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validation
    const errors = validateClientData(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Données invalides", errors }, { status: 400 });
    }

    // Vérification de l'unicité du téléphone
    const existingClient = await prisma.client.findFirst({
      where: { phone: body.phone }
    });
    
    if (existingClient) {
      return NextResponse.json(
        { error: "Un client avec ce numéro de téléphone existe déjà" },
        { status: 400 }
      );
    }

    // Génération du code client
    const clientCode = await generateClientCode();

    // Création du client
    const client = await prisma.client.create({
      data: {
        clientCode,
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
        notes: body.notes?.trim() || null,
      },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_CLIENT",
        resource: "client",
        resourceId: client.id,
        details: JSON.stringify({ clientCode }),
      },
    });

    return NextResponse.json(
      { 
        message: "Client créé avec succès", 
        client: {
          ...client,
          packagesCount: 0
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur POST /api/clients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}
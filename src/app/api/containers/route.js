// app/api/containers/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const includeStats = searchParams.get("includeStats") === "true";

    // Construction des filtres
    const where = {};

    if (search) {
      where.OR = [
        { containerNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
        { origin: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    // Récupération des conteneurs avec comptage des colis
    const containers = await prisma.container.findMany({
      where,
      include: {
        _count: {
          select: { packages: true },
        },
      },
      orderBy: [{ departureDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Ajout du comptage des colis dans chaque conteneur
    const containersWithCount = containers.map((container) => ({
      ...container,
      packagesCount: container._count.packages,
      currentLoad: container._count.packages, // Synchroniser avec le vrai compte
      _count: undefined,
    }));

    const total = await prisma.container.count({ where });

    let stats = null;
    if (includeStats) {
      const allContainers = await prisma.container.findMany({
        select: {
          status: true,
          createdAt: true,
          _count: {
            select: { packages: true },
          },
        },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Calculer le total de packages
      const totalPackages = allContainers.reduce(
        (sum, c) => sum + (c._count.packages || 0), 
        0
      );

      stats = {
        total: allContainers.length,
        preparation: allContainers.filter((c) => c.status === "PREPARATION")
          .length,
        loaded: allContainers.filter((c) => c.status === "LOADED").length,
        inTransit: allContainers.filter((c) => c.status === "IN_TRANSIT")
          .length,
        delivered: allContainers.filter((c) => c.status === "DELIVERED").length,
        issues: allContainers.filter((c) => c.status === "CANCELLED").length,
        totalPackages,
        newThisMonth: allContainers.filter(
          (c) => new Date(c.createdAt) >= thirtyDaysAgo
        ).length,
        withPackages: allContainers.filter((c) => c._count.packages > 0).length,
      };
    }

    return NextResponse.json({
      containers: containersWithCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Erreur GET /api/containers:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    // Validation des champs requis
    if (!body.name) {
      return NextResponse.json(
        { error: "Le nom du conteneur est requis" },
        { status: 400 }
      );
    }

    // Génération du numéro de conteneur
    const year = new Date().getFullYear();
    const count = (await prisma.container.count()) + 1;
    const containerNumber = `CNT${year}${String(count).padStart(5, "0")}`;

    // Calcul du coût total
    const transportCost = body.transportCost || 0;
    const customsCost = body.customsCost || 0;
    const totalCost = transportCost + customsCost;

    // Préparation des données pour la création
    const containerData = {
      containerNumber,
      name: body.name,
      status: body.status || "PREPARATION",
      capacity: body.capacity || 100,
      currentLoad: 0,
      currentWeight: 0,
      origin: body.origin || "France",
      destination: body.destination || "Burkina Faso",
      totalCost: totalCost > 0 ? totalCost : null,
    };

    // Ajout des champs optionnels seulement s'ils sont fournis
    if (body.departureDate)
      containerData.departureDate = new Date(body.departureDate);
    if (body.arrivalDate)
      containerData.arrivalDate = new Date(body.arrivalDate);
    if (body.maxWeight) containerData.maxWeight = parseFloat(body.maxWeight);
    if (body.currentLocation)
      containerData.currentLocation = body.currentLocation;
    if (body.transportCompany)
      containerData.transportCompany = body.transportCompany;
    if (body.driverName) containerData.driverName = body.driverName;
    if (body.driverPhone) containerData.driverPhone = body.driverPhone;
    if (body.plateNumber) containerData.plateNumber = body.plateNumber;
    if (body.transportCost)
      containerData.transportCost = parseFloat(body.transportCost);
    if (body.customsCost)
      containerData.customsCost = parseFloat(body.customsCost);
    if (body.notes) containerData.notes = body.notes;

    const newContainer = await prisma.container.create({
      data: containerData,
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
          action: "CREATE_CONTAINER",
          resource: "container",
          resourceId: newContainer.id,
          details: JSON.stringify({ containerNumber }),
        },
      });
    } catch (auditError) {
      console.warn("Erreur audit log:", auditError);
    }

    return NextResponse.json(
      {
        message: "Conteneur créé avec succès",
        container: newContainer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/containers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du conteneur" },
      { status: 500 }
    );
  }
}

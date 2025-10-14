import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrackingService } from "@/lib/services/tracking";

// GET - Récupérer l'historique de suivi
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // Await params

    const trackingUpdates = await prisma.trackingUpdate.findMany({
      where: { containerId: id },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json({ trackingUpdates });
  } catch (error) {
    console.error("Erreur récupération suivi:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle mise à jour de suivi
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'STAFF', 'TRACKER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params; // Await params

    const body = await request.json();
    const { 
      location, 
      description, 
      latitude, 
      longitude, 
      temperature, 
      isPublic,
      photos,
      notifyClients 
    } = body;

    // Validation
    if (!location || !description) {
      return NextResponse.json(
        { error: "Localisation et description sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que le conteneur existe
    const container = await prisma.container.findUnique({
      where: { id },
    });

    if (!container) {
      return NextResponse.json(
        { error: "Conteneur non trouvé" },
        { status: 404 }
      );
    }

    // Créer la mise à jour de suivi
    const trackingUpdate = await prisma.trackingUpdate.create({
      data: {
        containerId: id,
        userId: session.user.id,
        location,
        description,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        isPublic: isPublic ?? true,
        photos: photos ? JSON.stringify(photos) : null,
        timestamp: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Mettre à jour la localisation actuelle du conteneur
    await prisma.container.update({
      where: { id },
      data: {
        currentLocation: location,
        updatedAt: new Date(),
      },
    });

    // Notifier les clients si demandé
    let notificationResult = null;
    if (notifyClients) {
      try {
        notificationResult = await TrackingService.notifyClientsOfContainerUpdate(id, trackingUpdate);
        console.log("📊 Résultat des notifications:", notificationResult);
      } catch (error) {
        console.error("Erreur lors de la notification des clients:", error);
        // Ne pas faire échouer la requête si la notification échoue
        notificationResult = {
          total: 0,
          success: 0,
          errors: 1,
          invalidPhones: 0,
          errorDetails: [{ error: error.message }]
        };
      }
    }

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_TRACKING_UPDATE",
        resource: "container",
        resourceId: id,
        details: JSON.stringify({ location, description, isPublic, notifyClients }),
        ipAddress: request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown",
      },
    });

    return NextResponse.json({
      message: "Mise à jour créée avec succès",
      trackingUpdate,
      notificationResult,
    });
  } catch (error) {
    console.error("Erreur création suivi:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }
}

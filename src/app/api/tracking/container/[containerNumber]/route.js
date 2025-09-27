// app/api/tracking/container/[containerNumber]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    // Await params pour Next.js 15+
    const { containerNumber } = await params

    if (!containerNumber) {
      return NextResponse.json(
        { error: 'Numéro de conteneur requis' },
        { status: 400 }
      )
    }

    // Récupérer le conteneur avec tous ses colis et mises à jour
    const container = await prisma.container.findUnique({
      where: { containerNumber: containerNumber.toUpperCase() },
      include: {
        packages: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                recipientName: true,
                recipientPhone: true,
                recipientCity: true,
                recipientAddress: true,
              }
            },
            shipment: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        trackingUpdates: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    if (!container) {
      return NextResponse.json(
        { 
          error: 'Conteneur non trouvé',
          containerNumber 
        },
        { status: 404 }
      )
    }

    // Calculer les statistiques du conteneur
    const stats = {
      totalPackages: container.packages.length,
      totalWeight: container.currentWeight,
      capacity: container.capacity,
      loadPercentage: Math.round((container.currentLoad / container.capacity) * 100),
      weightPercentage: container.maxWeight 
        ? Math.round((container.currentWeight / container.maxWeight) * 100) 
        : null,
    }

    // Grouper les colis par statut
    const packagesByStatus = container.packages.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1
      return acc
    }, {})

    // Formater les données pour l'affichage
    const response = {
      container: {
        id: container.id,
        containerNumber: container.containerNumber,
        name: container.name,
        status: container.status,
        currentLocation: container.currentLocation,
        
        // Dates
        departureDate: container.departureDate,
        actualDeparture: container.actualDeparture,
        arrivalDate: container.arrivalDate,
        actualArrival: container.actualArrival,
        
        // Transport
        origin: container.origin,
        destination: container.destination,
        transportCompany: container.transportCompany,
        driverName: container.driverName,
        driverPhone: container.driverPhone,
        plateNumber: container.plateNumber,
        
        // Capacité
        capacity: container.capacity,
        currentLoad: container.currentLoad,
        maxWeight: container.maxWeight,
        currentWeight: container.currentWeight,
        
        // Coûts
        transportCost: container.transportCost,
        customsCost: container.customsCost,
        totalCost: container.totalCost,
        
        notes: container.notes,
      },
      
      stats,
      packagesByStatus,
      
      // Colis dans le conteneur
      packages: container.packages.map(pkg => ({
        id: pkg.id,
        packageNumber: pkg.packageNumber,
        status: pkg.status,
        types: JSON.parse(pkg.types || '[]'),
        totalQuantity: pkg.totalQuantity,
        weight: pkg.weight,
        totalAmount: pkg.totalAmount,
        paymentStatus: pkg.paymentStatus,
        
        // Client
        sender: pkg.client ? {
          name: `${pkg.client.firstName} ${pkg.client.lastName}`,
          phone: pkg.client.phone,
        } : null,
        
        // Destinataire
        recipient: pkg.client ? {
          name: pkg.client.recipientName,
          phone: pkg.client.recipientPhone,
          city: pkg.client.recipientCity,
          address: pkg.client.recipientAddress,
        } : null,
        
        estimatedDelivery: pkg.estimatedDelivery,
        createdAt: pkg.createdAt,
      })),
      
      // Historique de tracking (timeline)
      timeline: container.trackingUpdates.map(update => ({
        id: update.id,
        location: update.location,
        description: update.description,
        latitude: update.latitude,
        longitude: update.longitude,
        photos: update.photos ? JSON.parse(update.photos) : [],
        temperature: update.temperature,
        timestamp: update.timestamp,
        isPublic: update.isPublic,
        updatedBy: update.user ? {
          name: `${update.user.firstName || ''} ${update.user.lastName || ''}`.trim(),
          role: update.user.role,
        } : null,
      })),
      
      // Dernière mise à jour
      lastUpdate: container.trackingUpdates[0] || null,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erreur tracking conteneur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
// app/api/tracking/package/[packageNumber]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const { packageNumber } = params

    if (!packageNumber) {
      return NextResponse.json(
        { error: 'Numéro de colis requis' },
        { status: 400 }
      )
    }

    // Récupérer le colis avec toutes les infos
    const package_ = await prisma.package.findUnique({
      where: { packageNumber: packageNumber.toUpperCase() },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            city: true,
            country: true,
            recipientName: true,
            recipientPhone: true,
            recipientEmail: true,
            recipientAddress: true,
            recipientCity: true,
            recipientRelation: true,
          }
        },
        container: {
          include: {
            trackingUpdates: {
              orderBy: { timestamp: 'desc' },
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    role: true,
                  }
                }
              }
            }
          }
        },
        shipment: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        files: true,
      }
    })

    if (!package_) {
      return NextResponse.json(
        { 
          error: 'Colis non trouvé',
          packageNumber 
        },
        { status: 404 }
      )
    }

    // Calculer le montant restant à payer
    const remainingAmount = package_.totalAmount - package_.paidAmount

    // Parser les types de colis
    const types = JSON.parse(package_.types || '[]')

    // Construire la timeline complète (statut colis + tracking conteneur)
    const timeline = []

    // Ajouter les événements du colis
    timeline.push({
      status: 'REGISTERED',
      title: 'Colis enregistré',
      description: `Colis enregistré dans le système`,
      location: package_.client?.city || 'France',
      timestamp: package_.createdAt,
      icon: 'Package',
      completed: true,
    })

    if (package_.pickupDate) {
      timeline.push({
        status: 'COLLECTED',
        title: 'Colis collecté',
        description: package_.pickupAddress ? `Ramassage à ${package_.pickupAddress}` : 'Colis ramassé',
        location: package_.pickupAddress || package_.client?.city || 'France',
        timestamp: package_.pickupDate,
        icon: 'Truck',
        completed: package_.status !== 'REGISTERED',
      })
    }

    // Ajouter les mises à jour du conteneur si disponible
    if (package_.container?.trackingUpdates) {
      package_.container.trackingUpdates.forEach(update => {
        timeline.push({
          status: 'TRANSIT',
          title: update.location,
          description: update.description,
          location: update.location,
          timestamp: update.timestamp,
          icon: 'MapPin',
          completed: true,
          latitude: update.latitude,
          longitude: update.longitude,
          photos: update.photos ? JSON.parse(update.photos) : [],
          updatedBy: update.user ? {
            name: `${update.user.firstName || ''} ${update.user.lastName || ''}`.trim(),
            role: update.user.role,
          } : null,
        })
      })
    }

    if (package_.deliveryDate) {
      timeline.push({
        status: 'DELIVERED',
        title: 'Colis livré',
        description: `Livré à ${package_.deliveryAddress}`,
        location: package_.deliveryAddress,
        timestamp: package_.deliveryDate,
        icon: 'Home',
        completed: package_.status === 'DELIVERED',
      })
    }

    // Trier la timeline par date
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    // Construire la réponse
    const response = {
      package: {
        id: package_.id,
        packageNumber: package_.packageNumber,
        status: package_.status,
        priority: package_.priority,
        isFragile: package_.isFragile,
        isInsured: package_.isInsured,
        
        // Détails
        types,
        description: package_.description,
        totalQuantity: package_.totalQuantity,
        weight: package_.weight,
        dimensions: package_.dimensions,
        value: package_.value,
        photos: package_.photos ? JSON.parse(package_.photos) : [],
        
        // Tarification
        basePrice: package_.basePrice,
        pickupFee: package_.pickupFee,
        insuranceFee: package_.insuranceFee,
        customsFee: package_.customsFee,
        otherFees: package_.otherFees,
        discount: package_.discount,
        totalAmount: package_.totalAmount,
        
        // Paiement
        paymentStatus: package_.paymentStatus,
        paymentMethod: package_.paymentMethod,
        paidAmount: package_.paidAmount,
        remainingAmount,
        paidAt: package_.paidAt,
        
        // Dates
        estimatedDelivery: package_.estimatedDelivery,
        pickupDate: package_.pickupDate,
        pickupTime: package_.pickupTime,
        deliveryDate: package_.deliveryDate,
        deliveryTime: package_.deliveryTime,
        createdAt: package_.createdAt,
        updatedAt: package_.updatedAt,
        
        // Instructions
        specialInstructions: package_.specialInstructions,
        notes: package_.notes,
      },
      
      // Expéditeur
      sender: package_.client ? {
        name: `${package_.client.firstName} ${package_.client.lastName}`,
        phone: package_.client.phone,
        email: package_.client.email,
        city: package_.client.city,
        country: package_.client.country,
      } : null,
      
      // Destinataire
      recipient: package_.client ? {
        name: package_.client.recipientName,
        phone: package_.client.recipientPhone,
        email: package_.client.recipientEmail,
        address: package_.client.recipientAddress,
        city: package_.client.recipientCity,
        relation: package_.client.recipientRelation,
      } : null,
      
      // Conteneur
      container: package_.container ? {
        containerNumber: package_.container.containerNumber,
        name: package_.container.name,
        status: package_.container.status,
        currentLocation: package_.container.currentLocation,
        departureDate: package_.container.departureDate,
        arrivalDate: package_.container.arrivalDate,
        transportCompany: package_.container.transportCompany,
      } : null,
      
      // Envoi groupé (shipment)
      shipment: package_.shipment ? {
        shipmentNumber: package_.shipment.shipmentNumber,
        packagesCount: package_.shipment.packagesCount,
        totalAmount: package_.shipment.totalAmount,
      } : null,
      
      // Timeline complète
      timeline,
      
      // Dernière mise à jour
      lastUpdate: timeline[timeline.length - 1] || null,
      
      // Paiements
      payments: package_.payments.map(payment => ({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        reference: payment.reference,
        paidAt: payment.paidAt,
      })),
      
      // Documents/Photos
      files: package_.files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        createdAt: file.createdAt,
      })),
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erreur tracking colis:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
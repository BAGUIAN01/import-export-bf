// app/api/tracking/[trackingNumber]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    // Await params pour Next.js 15+
    const { trackingNumber } = await params

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Numéro de suivi requis' },
        { status: 400 }
      )
    }

    const normalizedNumber = trackingNumber.toUpperCase()

    // 1. Si c'est un numéro de Shipment (SHP...)
    if (normalizedNumber.startsWith('SHP')) {
      const shipment = await prisma.shipment.findUnique({
        where: { shipmentNumber: normalizedNumber },
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
            }
          },
          packages: {
            include: {
              container: true,
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
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!shipment) {
        return NextResponse.json(
          { error: 'Envoi groupé non trouvé', shipmentNumber: normalizedNumber },
          { status: 404 }
        )
      }

      // Formater les colis
      const packagesList = shipment.packages.map(pkg => {
        const types = JSON.parse(pkg.types || '[]')
        return {
          packageNumber: pkg.packageNumber,
          status: pkg.status,
          types,
          description: pkg.description,
          totalQuantity: pkg.totalQuantity,
          weight: pkg.weight,
          totalAmount: pkg.totalAmount,
        }
      })

      return NextResponse.json({
        type: 'shipment',
        
        // Infos de l'envoi groupé
        shipment: {
          shipmentNumber: shipment.shipmentNumber,
          packagesCount: shipment.packagesCount,
          totalQuantity: shipment.totalQuantity,
          totalAmount: shipment.totalAmount,
          paymentStatus: shipment.paymentStatus,
          paymentMethod: shipment.paymentMethod,
          paidAmount: shipment.paidAmount,
          pickupAddress: shipment.pickupAddress,
          pickupDate: shipment.pickupDate,
          deliveryAddress: shipment.deliveryAddress,
          notes: shipment.notes,
        },

        // Liste des colis
        packages: packagesList,

        // Expéditeur
        sender: {
          name: `${shipment.client.firstName} ${shipment.client.lastName}`,
          phone: shipment.client.phone,
          email: shipment.client.email,
          city: shipment.client.city,
          country: shipment.client.country,
        },

        // Destinataire
        recipient: {
          name: shipment.client.recipientName,
          phone: shipment.client.recipientPhone,
          email: shipment.client.recipientEmail,
          address: shipment.client.recipientAddress,
          city: shipment.client.recipientCity,
        },

        // Conteneur (tracking)
        container: shipment.container ? {
          containerNumber: shipment.container.containerNumber,
          name: shipment.container.name,
          status: shipment.container.status,
          currentLocation: shipment.container.currentLocation,
          departureDate: shipment.container.departureDate,
          arrivalDate: shipment.container.arrivalDate,
          actualDeparture: shipment.container.actualDeparture,
          actualArrival: shipment.container.actualArrival,
          origin: shipment.container.origin,
          destination: shipment.container.destination,
          transportCompany: shipment.container.transportCompany,
        } : null,

        // Timeline du conteneur
        timeline: shipment.container?.trackingUpdates.map(update => ({
          id: update.id,
          location: update.location,
          description: update.description,
          latitude: update.latitude,
          longitude: update.longitude,
          photos: update.photos ? JSON.parse(update.photos) : [],
          timestamp: update.timestamp,
          updatedBy: update.user ? 
            `${update.user.firstName || ''} ${update.user.lastName || ''}`.trim() : 
            null,
        })) || [],

        lastUpdate: shipment.container?.trackingUpdates[0] || null,
      })
    }

    // 2. Si c'est un numéro de colis (PKG...)
    const package_ = await prisma.package.findUnique({
      where: { packageNumber: normalizedNumber },
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
          }
        },
        shipment: {
          select: {
            shipmentNumber: true,
            packagesCount: true,
            totalAmount: true,
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
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!package_) {
      return NextResponse.json(
        { error: 'Colis non trouvé', packageNumber: normalizedNumber },
        { status: 404 }
      )
    }

    // Parser les types de colis
    const packageTypes = JSON.parse(package_.types || '[]')

    return NextResponse.json({
      type: 'package',
      
      package: {
        packageNumber: package_.packageNumber,
        status: package_.status,
        types: packageTypes,
        description: package_.description,
        totalQuantity: package_.totalQuantity,
        weight: package_.weight,
        totalAmount: package_.totalAmount,
        paymentStatus: package_.paymentStatus,
        estimatedDelivery: package_.estimatedDelivery,
      },

      sender: {
        name: `${package_.client.firstName} ${package_.client.lastName}`,
        phone: package_.client.phone,
        email: package_.client.email,
        city: package_.client.city,
        country: package_.client.country,
      },

      recipient: {
        name: package_.client.recipientName,
        phone: package_.client.recipientPhone,
        email: package_.client.recipientEmail,
        address: package_.client.recipientAddress,
        city: package_.client.recipientCity,
      },

      // Envoi groupé (si le colis fait partie d'un shipment)
      shipment: package_.shipment,

      container: package_.container ? {
        containerNumber: package_.container.containerNumber,
        name: package_.container.name,
        status: package_.container.status,
        currentLocation: package_.container.currentLocation,
        departureDate: package_.container.departureDate,
        arrivalDate: package_.container.arrivalDate,
        actualDeparture: package_.container.actualDeparture,
        actualArrival: package_.container.actualArrival,
        origin: package_.container.origin,
        destination: package_.container.destination,
        transportCompany: package_.container.transportCompany,
      } : null,

      timeline: package_.container?.trackingUpdates.map(update => ({
        id: update.id,
        location: update.location,
        description: update.description,
        latitude: update.latitude,
        longitude: update.longitude,
        photos: update.photos ? JSON.parse(update.photos) : [],
        timestamp: update.timestamp,
        updatedBy: update.user ? 
          `${update.user.firstName || ''} ${update.user.lastName || ''}`.trim() : 
          null,
      })) || [],

      lastUpdate: package_.container?.trackingUpdates[0] || null,
    })

  } catch (error) {
    console.error('Erreur tracking:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
// app/api/tracking/search/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('number')

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Numéro de suivi requis' },
        { status: 400 }
      )
    }

    const normalizedNumber = trackingNumber.toUpperCase().trim()

    // Déterminer le type de numéro (conteneur ou colis)
    let result = null
    let type = null

    // 1. Rechercher dans les conteneurs (ex: CNT202501001)
    if (normalizedNumber.startsWith('CNT')) {
      const container = await prisma.container.findUnique({
        where: { containerNumber: normalizedNumber },
        include: {
          packages: {
            select: {
              id: true,
              packageNumber: true,
              status: true,
              totalQuantity: true,
            }
          },
          trackingUpdates: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          }
        }
      })

      if (container) {
        type = 'container'
        result = {
          type: 'container',
          number: container.containerNumber,
          status: container.status,
          currentLocation: container.currentLocation,
          packagesCount: container.packages.length,
          departureDate: container.departureDate,
          arrivalDate: container.arrivalDate,
          lastUpdate: container.trackingUpdates[0] || null,
        }
      }
    } 
    // 2. Rechercher dans les colis (ex: PKG202501001)
    else if (normalizedNumber.startsWith('PKG')) {
      const package_ = await prisma.package.findUnique({
        where: { packageNumber: normalizedNumber },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              recipientName: true,
              recipientCity: true,
            }
          },
          container: {
            select: {
              containerNumber: true,
              status: true,
              currentLocation: true,
            }
          }
        }
      })

      if (package_) {
        type = 'package'
        result = {
          type: 'package',
          number: package_.packageNumber,
          status: package_.status,
          sender: package_.client ? 
            `${package_.client.firstName} ${package_.client.lastName}` : null,
          recipient: package_.client?.recipientName || null,
          destination: package_.client?.recipientCity || null,
          container: package_.container ? {
            number: package_.container.containerNumber,
            status: package_.container.status,
            location: package_.container.currentLocation,
          } : null,
          estimatedDelivery: package_.estimatedDelivery,
        }
      }
    }
    // 3. Rechercher dans les envois groupés (ex: SHP2025xxxxx)
    else if (normalizedNumber.startsWith('SHP')) {
      const shipment = await prisma.shipment.findUnique({
        where: { shipmentNumber: normalizedNumber },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          packages: {
            select: {
              packageNumber: true,
              status: true,
            }
          },
          container: {
            select: {
              containerNumber: true,
              status: true,
              currentLocation: true,
            }
          }
        }
      })

      if (shipment) {
        type = 'shipment'
        result = {
          type: 'shipment',
          number: shipment.shipmentNumber,
          sender: shipment.client ? 
            `${shipment.client.firstName} ${shipment.client.lastName}` : null,
          packagesCount: shipment.packages.length,
          packages: shipment.packages,
          paymentStatus: shipment.paymentStatus,
          totalAmount: shipment.totalAmount,
          container: shipment.container ? {
            number: shipment.container.containerNumber,
            status: shipment.container.status,
            location: shipment.container.currentLocation,
          } : null,
        }
      }
    }

    // Si rien n'est trouvé
    if (!result) {
      return NextResponse.json(
        { 
          error: 'Numéro de suivi non trouvé',
          searchedNumber: normalizedNumber,
          suggestions: [
            'Vérifiez que le numéro est correct',
            'Les numéros de conteneur commencent par CNT',
            'Les numéros de colis commencent par PKG',
            'Les numéros d\'envoi groupé commencent par SHP',
          ]
        },
        { status: 404 }
      )
    }

    // Retourner le résultat avec le lien vers l'endpoint détaillé
    return NextResponse.json({
      found: true,
      result,
      detailsUrl: type === 'container' 
        ? `/api/tracking/container/${normalizedNumber}`
        : type === 'package'
        ? `/api/tracking/package/${normalizedNumber}`
        : `/api/tracking/shipment/${normalizedNumber}`,
    })

  } catch (error) {
    console.error('Erreur recherche tracking:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
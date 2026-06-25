
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/twilio'
import { smartNormalizePhone } from '@/lib/utils/phone-normalizer'

export class TrackingService {
  static generateContainerNumber() {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)
    return `CNT${year}${month}${timestamp}`
  }

  static async createContainer(data) {
    const containerNumber = this.generateContainerNumber()
    
    return await prisma.container.create({
      data: {
        containerNumber,
        ...data
      }
    })
  }

  static async addTrackingUpdate(containerId, userId, location, description, coordinates = null) {
    const update = await prisma.trackingUpdate.create({
      data: {
        containerId,
        userId,
        location,
        description,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude
      },
      include: {
        user: true,
        container: true
      }
    })

    // Envoyer des notifications aux clients concernés
    await this.notifyClientsOfUpdate(containerId, update)

    return update
  }

  static async getContainerTracking(containerNumber) {
    const container = await prisma.container.findUnique({
      where: { containerNumber },
      include: {
        packages: {
          include: {
            client: true
          }
        },
        trackingUpdates: {
          include: {
            user: {
              select: { name: true, phone: true }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    if (!container) {
      throw new Error("Conteneur non trouvé")
    }

    return container
  }

  static async trackPackage(packageNumber) {
    const package_ = await prisma.package.findUnique({
      where: { packageNumber },
      include: {
        client: true,
        container: {
          include: {
            trackingUpdates: {
              orderBy: { timestamp: 'desc' },
              take: 10
            }
          }
        }
      }
    })

    if (!package_) {
      throw new Error("Colis non trouvé")
    }

    return {
      package: package_,
      timeline: this.generatePackageTimeline(package_)
    }
  }

  static generatePackageTimeline(package_) {
    const timeline = []

    // Étape 1: Enregistrement
    timeline.push({
      status: "REGISTERED",
      title: "Colis enregistré",
      description: `Enregistré le ${package_.createdAt.toLocaleDateString()}`,
      date: package_.createdAt,
      completed: true
    })

    // Étape 2: Collecte
    if (package_.status !== "REGISTERED") {
      timeline.push({
        status: "COLLECTED",
        title: "Colis collecté",
        description: package_.pickupDate ? 
          `Collecté le ${package_.pickupDate.toLocaleDateString()}` : 
          "En attente de collecte",
        date: package_.pickupDate,
        completed: !!package_.pickupDate
      })
    }

    // Étape 3: En conteneur
    if (package_.containerId) {
      timeline.push({
        status: "IN_CONTAINER",
        title: "Chargé en conteneur",
        description: `Conteneur: ${package_.container?.containerNumber}`,
        date: null,
        completed: true
      })
    }

    // Étape 4: En transit
    if (package_.container?.trackingUpdates?.length > 0) {
      timeline.push({
        status: "IN_TRANSIT",
        title: "En transit",
        description: package_.container.trackingUpdates[0].description,
        date: package_.container.trackingUpdates[0].timestamp,
        completed: true
      })
    }

    // Étape 5: Livraison
    timeline.push({
      status: "DELIVERED",
      title: "Livré",
      description: package_.deliveryDate ? 
        `Livré le ${package_.deliveryDate.toLocaleDateString()}` : 
        "En attente de livraison",
      date: package_.deliveryDate,
      completed: package_.status === "DELIVERED"
    })

    return timeline
  }

  static async updateContainerStatus(containerNumber, status, userId, updateData = {}) {
    const container = await prisma.container.update({
      where: { containerNumber },
      data: {
        status,
        ...updateData,
        updatedAt: new Date()
      }
    })

    // Ajouter une mise à jour automatique
    let description = ""
    let location = ""
    
    switch (status) {
      case "LOADED":
        description = "Conteneur chargé et prêt au départ"
        location = "Entrepôt France"
        break
      case "IN_TRANSIT":
        description = "Conteneur en transit"
        location = "En route"
        break
      case "CUSTOMS":
        description = "Conteneur en douane"
        location = "Douanes Burkina Faso"
        break
      case "DELIVERED":
        description = "Conteneur arrivé à destination"
        location = "Burkina Faso"
        break
    }

    if (description) {
      await this.addTrackingUpdate(
        container.id,
        userId,
        location,
        description
      )
    }

    return container
  }

  static async notifyClientsOfUpdate(containerId, update) {
    const packages = await prisma.package.findMany({
      where: { containerId },
      include: { client: true }
    })

    for (const pkg of packages) {
      const message = `🚚 Mise à jour de votre colis ${pkg.packageNumber}:\n\n📍 ${update.location}\n📝 ${update.description}\n\nSuivez votre colis: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${pkg.packageNumber}`

      await prisma.whatsAppMessage.create({
        data: {
          to: pkg.client.phone,
          message,
          messageType: "text",
          packageId: pkg.id,
          clientId: pkg.clientId
        }
      })
    }
  }

  static async notifyClientsOfContainerUpdate(containerId, update) {
    // Récupérer tous les shipments dans ce conteneur avec leurs clients
    const shipments = await prisma.shipment.findMany({
      where: { containerId },
      include: { 
        client: true,
        packages: {
          select: {
            id: true,
            packageNumber: true
          }
        }
      }
    })

    // Statistiques de notification
    let successCount = 0
    let errorCount = 0
    let invalidPhoneCount = 0
    const errors = []

    console.log(`📱 Début de notification pour ${shipments.length} clients`)

    for (const shipment of shipments) {
      // Déterminer le contexte de normalisation basé sur le pays du client
      const clientCountry = shipment.client.country || 'France'
      let context = 'france' // Par défaut
      
      if (clientCountry.toLowerCase().includes('burkina')) {
        context = 'burkina'
      } else if (clientCountry.toLowerCase().includes('côte') || clientCountry.toLowerCase().includes('ivoire')) {
        context = 'cote_ivoire'
      } else if (clientCountry.toLowerCase().includes('sénégal') || clientCountry.toLowerCase().includes('senegal')) {
        context = 'senegal'
      } else if (clientCountry.toLowerCase().includes('mali')) {
        context = 'mali'
      } else if (clientCountry.toLowerCase().includes('niger') && !clientCountry.toLowerCase().includes('nigeria')) {
        context = 'niger'
      } else if (clientCountry.toLowerCase().includes('togo')) {
        context = 'togo'
      } else if (clientCountry.toLowerCase().includes('bénin') || clientCountry.toLowerCase().includes('benin')) {
        context = 'benin'
      } else if (clientCountry.toLowerCase().includes('ghana')) {
        context = 'ghana'
      } else if (clientCountry.toLowerCase().includes('nigeria')) {
        context = 'nigeria'
      }
      
      // Normaliser le numéro de téléphone selon le pays du client
      const normalizedPhone = smartNormalizePhone(shipment.client.phone, context)
      
      if (!normalizedPhone) {
        console.error(`❌ Numéro de téléphone invalide pour le client ${shipment.clientId} (${clientCountry}): ${shipment.client.phone}`)
        invalidPhoneCount++
        errors.push({
          clientId: shipment.clientId,
          shipmentNumber: shipment.shipmentNumber,
          phone: shipment.client.phone,
          country: clientCountry,
          context,
          error: 'Numéro de téléphone invalide'
        })
        continue
      }
      
      // Créer le message avec la position et le lien de tracking
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://naange-envoi.fr'
      const trackingUrl = `${baseUrl}/tracking?q=${shipment.shipmentNumber}`
      
      // Message SMS optimisé (160 caractères max recommandé)
      const message = `Naange Envoi: Expédition ${shipment.shipmentNumber} - Position: ${update.location}. ${update.description}. Suivez: ${trackingUrl}`

      try {
        // Envoyer le SMS via Twilio avec le numéro normalisé
        const smsResult = await sendSMS(normalizedPhone, message)
        
        // Enregistrer le message SMS dans la base de données
        await prisma.whatsAppMessage.create({
          data: {
            to: shipment.client.phone,
            message,
            messageType: "sms",
            status: smsResult.status || "sent",
            messageId: smsResult.sid,
            clientId: shipment.clientId,
            packageId: null // Pas de package spécifique, c'est une notification de shipment
          }
        })

        // Créer aussi une notification dans le système
        await prisma.notification.create({
          data: {
            userId: shipment.client.userId || shipment.clientId, // Utiliser userId si disponible, sinon clientId
            type: "SMS",
            title: "Mise à jour de votre expédition",
            message: `Votre expédition ${shipment.shipmentNumber} est maintenant à ${update.location}`,
            data: JSON.stringify({
              shipmentId: shipment.id,
              shipmentNumber: shipment.shipmentNumber,
              location: update.location,
              description: update.description,
              trackingUrl,
              smsSid: smsResult.sid
            })
          }
        })

        console.log(`✅ SMS envoyé à ${normalizedPhone} (${shipment.client.phone}, ${clientCountry}) pour l'expédition ${shipment.shipmentNumber}`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Erreur envoi SMS à ${normalizedPhone} (${shipment.client.phone}, ${clientCountry}):`, error.message)
        errorCount++
        errors.push({
          clientId: shipment.clientId,
          shipmentNumber: shipment.shipmentNumber,
          phone: shipment.client.phone,
          country: clientCountry,
          context,
          normalizedPhone,
          error: error.message
        })
        
        // Enregistrer l'erreur dans la base de données
        try {
          await prisma.whatsAppMessage.create({
            data: {
              to: shipment.client.phone,
              message,
              messageType: "sms",
              status: "failed",
              error: error.message,
              clientId: shipment.clientId,
              packageId: null
            }
          })
        } catch (dbError) {
          console.error(`❌ Erreur enregistrement DB pour ${shipment.clientId}:`, dbError.message)
        }
      }
    }

    // Résumé des notifications
    console.log(`\n📊 Résumé des notifications:`)
    console.log(`   ✅ Succès: ${successCount}`)
    console.log(`   ❌ Erreurs d'envoi: ${errorCount}`)
    console.log(`   📵 Numéros invalides: ${invalidPhoneCount}`)
    console.log(`   📱 Total traité: ${shipments.length}`)
    
    if (errors.length > 0) {
      console.log(`\n❌ Détails des erreurs:`)
      errors.forEach((err, index) => {
        console.log(`   ${index + 1}. Client ${err.clientId} (${err.shipmentNumber}, ${err.country || 'N/A'}): ${err.error}`)
      })
    }

    return {
      total: shipments.length,
      success: successCount,
      errors: errorCount,
      invalidPhones: invalidPhoneCount,
      errorDetails: errors
    }
  }

  static async getContainers(page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where,
        skip,
        take: limit,
        include: {
          packages: {
            select: { id: true, status: true }
          },
          _count: {
            select: { packages: true, trackingUpdates: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.container.count({ where })
    ])

    return {
      containers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
}

class TrackingService {
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
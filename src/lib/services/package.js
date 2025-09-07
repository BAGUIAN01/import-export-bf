const { prisma } = require("@/lib/prisma")

class PackageService {
  static async generatePackageNumber() {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    
    // Compter les colis du mois
    const count = await prisma.package.count({
      where: {
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1)
        }
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `PKG${year}${month}${sequence}`
  }

  static async createPackage(data) {
    const packageNumber = await this.generatePackageNumber()
    
    // Calculer le prix
    const pricing = await prisma.pricing.findUnique({
      where: { type: data.type, isActive: true }
    })

    if (!pricing) {
      throw new Error(`Tarif non trouvé pour le type: ${data.type}`)
    }

    let basePrice = pricing.basePrice
    const pickupFee = data.pickupAddress ? pricing.pickupFee : 0
    const insuranceFee = data.isInsured ? (data.value ? data.value * 0.02 : 0) : 0
    
    // Prix par kg supplémentaire si applicable
    let weightSurcharge = 0
    if (data.weight && pricing.minWeight && data.weight > pricing.minWeight) {
      const extraWeight = data.weight - pricing.minWeight
      weightSurcharge = extraWeight * (pricing.perKgPrice || 0)
    }

    const totalAmount = basePrice + pickupFee + insuranceFee + weightSurcharge

    return await prisma.$transaction(async (tx) => {
      const package_ = await tx.package.create({
        data: {
          packageNumber,
          basePrice,
          pickupFee,
          insuranceFee,
          otherFees: weightSurcharge,
          totalAmount,
          ...data
        },
        include: {
          client: true,
          container: true
        }
      })

      // Log d'audit
      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: "CREATE_PACKAGE",
          resource: "package",
          resourceId: package_.id,
          details: JSON.stringify({ 
            packageNumber, 
            clientId: data.clientId, 
            amount: totalAmount 
          })
        }
      })

      // Notification au client
      if (package_.client.userId) {
        await tx.notification.create({
          data: {
            userId: package_.client.userId,
            type: "SMS",
            title: "Colis enregistré",
            message: `Votre colis ${packageNumber} a été enregistré avec succès. Montant: ${totalAmount}€`,
            data: JSON.stringify({ packageId: package_.id, packageNumber })
          }
        })
      }

      return package_
    })
  }

  static async assignToContainer(packageId, containerNumber, userId) {
    return await prisma.$transaction(async (tx) => {
      const container = await tx.container.findUnique({
        where: { containerNumber },
        include: { packages: true }
      })

      if (!container) {
        throw new Error("Conteneur non trouvé")
      }

      if (container.currentLoad >= container.capacity) {
        throw new Error("Conteneur plein")
      }

      const package_ = await tx.package.findUnique({
        where: { id: packageId },
        include: { client: true }
      })

      if (!package_) {
        throw new Error("Colis non trouvé")
      }

      // Mettre à jour le colis
      const updatedPackage = await tx.package.update({
        where: { id: packageId },
        data: {
          containerId: container.id,
          status: "IN_CONTAINER"
        }
      })

      // Mettre à jour le conteneur
      const packageWeight = package_.weight || 1
      await tx.container.update({
        where: { id: container.id },
        data: {
          currentLoad: container.currentLoad + 1,
          currentWeight: container.currentWeight + packageWeight
        }
      })

      // Log d'audit
      await tx.auditLog.create({
        data: {
          userId,
          action: "ASSIGN_TO_CONTAINER",
          resource: "package",
          resourceId: packageId,
          details: JSON.stringify({ 
            packageNumber: package_.packageNumber, 
            containerNumber: container.containerNumber 
          })
        }
      })

      // Notification WhatsApp au client
      if (package_.client.phone) {
        await tx.whatsAppMessage.create({
          data: {
            to: package_.client.phone,
            message: `🚚 Votre colis ${package_.packageNumber} a été chargé dans le conteneur ${container.containerNumber}. Il partira bientôt vers le Burkina Faso!`,
            packageId: package_.id,
            clientId: package_.clientId
          }
        })
      }

      return updatedPackage
    })
  }

  static async updateStatus(packageId, status, userId, additionalData = {}) {
    return await prisma.$transaction(async (tx) => {
      const package_ = await tx.package.update({
        where: { id: packageId },
        data: {
          status,
          ...additionalData,
          updatedAt: new Date()
        },
        include: {
          client: true,
          container: true
        }
      })

      // Log d'audit
      await tx.auditLog.create({
        data: {
          userId,
          action: "UPDATE_PACKAGE_STATUS",
          resource: "package",
          resourceId: packageId,
          details: JSON.stringify({ 
            from: additionalData.previousStatus,
            to: status,
            packageNumber: package_.packageNumber
          })
        }
      })

      // Notifications selon le statut
      let message = ""
      switch (status) {
        case "COLLECTED":
          message = `📦 Votre colis ${package_.packageNumber} a été collecté et est maintenant dans nos entrepôts.`
          break
        case "IN_TRANSIT":
          message = `🚛 Votre colis ${package_.packageNumber} est en transit vers le Burkina Faso.`
          break
        case "CUSTOMS":
          message = `🏛️ Votre colis ${package_.packageNumber} est en cours de dédouanement.`
          break
        case "DELIVERED":
          message = `✅ Votre colis ${package_.packageNumber} a été livré avec succès!`
          break
      }

      if (message && package_.client.phone) {
        await tx.whatsAppMessage.create({
          data: {
            to: package_.client.phone,
            message,
            packageId: package_.id,
            clientId: package_.clientId
          }
        })
      }

      return package_
    })
  }

  static async getPackages(filters = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      clientId, 
      containerId, 
      search,
      userId,
      dateFrom,
      dateTo
    } = filters
    
    const skip = (page - 1) * limit
    const where = {}
    
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (containerId) where.containerId = containerId
    if (userId) where.userId = userId
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }
    
    if (search) {
      where.OR = [
        { packageNumber: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        }}
      ]
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          container: {
            select: { containerNumber: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.package.count({ where })
    ])

    return {
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getPackageById(id) {
    return await prisma.package.findUnique({
      where: { id },
      include: {
        client: true,
        container: {
          include: {
            trackingUpdates: {
              orderBy: { timestamp: 'desc' },
              take: 10
            }
          }
        },
        files: true,
        payments: true
      }
    })
  }

  static async getPackageStats() {
    const [total, registered, collected, inTransit, delivered] = await Promise.all([
      prisma.package.count(),
      prisma.package.count({ where: { status: "REGISTERED" } }),
      prisma.package.count({ where: { status: "COLLECTED" } }),
      prisma.package.count({ where: { status: "IN_TRANSIT" } }),
      prisma.package.count({ where: { status: "DELIVERED" } })
    ])

    return {
      total,
      registered,
      collected,
      inTransit,
      delivered,
      pending: total - delivered
    }
  }
}
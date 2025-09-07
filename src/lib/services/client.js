class ClientService {
  static async generateClientCode() {
    const count = await prisma.client.count()
    const sequence = String(count + 1).padStart(4, '0')
    return `CLI${sequence}`
  }

  static async createClient(data) {
    // Vérifier si le client existe déjà
    const existingClient = await prisma.client.findFirst({
      where: { phone: data.phone }
    })

    if (existingClient) {
      throw new Error("Client déjà enregistré avec ce numéro")
    }

    const clientCode = await this.generateClientCode()

    return await prisma.client.create({
      data: {
        clientCode,
        ...data
      },
      include: {
        user: true,
        packages: true
      }
    })
  }

  static async getClient(id) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        user: true,
        packages: {
          include: {
            container: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) {
      throw new Error("Client non trouvé")
    }

    return client
  }

  static async updateClient(id, data) {
    return await prisma.client.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        user: true,
        packages: true
      }
    })
  }

  static async deleteClient(id) {
    // Vérifier s'il y a des colis en cours
    const packagesInTransit = await prisma.package.count({
      where: {
        clientId: id,
        status: {
          not: "DELIVERED"
        }
      }
    })

    if (packagesInTransit > 0) {
      throw new Error("Impossible de supprimer - colis en cours de traitement")
    }

    return await prisma.client.update({
      where: { id },
      data: { isActive: false }
    })
  }

  static async searchClients(query = "", page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
        { clientCode: { contains: query } }
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          packages: {
            select: { id: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ])

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getClientStats(clientId) {
    const [totalPackages, deliveredPackages, totalSpent, pendingPayment] = await Promise.all([
      prisma.package.count({
        where: { clientId }
      }),
      prisma.package.count({
        where: { clientId, status: "DELIVERED" }
      }),
      prisma.package.aggregate({
        where: { clientId, paymentStatus: "PAID" },
        _sum: { totalAmount: true }
      }),
      prisma.package.aggregate({
        where: { clientId, paymentStatus: "PENDING" },
        _sum: { totalAmount: true }
      })
    ])

    return {
      totalPackages,
      deliveredPackages,
      pendingPackages: totalPackages - deliveredPackages,
      totalSpent: totalSpent._sum.totalAmount || 0,
      pendingPayment: pendingPayment._sum.totalAmount || 0
    }
  }
}


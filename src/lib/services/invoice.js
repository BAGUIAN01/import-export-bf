class InvoiceService {
  static async generateInvoiceNumber() {
    const year = new Date().getFullYear()
    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `INV-${year}-${sequence}`
  }

  static async createInvoiceForPackages(clientId, packageIds, userId, dueDate = null) {
    return await prisma.$transaction(async (tx) => {
      const packages = await tx.package.findMany({
        where: { 
          id: { in: packageIds },
          clientId,
          paymentStatus: "PENDING"
        }
      })

      if (packages.length === 0) {
        throw new Error("Aucun colis éligible trouvé")
      }

      const invoiceNumber = await this.generateInvoiceNumber()
      const subtotal = packages.reduce((sum, pkg) => sum + pkg.totalAmount, 0)
      const taxRate = 0.20 // 20% TVA
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId,
          userId,
          dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          items: {
            create: packages.map(pkg => ({
              packageId: pkg.id,
              description: `Colis ${pkg.packageNumber} - ${pkg.description}`,
              quantity: pkg.quantity,
              unitPrice: pkg.totalAmount,
              totalPrice: pkg.totalAmount
            }))
          }
        },
        include: {
          client: true,
          items: {
            include: { package: true }
          }
        }
      })

      return invoice
    })
  }

  static async getInvoices(filters = {}) {
    const { page = 1, limit = 20, status, clientId, dateFrom, dateTo } = filters
    const skip = (page - 1) * limit
    
    const where = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          items: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async generateInvoiceHTML(invoice) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Facture ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .client-info, .company-info { width: 45%; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; }
        .total { text-align: right; margin-top: 20px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FACTURE</h1>
        <h2>${invoice.invoiceNumber}</h2>
      </div>
      
      <div class="invoice-info">
        <div class="company-info">
          <h3>Expéditeur</h3>
          <p>Votre Entreprise<br>
          Adresse<br>
          Téléphone<br>
          Email</p>
        </div>
        <div class="client-info">
          <h3>Client</h3>
          <p>${invoice.client.firstName} ${invoice.client.lastName}<br>
          ${invoice.client.address}<br>
          ${invoice.client.city}<br>
          ${invoice.client.phone}<br>
          ${invoice.client.email || ''}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice.toFixed(2)}€</td>
              <td>${item.totalPrice.toFixed(2)}€</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total">
        <p>Sous-total: ${invoice.subtotal.toFixed(2)}€</p>
        <p>TVA (${(invoice.taxRate * 100).toFixed(0)}%): ${invoice.taxAmount.toFixed(2)}€</p>
        <h3>Total: ${invoice.totalAmount.toFixed(2)}€</h3>
      </div>

      <div class="footer">
        <p>Date d'émission: ${invoice.issueDate.toLocaleDateString()}</p>
        <p>Date d'échéance: ${invoice.dueDate.toLocaleDateString()}</p>
        <p>Merci de votre confiance!</p>
      </div>
    </body>
    </html>
    `
  }

  static async markAsPaid(invoiceId, paymentData) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAmount: paymentData.amount
        },
        include: {
          items: { include: { package: true } }
        }
      })

      // Créer le paiement
      await tx.payment.create({
        data: {
          paymentNumber: `PAY-${Date.now()}`,
          clientId: invoice.clientId,
          invoiceId: invoice.id,
          amount: paymentData.amount,
          method: paymentData.method,
          reference: paymentData.reference
        }
      })

      // Mettre à jour le statut des colis
      const packageIds = invoice.items.map(item => item.packageId).filter(Boolean)
      await tx.package.updateMany({
        where: { id: { in: packageIds } },
        data: { 
          paymentStatus: "PAID",
          paidAmount: paymentData.amount / packageIds.length,
          paidAt: new Date()
        }
      })

      return invoice
    })
  }
}

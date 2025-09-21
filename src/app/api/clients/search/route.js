export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      query, 
      filters = {}, 
      limit = 20,
      includeInactive = false 
    } = body;

    // Construction de la requête de recherche
    const where = {
      AND: []
    };

    // Filtrage par statut actif sauf demande contraire
    if (!includeInactive) {
      where.AND.push({ isActive: true });
    }

    // Recherche textuelle
    if (query && query.trim()) {
      where.AND.push({
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { clientCode: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { email: { contains: query, mode: "insensitive" } },
          { recipientName: { contains: query, mode: "insensitive" } },
          { recipientPhone: { contains: query } },
        ]
      });
    }

    // Filtres spécifiques
    if (filters.country) {
      where.AND.push({ country: filters.country });
    }
    
    if (filters.city) {
      where.AND.push({ city: { contains: filters.city, mode: "insensitive" } });
    }
    
    if (filters.isVip !== undefined) {
      where.AND.push({ isVip: filters.isVip });
    }
    
    if (filters.hasOrders !== undefined) {
      if (filters.hasOrders) {
        where.AND.push({ packages: { some: {} } });
      } else {
        where.AND.push({ packages: { none: {} } });
      }
    }

    // Recherche avec résultats enrichis
    const clients = await prisma.client.findMany({
      where: where.AND.length > 0 ? where : {},
      select: {
        id: true,
        clientCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        city: true,
        country: true,
        recipientName: true,
        recipientCity: true,
        isActive: true,
        isVip: true,
        totalSpent: true,
        _count: {
          select: { packages: true }
        }
      },
      orderBy: [
        { isVip: 'desc' },
        { totalSpent: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Ajout d'informations de pertinence
    const clientsWithRelevance = clients.map(client => {
      let relevanceScore = 0;
      
      // Bonus pour clients VIP
      if (client.isVip) relevanceScore += 10;
      
      // Bonus pour clients avec commandes
      if (client._count.packages > 0) relevanceScore += 5;
      
      // Bonus basé sur le total dépensé
      relevanceScore += Math.min(client.totalSpent / 100, 10);

      return {
        ...client,
        packagesCount: client._count.packages,
        relevanceScore,
        _count: undefined
      };
    });

    return NextResponse.json({
      results: clientsWithRelevance,
      total: clientsWithRelevance.length,
      query,
      filters
    });

  } catch (error) {
    console.error("Erreur POST /api/clients/search:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

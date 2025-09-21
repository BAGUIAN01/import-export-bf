// app/api/clients/stats/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // Période en jours
    const includeDetailed = searchParams.get("detailed") === "true";

    // Calcul des dates
    const now = new Date();
    const periodDays = parseInt(period);
    const periodAgo = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Statistiques de base
    const [
      totalClients,
      activeClients,
      vipClients,
      newClients,
      clientsWithOrders,
      totalRevenue,
      avgOrderValue
    ] = await Promise.all([
      // Total des clients
      prisma.client.count(),
      
      // Clients actifs
      prisma.client.count({ where: { isActive: true } }),
      
      // Clients VIP
      prisma.client.count({ where: { isVip: true } }),
      
      // Nouveaux clients dans la période
      prisma.client.count({
        where: {
          createdAt: { gte: periodAgo }
        }
      }),
      
      // Clients avec des commandes
      prisma.client.count({
        where: {
          packages: { some: {} }
        }
      }),
      
      // Chiffre d'affaires total
      prisma.package.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" }
      }),
      
      // Valeur moyenne des commandes
      prisma.package.aggregate({
        _avg: { totalAmount: true }
      })
    ]);

    let detailedStats = null;
    if (includeDetailed) {
      // Statistiques détaillées
      const [
        countryBreakdown,
        monthlyGrowth,
        topClients,
        recentActivity
      ] = await Promise.all([
        // Répartition par pays
        prisma.client.groupBy({
          by: ['country'],
          _count: true,
          orderBy: { _count: { country: 'desc' } }
        }),
        
        // Croissance mensuelle (6 derniers mois)
        Promise.all(
          Array.from({ length: 6 }, (_, i) => {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            return prisma.client.count({
              where: {
                createdAt: {
                  gte: monthStart,
                  lte: monthEnd
                }
              }
            }).then(count => ({
              month: monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
              count
            }));
          })
        ),
        
        // Top 10 des clients par chiffre d'affaires
        prisma.client.findMany({
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            totalSpent: true,
            isVip: true,
            _count: { select: { packages: true } }
          },
          orderBy: { totalSpent: 'desc' },
          take: 10
        }),
        
        // Activité récente (derniers clients créés)
        prisma.client.findMany({
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            country: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      detailedStats = {
        countryBreakdown,
        monthlyGrowth: monthlyGrowth.reverse(),
        topClients,
        recentActivity
      };
    }

    // Calculs des pourcentages et tendances
    const activeRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
    const vipRate = totalClients > 0 ? (vipClients / totalClients) * 100 : 0;
    const conversionRate = totalClients > 0 ? (clientsWithOrders / totalClients) * 100 : 0;

    const stats = {
      summary: {
        totalClients,
        activeClients,
        vipClients,
        newClients,
        clientsWithOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        avgOrderValue: avgOrderValue._avg.totalAmount || 0
      },
      rates: {
        activeRate: Math.round(activeRate),
        vipRate: Math.round(vipRate),
        conversionRate: Math.round(conversionRate)
      },
      period: {
        days: periodDays,
        from: periodAgo.toISOString(),
        to: now.toISOString()
      },
      ...(detailedStats && { detailed: detailedStats })
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Erreur GET /api/clients/stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
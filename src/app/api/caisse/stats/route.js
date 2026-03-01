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

    // Date du jour (début et fin)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    
    // Date d'hier pour calculer la croissance
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime());

    // Statistiques d'aujourd'hui
    const [todayPackages, yesterdayPackages] = await Promise.all([
      // Packages créés aujourd'hui
      prisma.package.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      // Packages créés hier
      prisma.package.findMany({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
      }),
    ]);

    // Calcul des statistiques
    const totalSales = todayPackages.length;
    const totalRevenue = todayPackages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0);
    const totalItems = todayPackages.reduce((sum, pkg) => sum + (pkg.totalQuantity || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Statistiques d'hier
    const yesterdaySales = yesterdayPackages.length;
    const yesterdayRevenue = yesterdayPackages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0);
    const yesterdayItems = yesterdayPackages.reduce((sum, pkg) => sum + (pkg.totalQuantity || 0), 0);
    const yesterdayTicket = yesterdaySales > 0 ? yesterdayRevenue / yesterdaySales : 0;

    // Calcul de la croissance
    const salesGrowth = yesterdaySales > 0 
      ? ((totalSales - yesterdaySales) / yesterdaySales) * 100 
      : (totalSales > 0 ? 100 : 0);
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : (totalRevenue > 0 ? 100 : 0);
    const ticketGrowth = yesterdayTicket > 0 
      ? ((averageTicket - yesterdayTicket) / yesterdayTicket) * 100 
      : (averageTicket > 0 ? 100 : 0);

    // Méthodes de paiement
    const paymentMethodsData = todayPackages.reduce((acc, pkg) => {
      const method = pkg.paymentMethod || "NON_SPECIFIE";
      if (!acc[method]) {
        acc[method] = 0;
      }
      acc[method]++;
      return acc;
    }, {});

    const totalPayments = Object.values(paymentMethodsData).reduce((sum, count) => sum + count, 0);
    const paymentMethods = Object.entries(paymentMethodsData).map(([method, count]) => ({
      method: method === "CASH" ? "Espèces" : 
              method === "CARD" ? "Carte" : 
              method === "MOBILE" ? "Mobile Money" : 
              method === "TRANSFER" ? "Virement" : method,
      count,
      percentage: totalPayments > 0 ? (count / totalPayments) * 100 : 0,
    }));

    // Commandes par statut
    const statusData = todayPackages.reduce((acc, pkg) => {
      const status = pkg.status || "REGISTERED";
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    const totalStatus = Object.values(statusData).reduce((sum, count) => sum + count, 0);
    const ordersByStatus = Object.entries(statusData).map(([status, count]) => ({
      status: status === "DELIVERED" ? "DELIVERED" :
              status === "CANCELLED" ? "CANCELLED" :
              status === "IN_TRANSIT" ? "PENDING" : "PENDING",
      count,
      percentage: totalStatus > 0 ? (count / totalStatus) * 100 : 0,
    }));

    // Top produits (basé sur les descriptions des packages)
    // Pour l'instant, on retourne un tableau vide car il n'y a pas de modèle Product
    const topProducts = [];

    // Dernières ventes
    const recentSales = todayPackages
      .slice(-10)
      .reverse()
      .map((pkg) => ({
        id: pkg.id,
        orderNumber: pkg.packageNumber,
        status: pkg.status === "DELIVERED" ? "DELIVERED" :
                pkg.status === "CANCELLED" ? "CANCELLED" :
                pkg.status === "IN_TRANSIT" ? "PENDING" : "PENDING",
        itemCount: pkg.totalQuantity || 0,
        total: pkg.totalAmount || 0,
        createdAt: pkg.createdAt.toISOString(),
      }));

    return NextResponse.json({
      stats: {
        totalSales,
        totalRevenue,
        totalItems,
        averageTicket,
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        ticketGrowth: Math.round(ticketGrowth * 10) / 10,
      },
      paymentMethods,
      ordersByStatus,
      topProducts,
      recentSales,
    });

  } catch (error) {
    console.error("Erreur GET /api/caisse/stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


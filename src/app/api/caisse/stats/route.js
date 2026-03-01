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

    // Statistiques d'aujourd'hui - Basées sur les SHIPMENTS créés aujourd'hui
    // Pour la caisse, on inclut tous les shipments créés aujourd'hui (sauf annulés)
    // même s'ils n'ont pas encore de paiement, car ils représentent des ventes
    const [todayShipments, yesterdayShipments] = await Promise.all([
      // Shipments créés aujourd'hui (tous sauf annulés)
      prisma.shipment.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday,
          },
          // Exclure uniquement les shipments annulés
          paymentStatus: {
            not: "CANCELLED",
          },
        },
        include: {
          packages: {
            select: {
              types: true,
              description: true,
              totalQuantity: true,
              totalAmount: true,
            },
          },
        },
      }),
      // Shipments créés hier (tous sauf annulés)
      prisma.shipment.findMany({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
          // Exclure uniquement les shipments annulés
          paymentStatus: {
            not: "CANCELLED",
          },
        },
        include: {
          packages: {
            select: {
              types: true,
              description: true,
              totalQuantity: true,
              totalAmount: true,
            },
          },
        },
      }),
    ]);

    // Calcul des statistiques basées sur les shipments
    // Pour la caisse, on utilise paidAmount (montant réellement encaissé) si disponible, sinon totalAmount
    const calculateShipmentPaidAmount = (sh) => {
      // Utiliser le montant réellement payé (encaissé) si disponible
      // Sinon utiliser le montant total de la commande
      return sh.paidAmount > 0 ? sh.paidAmount : (sh.totalAmount || 0);
    };

    const calculateShipmentPackagesCount = (sh) => {
      // Compter le nombre de colis (packages), pas les articles individuels
      return sh.packages.length;
    };

    // Debug: logger le nombre de shipments trouvés
    console.log(`[CAISSE STATS] Shipments aujourd'hui: ${todayShipments.length}, Hier: ${yesterdayShipments.length}`);
    
    // Pour la caisse: compter les ventes avec paiement effectué aujourd'hui
    const totalSales = todayShipments.length;
    // Utiliser paidAmount (montant réellement encaissé) au lieu de totalAmount
    const totalRevenue = todayShipments.reduce((sum, sh) => sum + calculateShipmentPaidAmount(sh), 0);
    // Compter les colis (packages), pas les articles individuels
    const totalItems = todayShipments.reduce((sum, sh) => sum + calculateShipmentPackagesCount(sh), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    console.log(`[CAISSE STATS] Ventes: ${totalSales}, Revenu: ${totalRevenue}, Colis: ${totalItems}`);

    // Statistiques d'hier
    const yesterdaySales = yesterdayShipments.length;
    const yesterdayRevenue = yesterdayShipments.reduce((sum, sh) => sum + calculateShipmentPaidAmount(sh), 0);
    const yesterdayItems = yesterdayShipments.reduce((sum, sh) => sum + calculateShipmentPackagesCount(sh), 0);
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

    // Méthodes de paiement - Basées sur les shipments
    const paymentMethodsData = todayShipments.reduce((acc, sh) => {
      const method = sh.paymentMethod || "NON_SPECIFIE";
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
              method === "MOBILE_MONEY" ? "Mobile Money" : 
              method === "TRANSFER" ? "Virement" : 
              method === "CHEQUE" ? "Chèque" : method,
      count,
      percentage: totalPayments > 0 ? (count / totalPayments) * 100 : 0,
    }));

    // Commandes par statut de paiement
    const statusData = todayShipments.reduce((acc, sh) => {
      const status = sh.paymentStatus || "PENDING";
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    const totalStatus = Object.values(statusData).reduce((sum, count) => sum + count, 0);
    const ordersByStatus = Object.entries(statusData).map(([status, count]) => ({
      status: status === "PAID" ? "DELIVERED" :
              status === "CANCELLED" ? "CANCELLED" :
              status === "PENDING" || status === "PARTIAL" ? "PENDING" : "PENDING",
      count,
      percentage: totalStatus > 0 ? (count / totalStatus) * 100 : 0,
    }));

    // Top produits - Basé sur les types de packages dans les shipments
    // Utiliser le paidAmount du shipment (montant réellement encaissé) proportionnellement
    const productMap = {};
    
    todayShipments.forEach((sh) => {
      // Vérifier que le shipment a des packages
      if (!sh.packages || sh.packages.length === 0) {
        return;
      }

      // Calculer le montant total des packages pour ce shipment
      const shipmentTotalAmount = sh.packages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0);
      // Utiliser le paidAmount du shipment (montant réellement encaissé)
      const shipmentPaidAmount = sh.paidAmount || 0;
      // Ratio pour répartir le montant payé proportionnellement
      // Si le montant total est 0, on utilise directement le paidAmount réparti équitablement
      const paymentRatio = shipmentTotalAmount > 0 ? shipmentPaidAmount / shipmentTotalAmount : (shipmentPaidAmount > 0 ? shipmentPaidAmount / sh.packages.length : 0);

      sh.packages.forEach((pkg) => {
        try {
          // Le champ types peut être un JSON string ou un objet déjà parsé
          let types = pkg.types;
          if (typeof types === 'string') {
            try {
              types = JSON.parse(types);
            } catch (parseError) {
              console.warn("Erreur parsing types:", parseError);
              types = null;
            }
          }
          
          if (Array.isArray(types) && types.length > 0) {
            // Si c'est un tableau, parcourir chaque type
            const totalTypesQuantity = types.reduce((sum, t) => sum + (t.quantity || 1), 0);
            types.forEach((type) => {
              const productName = type.type || type.productId || "Autre";
              const quantity = type.quantity || 1;
              
              // Répartir le montant du package proportionnellement à la quantité de ce type
              let packageTypeAmount = 0;
              if (shipmentTotalAmount > 0) {
                packageTypeAmount = totalTypesQuantity > 0
                  ? ((pkg.totalAmount || 0) * quantity) / totalTypesQuantity
                  : (pkg.totalAmount || 0) / types.length;
              } else {
                // Si pas de montant total, répartir équitablement le paidAmount
                packageTypeAmount = shipmentPaidAmount > 0 ? (shipmentPaidAmount / sh.packages.length) / types.length : 0;
              }
              
              // Appliquer le ratio de paiement pour obtenir le montant réellement encaissé
              const typeRevenue = shipmentTotalAmount > 0 
                ? packageTypeAmount * paymentRatio 
                : packageTypeAmount;
              
              if (!productMap[productName]) {
                productMap[productName] = { quantity: 0, revenue: 0 };
              }
              productMap[productName].quantity += quantity;
              productMap[productName].revenue += typeRevenue;
            });
          } else {
            // Si types n'est pas un tableau valide, utiliser la description du package
            // Essayer d'extraire le type depuis la description ou utiliser "Autre"
            let productName = "Autre";
            if (pkg.description) {
              // Essayer de trouver un type connu dans la description
              const descriptionUpper = pkg.description.toUpperCase();
              if (descriptionUpper.includes("CARTON")) {
                productName = "CARTON";
              } else if (descriptionUpper.includes("FUT") || descriptionUpper.includes("BARRIQUE")) {
                productName = "BARRIQUE";
              } else if (descriptionUpper.includes("VALISE")) {
                productName = "VALISE_MEDIUM";
              } else if (descriptionUpper.includes("TV") || descriptionUpper.includes("TELEVISEUR")) {
                productName = "TV_43";
              } else {
                productName = pkg.description;
              }
            }
            
            if (!productMap[productName]) {
              productMap[productName] = { quantity: 0, revenue: 0 };
            }
            // Utiliser le montant réellement encaissé pour ce package
            let packagePaidAmount = 0;
            if (shipmentTotalAmount > 0) {
              packagePaidAmount = (pkg.totalAmount || 0) * paymentRatio;
            } else {
              packagePaidAmount = shipmentPaidAmount > 0 ? shipmentPaidAmount / sh.packages.length : 0;
            }
            productMap[productName].quantity += pkg.totalQuantity || 1;
            productMap[productName].revenue += packagePaidAmount;
          }
        } catch (e) {
          console.warn("Erreur traitement package:", e);
          // En cas d'erreur, utiliser la description du package
          const productName = pkg.description || "Autre";
          if (!productMap[productName]) {
            productMap[productName] = { quantity: 0, revenue: 0 };
          }
          // Utiliser le montant réellement encaissé pour ce package
          let packagePaidAmount = 0;
          if (shipmentTotalAmount > 0) {
            packagePaidAmount = (pkg.totalAmount || 0) * paymentRatio;
          } else {
            packagePaidAmount = shipmentPaidAmount > 0 ? shipmentPaidAmount / sh.packages.length : 0;
          }
          productMap[productName].quantity += pkg.totalQuantity || 1;
          productMap[productName].revenue += packagePaidAmount;
        }
      });
    });

    // Mapper les types de produits vers des noms lisibles
    // Importons dynamiquement depuis PACKAGE_TYPES si possible, sinon utiliser ce mapping
    const productTypeLabels = {
      // Cartons
      "CARTON": "Carton Standard",
      "CARTON_MEDIUM": "Carton Moyen",
      "CARTON_LARGE": "Carton Grand",
      // Fûts
      "BARRIQUE": "Fût Bleu 220L",
      "FUT_BLACK_270L": "Fût Noir 270L",
      // Valises
      "VALISE_SMALL": "Petite Valise",
      "VALISE_MEDIUM": "Valise Moyenne",
      "VALISE_LARGE": "Grande Valise",
      "VALISE_XLARGE": "Très Grande Valise",
      // Sacs
      "SAC_MEDIUM": "Sac Moyen",
      "SAC_LARGE": "Grand Sac",
      "SAC_XLARGE": "Très Grand Sac",
      // Cantines
      "CANTINE_SMALL": "Petite Cantine",
      "CANTINE_MEDIUM": "Cantine Moyenne",
      "CANTINE_LARGE": "Grande Cantine",
      "CANTINE_XLARGE": "Très Grande Cantine",
      // TV
      "TV_32": "TV 32 pouces",
      "TV_40": "TV 40 pouces",
      "TV_43": "TV 43 pouces",
      "TV_48": "TV 48 pouces",
      "TV_50": "TV 50 pouces",
      "TV_55": "TV 55 pouces",
      "TV_65": "TV 65 pouces",
      "TV_75": "TV 75 pouces",
      "TV_80": "TV 80 pouces",
      // Électroménager
      "ELECTRONICS": "Micro-ondes",
      "MICROWAVE": "Four à micro-ondes",
      "FRIDGE_SMALL": "Petit Frigo",
      "FRIDGE_STANDARD": "Frigo Standard",
      "FRIDGE_LARGE": "Grand Frigo",
      "FRIDGE_AMERICAN": "Frigo Américain",
      "REFRIGERATOR": "Réfrigérateur",
      "FREEZER_SMALL": "Petit Congélateur",
      "FREEZER_MEDIUM": "Congélateur Moyen",
      "FREEZER_LARGE": "Grand Congélateur",
      "WASHING_MACHINE": "Machine à laver",
      "STOVE": "Gazinière",
      // Véhicules
      "BICYCLE": "Vélo",
      "MOTORCYCLE": "Moto",
      // Divers
      "FURNITURE": "Meuble",
      "GENERATOR_SMALL": "Groupe électrogène",
      "OTHER": "Autre",
    };

    const topProducts = Object.entries(productMap)
      .map(([productName, data]) => ({
        productId: productName,
        productName: productTypeLabels[productName] || productName,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue) // Trier par revenu (montant encaissé)
      .slice(0, 5);

    // Dernières ventes - Basées sur les shipments
    const recentSales = todayShipments
      .slice(-10)
      .reverse()
      .map((sh) => ({
        id: sh.id,
        orderNumber: sh.shipmentNumber,
        status: sh.paymentStatus === "PAID" ? "DELIVERED" :
                sh.paymentStatus === "CANCELLED" ? "CANCELLED" :
                sh.paymentStatus === "PENDING" || sh.paymentStatus === "PARTIAL" ? "PENDING" : "PENDING",
        itemCount: calculateShipmentPackagesCount(sh),
        total: calculateShipmentPaidAmount(sh),
        createdAt: sh.createdAt.toISOString(),
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


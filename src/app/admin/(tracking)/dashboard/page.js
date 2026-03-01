export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "@/components/modules/admin/dashboard";
import { PageContainer, PageBody } from "@/components/layout/admin/page-shell";
import { PageTitle } from "@/components/layout/admin/page-title";

async function getDashboardData() {
  try {
    const [
      totalPackages,
      totalContainers,
      totalClients,
      packagesThisMonth,
      activeContainers,
      deliveredThisWeek
    ] = await Promise.all([
      prisma.package.count(),

      prisma.container.count(),
      
      prisma.client.count({
        where: { isActive: true }
      }),

      prisma.package.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Conteneurs actifs = conteneurs avec des packages et non livrés/annulés
      prisma.container.count({
        where: {
          status: {
            in: ['PREPARATION', 'LOADED', 'IN_TRANSIT', 'CUSTOMS']
          },
          packages: {
            some: {}
          }
        }
      }),

      prisma.package.count({
        where: {
          status: 'DELIVERED',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // ⚠️ IMPORTANT: Calculer le revenu à partir des SHIPMENTS créés ce mois
    // Utiliser totalAmount pour le CA (chiffre d'affaires) et paidAmount pour les encaissements
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    // Récupérer les shipments du mois avec leurs packages pour calculer le revenu
    const monthlyShipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: monthStart
        }
      },
      include: {
        packages: {
          select: {
            totalAmount: true
          }
        }
      }
    });

    // Calculer le CA mensuel : utiliser totalAmount du shipment ou calculer depuis les packages
    const monthlyRevenue = monthlyShipments.reduce((sum, sh) => {
      if (sh.totalAmount && sh.totalAmount > 0) {
        return sum + sh.totalAmount;
      }
      // Calculer depuis les packages si le montant du shipment n'est pas disponible
      const packagesTotal = sh.packages.reduce((pkgSum, pkg) => pkgSum + (pkg.totalAmount || 0), 0);
      return sum + packagesTotal;
    }, 0);

    // Encaissements mensuels = paidAmount des shipments payés ce mois
    const monthlyPaidResult = await prisma.shipment.aggregate({
      _sum: {
        paidAmount: true
      },
      where: {
        OR: [
          {
            paidAt: {
              gte: monthStart
            }
          },
          {
            AND: [
              { createdAt: { gte: monthStart } },
              { paidAmount: { gt: 0 } }
            ]
          }
        ]
      }
    });

    const monthlyPaid = monthlyPaidResult._sum.paidAmount || 0;

    const recentContainers = await prisma.container.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        containerNumber: true,
        name: true,
        status: true,
        currentLocation: true,
        origin: true,
        departureDate: true,
        currentLoad: true,
        capacity: true,
        updatedAt: true
      }
    });

    const stats = {
      totalPackages,
      packagesThisMonth,
      activeContainers,
      totalClients,
      monthlyRevenue, // CA mensuel (calculé depuis shipments + packages)
      monthlyPaid, // Encaissements mensuels
      deliveredThisWeek
    };

    return {
      stats,
      recentContainers
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des données dashboard:', error);
    throw error;
  }
}


export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }

    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      redirect('/unauthorized');
    }

    const dashboardData = await getDashboardData();

    return (
      <PageContainer>
        <PageTitle title="Tableau de bord" />

        <PageBody>
          <Dashboard
            user={session.user}
            data={dashboardData}
          />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Erreur chargement dashboard:", error);
    return (
      <PageContainer>
        <PageTitle title="Tableau de bord" />
        <PageBody>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
              <p className="text-muted-foreground">
                Impossible de charger les données du tableau de bord
              </p>
            </div>
          </div>
        </PageBody>
      </PageContainer>
    );
  }
}
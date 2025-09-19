
export const dynamic = "force-dynamic";

import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "@/components/modules/admin/dashboard";

import {
  PageContainer,
  PageHeader,
  PageBody,
} from "@/components/layout/admin/page-shell";
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

      prisma.container.count({
        where: {
          status: {
            in: ['PREPARATION', 'LOADED', 'IN_TRANSIT', 'CUSTOMS']
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

    const monthlyRevenue = await prisma.package.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        },
        paymentStatus: {
          in: ['PAID', 'PARTIAL']
        }
      }
    });

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

    const recentActivity = await prisma.auditLog.findMany({
      take: 4,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const formattedActivity = recentActivity.map(log => {
      let message = '';
      let status = 'info';
      
      switch (log.action) {
        case 'CREATE_PACKAGE':
          message = `Nouveau colis enregistré`;
          status = 'success';
          break;
        case 'CREATE_CONTAINER':
          message = `Nouveau conteneur créé`;
          status = 'info';
          break;
        case 'UPDATE_CONTAINER':
          message = `Conteneur mis à jour`;
          status = 'info';
          break;
        case 'CREATE_TRACKING_UPDATE':
          message = `Mise à jour de suivi ajoutée`;
          status = 'info';
          break;
        case 'CREATE_CLIENT':
          message = `Nouveau client enregistré`;
          status = 'success';
          break;
        default:
          message = log.action.replace(/_/g, ' ').toLowerCase();
      }

      return {
        id: log.id,
        type: log.action.toLowerCase(),
        message,
        time: formatTimeAgo(log.createdAt),
        status,
        user: log.user
      };
    });

    const stats = {
      totalPackages,
      packagesThisMonth,
      activeContainers,
      totalClients,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      deliveredThisWeek
    };

    return {
      stats,
      recentContainers,
      recentActivity: formattedActivity
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des données dashboard:', error);
    throw error;
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes}min`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`;
  }
  
  return new Date(date).toLocaleDateString('fr-FR');
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
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Tableau de bord" },
          ]}
        />
        <PageBody>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-muted-foreground">
                Impossible de charger les données du tableau de bord
              </p>
              <p className="text-sm text-red-500 mt-2">
                {error?.message ?? "Erreur inconnue"}
              </p>
            </div>
          </div>
        </PageBody>
      </PageContainer>
    );
  }
}
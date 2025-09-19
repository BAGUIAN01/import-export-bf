// app/(dashboard)/admin/packages/page.js
export const dynamic = "force-dynamic";

import React from "react";
import { PackagesTable } from "@/components/modules/admin/packages/packages-table";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import {
  PageContainer,
  PageHeader,
  PageBody,
} from "@/components/layout/admin/page-shell";
import { PageTitle } from "@/components/layout/admin/page-title";

async function getPackagesData(session) {
  try {
    // Récupération des colis avec toutes les relations nécessaires
    const packages = await prisma.package.findMany({
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            city: true,
            recipientName: true,
            recipientCity: true,
            recipientAddress: true,
          }
        },
        container: {
          select: {
            id: true,
            containerNumber: true,
            name: true,
            status: true,
            departureDate: true,
            arrivalDate: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Récupération des clients pour le dialog
    const clients = await prisma.client.findMany({
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
        recipientPhone: true,
        recipientAddress: true,
        recipientCity: true,
        isActive: true,
        isVip: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    // Récupération des conteneurs actifs pour le dialog
    const containers = await prisma.container.findMany({
      select: {
        id: true,
        containerNumber: true,
        name: true,
        status: true,
        departureDate: true,
        arrivalDate: true,
        capacity: true,
        currentLoad: true,
      },
      where: {
        status: {
          in: ['PREPARATION', 'LOADED', 'IN_TRANSIT']
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcul des statistiques
    const [
      totalPackages,
      registeredCount,
      collectedCount,
      inContainerCount,
      inTransitCount,
      customsCount,
      deliveredCount,
      returnedCount,
      cancelledCount
    ] = await Promise.all([
      prisma.package.count(),
      prisma.package.count({ where: { status: 'REGISTERED' } }),
      prisma.package.count({ where: { status: 'COLLECTED' } }),
      prisma.package.count({ where: { status: 'IN_CONTAINER' } }),
      prisma.package.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.package.count({ where: { status: 'CUSTOMS' } }),
      prisma.package.count({ where: { status: 'DELIVERED' } }),
      prisma.package.count({ where: { status: 'RETURNED' } }),
      prisma.package.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Statistiques de paiement
    const [paymentPendingCount, paymentPartialCount, paymentPaidCount] = await Promise.all([
      prisma.package.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.package.count({ where: { paymentStatus: 'PARTIAL' } }),
      prisma.package.count({ where: { paymentStatus: 'PAID' } }),
    ]);

    // Colis avec problèmes (retournés ou annulés)
    const issuesCount = returnedCount + cancelledCount;

    // Colis en attente de paiement (pending ou partial)
    const paymentPendingTotal = paymentPendingCount + paymentPartialCount;

    // Nouveaux colis du mois
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newThisMonth = await prisma.package.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Colis urgents
    const urgentCount = await prisma.package.count({
      where: {
        priority: 'URGENT',
        status: {
          notIn: ['DELIVERED', 'CANCELLED', 'RETURNED']
        }
      }
    });

    // Revenus du mois
    const monthlyRevenue = await prisma.package.aggregate({
      where: {
        paymentStatus: 'PAID',
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    const stats = {
      total: totalPackages,
      pending: registeredCount, // En attente (enregistrés)
      inTransit: inTransitCount + inContainerCount, // En transit (conteneur + transit)
      delivered: deliveredCount,
      paymentPending: paymentPendingTotal,
      issues: issuesCount,
      newThisMonth,
      urgent: urgentCount,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      
      // Détail par statut
      statusBreakdown: {
        registered: registeredCount,
        collected: collectedCount,
        inContainer: inContainerCount,
        inTransit: inTransitCount,
        customs: customsCount,
        delivered: deliveredCount,
        returned: returnedCount,
        cancelled: cancelledCount,
      },
      
      // Détail paiements
      paymentBreakdown: {
        pending: paymentPendingCount,
        partial: paymentPartialCount,
        paid: paymentPaidCount,
      }
    };

    return { 
      packages, 
      clients, 
      containers, 
      stats 
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données colis:', error);
    throw error;
  }
}

export default async function PackagesPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }

    // Vérification des permissions - Colis gérés par ADMIN, STAFF et AGENT
    if (!['ADMIN', 'STAFF', 'AGENT'].includes(session.user.role)) {
      redirect('/unauthorized');
    }

    const { packages, clients, containers, stats } = await getPackagesData(session);

    return (
      <PageContainer>
        <PageTitle title="Gestion des Colis" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Gestion" },
            { label: "Colis" },
          ]}
        />
        <PageBody>
          <PackagesTable
            initialPackages={packages}
            initialStats={stats}
            initialClients={clients}
            initialContainers={containers}
          />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Erreur chargement colis:", error);
    return (
      <PageContainer>
        <PageTitle title="Gestion des Colis" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Gestion" },
            { label: "Colis" },
          ]}
        />
        <PageBody>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-muted-foreground">
                Impossible de charger les données des colis
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
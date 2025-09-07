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
    // Construction du filtre selon le rôle
    let where = {};
    if (session.user.role === 'CLIENT') {
      const userClient = await prisma.client.findFirst({
        where: { userId: session.user.id }
      });
      if (userClient) {
        where.clientId = userClient.id;
      }
    }

    // Récupération des packages
    const packages = await prisma.package.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            firstName: true,
            lastName: true,
            recipientCity: true,
            recipientName: true,
          },
        },
        container: {
          select: {
            id: true,
            containerNumber: true,
            name: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limite pour les performances
    });

    // Calcul des statistiques
    const [
      total,
      statusCounts,
      paymentStatusCounts,
    ] = await Promise.all([
      prisma.package.count({ where }),
      prisma.package.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
      }),
      prisma.package.groupBy({
        by: ['paymentStatus'],
        where,
        _count: {
          paymentStatus: true,
        },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const paymentMap = paymentStatusCounts.reduce((acc, item) => {
      acc[item.paymentStatus] = item._count.paymentStatus;
      return acc;
    }, {});

    const stats = {
      total,
      inTransit: statusMap.IN_TRANSIT || 0,
      delivered: statusMap.DELIVERED || 0,
      pending: statusMap.REGISTERED || 0,
      paymentPending: (paymentMap.PENDING || 0) + (paymentMap.PARTIAL || 0),
      issues: (statusMap.RETURNED || 0) + (statusMap.CANCELLED || 0),
      byStatus: statusMap,
      byPaymentStatus: paymentMap,
    };

    // Récupération des clients
    const clients = await prisma.client.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        clientCode: true,
        firstName: true,
        lastName: true,
        recipientCity: true,
        recipientName: true,
        isVip: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Récupération des conteneurs disponibles
    const containers = await prisma.container.findMany({
      where: {
        status: {
          in: ['PREPARATION', 'LOADED']
        }
      },
      select: {
        id: true,
        containerNumber: true,
        name: true,
        status: true,
        currentLoad: true,
        capacity: true,
        departureDate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      packages,
      stats,
      clients,
      containers,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
}

export default async function PackagesPage() {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }

    // Vérification des permissions
    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      redirect('/unauthorized');
    }

    const { packages, stats, clients, containers } = await getPackagesData(session);

    return (
      <PageContainer>
        <PageTitle title="Gestion des Colis" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Expédition" },
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
            { label: "Expédition" },
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
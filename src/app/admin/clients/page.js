// app/(dashboard)/admin/clients/page.js
export const dynamic = "force-dynamic";

import React from "react";
import { ClientsTable } from "@/components/modules/admin/clients/clients-table";
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

async function getClientsData(session) {
  try {
    // Récupération des clients avec les shipments associés
    const clients = await prisma.client.findMany({
      include: {
        packages: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            shipmentId: true,
          },
        },
        shipments: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            paymentStatus: true,
            packagesCount: true,
          },
        },
        _count: {
          select: {
            packages: true,
            shipments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrichissement des données clients
    const enrichedClients = clients.map(client => {
      // Calculer le total dépensé basé sur les shipments (logique de paiement centralisée)
      const totalSpent = client.shipments.reduce((sum, shipment) => sum + (shipment.paidAmount || 0), 0);
      
      // Calculer le total des montants des shipments (pour référence)
      const totalShipmentsAmount = client.shipments.reduce((sum, shipment) => sum + (shipment.totalAmount || 0), 0);
      
      // Calculer le nombre total de colis via les shipments
      const totalPackagesCount = client.shipments.reduce((sum, shipment) => sum + (shipment.packagesCount || 0), 0);

      return {
        ...client,
        packagesCount: totalPackagesCount,
        totalSpent,
        totalShipmentsAmount,
        shipmentsCount: client._count.shipments,
        // Garder l'ancien calcul pour compatibilité si nécessaire
        legacyTotalSpent: client.packages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0),
      };
    });

    // Calcul des statistiques
    const [total, activeCount, vipCount] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({
        where: { isActive: true }
      }),
      prisma.client.count({
        where: { isVip: true }
      }),
    ]);

    // Calcul des clients avec commandes (shipments)
    const withOrdersCount = await prisma.client.count({
      where: {
        shipments: {
          some: {}
        }
      }
    });

    // Calcul des nouveaux clients du mois
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newThisMonth = await prisma.client.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Calcul des destinataires au Burkina Faso
    const burkinaRecipientsCount = await prisma.client.count({
      where: {
        recipientCity: {
          not: null,
          not: ""
        }
      }
    });

    // Calcul des statistiques financières
    const financialStats = await prisma.shipment.aggregate({
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const stats = {
      total,
      active: activeCount,
      newThisMonth,
      withOrders: withOrdersCount,
      vip: vipCount,
      burkinaRecipients: burkinaRecipientsCount,
      // Statistiques financières
      totalRevenue: financialStats._sum.totalAmount || 0,
      totalPaid: financialStats._sum.paidAmount || 0,
      totalShipments: financialStats._count.id || 0,
    };

    return { clients: enrichedClients, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des données clients:', error);
    throw error;
  }
}

export default async function ClientsPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }

    // Vérification des permissions - Clients gérés par ADMIN et STAFF
    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      redirect('/unauthorized');
    }

    const { clients, stats } = await getClientsData(session);

    return (
      <PageContainer>
        <PageTitle title="Gestion des Clients" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Gestion" },
            { label: "Clients" },
          ]}
        />
        <PageBody>
          <ClientsTable
            initialClients={clients}
            initialStats={stats}
          />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Erreur chargement clients:", error);
    return (
      <PageContainer>
        <PageTitle title="Gestion des Clients" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Gestion" },
            { label: "Clients" },
          ]}
        />
        <PageBody>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-muted-foreground">
                Impossible de charger les données des clients
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
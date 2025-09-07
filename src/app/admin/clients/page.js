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
    // Récupération des clients avec le nombre de colis associés
    const clients = await prisma.client.findMany({
      include: {
        packages: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
        _count: {
          select: {
            packages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrichissement des données clients
    const enrichedClients = clients.map(client => ({
      ...client,
      packagesCount: client._count.packages,
      totalSpent: client.packages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0),
    }));

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

    // Calcul des clients avec commandes
    const withOrdersCount = await prisma.client.count({
      where: {
        packages: {
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

    const stats = {
      total,
      active: activeCount,
      newThisMonth,
      withOrders: withOrdersCount,
      vip: vipCount,
      burkinaRecipients: burkinaRecipientsCount,
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
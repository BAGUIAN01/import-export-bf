// app/admin/clients/[id]/page.js
export const dynamic = "force-dynamic";

import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

import {
  PageContainer,
  PageHeader,
  PageBody,
} from "@/components/layout/admin/page-shell";
import { PageTitle } from "@/components/layout/admin/page-title";
import ClientDetail from "@/components/modules/admin/clients/client-details";

async function getClientData(id) {
  // Récupération du client avec ses informations complètes
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          lastLoginAt: true,
        },
      },
      packages: {
        include: {
          container: {
            select: {
              id: true,
              containerNumber: true,
              name: true,
              status: true,
              departureDate: true,
              arrivalDate: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          shipment: {
            select: {
              id: true,
              shipmentNumber: true,
              totalAmount: true,
              paidAmount: true,
              paymentStatus: true,
              paymentMethod: true,
              paidAt: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      },
      shipments: {
        select: {
          id: true,
          shipmentNumber: true,
          totalAmount: true,
          paidAmount: true,
          paymentStatus: true,
          paymentMethod: true,
          paidAt: true,
          packagesCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          issueDate: true,
          dueDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Limiter aux 10 dernières factures
      },
      payments: {
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Limiter aux 10 derniers paiements
      },
      _count: {
        select: {
          packages: true,
          shipments: true,
          invoices: true,
          payments: true,
        },
      },
    },
  });

  if (!client) return null;

  // Calcul des statistiques du client basées sur les shipments
  const packages = client.packages || [];
  const shipments = client.shipments || [];
  
  // Logique de paiement centralisée au niveau shipment
  const totalSpent = shipments.reduce((sum, shipment) => sum + (shipment.paidAmount || 0), 0);
  const totalShipmentsAmount = shipments.reduce((sum, shipment) => sum + (shipment.totalAmount || 0), 0);
  const packagesCount = shipments.reduce((sum, shipment) => sum + (shipment.packagesCount || 0), 0);
  const shipmentsCount = shipments.length;
  const avgOrderValue = shipmentsCount > 0 ? totalShipmentsAmount / shipmentsCount : 0;
  const lastOrderDate = shipmentsCount > 0 ? shipments[0].createdAt : null;

  // Statistiques par statut des colis
  const statusBreakdown = packages.reduce((acc, pkg) => {
    acc[pkg.status] = (acc[pkg.status] || 0) + 1;
    return acc;
  }, {});

  // Statistiques par statut de paiement des shipments
  const paymentBreakdown = shipments.reduce((acc, shipment) => {
    acc[shipment.paymentStatus] = (acc[shipment.paymentStatus] || 0) + 1;
    return acc;
  }, {});

  // Évolution mensuelle des expéditions (6 derniers mois)
  const now = new Date();
  const monthlyOrders = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthShipments = shipments.filter(shipment => {
      const shipmentDate = new Date(shipment.createdAt);
      return shipmentDate >= monthStart && shipmentDate <= monthEnd;
    });

    monthlyOrders.push({
      month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      count: monthShipments.length,
      revenue: monthShipments.reduce((sum, shipment) => sum + (shipment.totalAmount || 0), 0),
      paid: monthShipments.reduce((sum, shipment) => sum + (shipment.paidAmount || 0), 0),
    });
  }

  // Conteneurs disponibles (pour créer de nouveaux colis)
  const availableContainers = await prisma.container.findMany({
    select: {
      id: true,
      containerNumber: true,
      name: true,
      status: true,
      departureDate: true,
      capacity: true,
      currentLoad: true,
    },
    where: { 
      status: { in: ["PREPARATION", "LOADED"] },
    },
    orderBy: { departureDate: "asc" },
  });

  // Filtrer les conteneurs non pleins côté JavaScript
  const nonFullContainers = availableContainers.filter(container => 
    container.currentLoad < container.capacity
  );

  // Activité récente (audit logs pour ce client)
  // ⚠️ Correctif: details est Json => on filtre via path + equals (plus de contains)
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      OR: [
        { resource: "client", resourceId: client.id },
        {
          resource: "package",
          details: {
            path: ["clientId"],
            equals: client.id,
            // Si tu as des logs historiques où clientId est une string et tu veux être permissif :
            // string_contains: client.id,
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const stats = {
    totalSpent,
    totalShipmentsAmount,
    packagesCount,
    shipmentsCount,
    avgOrderValue,
    lastOrderDate,
    statusBreakdown,
    paymentBreakdown,
    monthlyOrders,
    invoicesCount: client._count.invoices,
    paymentsCount: client._count.payments,
    // Statistiques de paiement
    paymentStatus: {
      pending: paymentBreakdown.PENDING || 0,
      partial: paymentBreakdown.PARTIAL || 0,
      paid: paymentBreakdown.PAID || 0,
      cancelled: paymentBreakdown.CANCELLED || 0,
      refunded: paymentBreakdown.REFUNDED || 0,
    },
    // Pourcentage de paiement
    paymentPercentage: totalShipmentsAmount > 0 ? (totalSpent / totalShipmentsAmount) * 100 : 0,
  };

  return { 
    client, 
    stats, 
    availableContainers: nonFullContainers, 
    recentActivity 
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params; // Await params for Next.js 15
  
  // Récupération simple pour les métadonnées
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      firstName: true,
      lastName: true,
      clientCode: true,
    },
  });

  if (!client) {
    return {
      title: "Client introuvable",
    };
  }

  return {
    title: `${client.firstName} ${client.lastName} (${client.clientCode}) - Détails Client`,
    description: `Profil détaillé du client ${client.firstName} ${client.lastName} avec historique des commandes et statistiques.`,
  };
}

export default async function ClientDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  
  // Vérification de l'authentification
  if (!session) {
    redirect("/auth/signin");
  }

  // Vérification des permissions
  if (!["ADMIN", "STAFF", "AGENT"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const { id } = await params; // Await params for Next.js 15
  
  // Validation de l'ID
  if (!id || typeof id !== "string") {
    notFound();
  }

  // Récupération des données
  const data = await getClientData(id);
  
  if (!data) {
    notFound();
  }

  const { client, stats, availableContainers, recentActivity } = data;

  // Vérification supplémentaire pour les agents (accès limité)
  if (session.user.role === "AGENT") {
    // Les agents ne peuvent voir que les clients actifs
    if (!client.isActive) {
      redirect("/unauthorized");
    }
  }

  return (
    <PageContainer>
      <PageTitle 
        title={`${client.firstName} ${client.lastName}`}
        subtitle={`Code client: ${client.clientCode}`}
      />
      
      <PageHeader
        breadcrumbs={[
          { label: "Accueil", href: "/admin/dashboard" },
          { label: "Clients", href: "/admin/clients" },
          { 
            label: `${client.firstName} ${client.lastName}`,
            href: `/admin/clients/${client.id}`,
          },
        ]}
      />
      
      <PageBody>
        <ClientDetail
          initialClient={JSON.parse(JSON.stringify(client))}
          initialStats={JSON.parse(JSON.stringify(stats))}
          initialContainers={JSON.parse(JSON.stringify(availableContainers))}
          initialActivity={JSON.parse(JSON.stringify(recentActivity))}
          userRole={session.user.role}
          userId={session.user.id}
        />
      </PageBody>
    </PageContainer>
  );
}

// Fonction pour valider les paramètres de la route
export function generateStaticParams() {
  // Dans un environnement de production, vous pourriez vouloir
  // pré-générer certaines pages de clients fréquemment consultés
  return [];
}

// app/(dashboard)/admin/containers/page.js
export const dynamic = "force-dynamic";

import React from "react";
import { ContainersTable } from "@/components/modules/admin/containers/containers-table";
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

async function getContainersData(session) {
  try {
    // Récupérer les conteneurs avec le compte de packages
    const containers = await prisma.container.findMany({
      include: {
        _count: {
          select: { packages: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Ajouter le comptage réel des packages à chaque conteneur
    const containersWithCount = containers.map((container) => ({
      ...container,
      currentLoad: container._count.packages, // Mettre à jour avec le vrai compte
      packagesCount: container._count.packages,
    }));

    const [total, statusCounts] = await Promise.all([
      prisma.container.count(),
      prisma.container.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
    ]);

    // Calculer le total de packages avec le vrai compte
    const totalPackages = containersWithCount.reduce((sum, container) => {
      return sum + (container.packagesCount || 0);
    }, 0);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const stats = {
      total,
      inTransit: statusMap.IN_TRANSIT || 0,
      delivered: statusMap.DELIVERED || 0,
      preparation: statusMap.PREPARATION || 0,
      totalPackages,
      issues: statusMap.CANCELLED || 0,
      byStatus: statusMap,
    };

    return { containers: containersWithCount, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
}

export default async function ContainersPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }


    if (!['ADMIN'].includes(session.user.role)) {
      redirect('/unauthorized');
    }

    const { containers, stats } = await getContainersData(session);

    return (
      <PageContainer>
        <PageTitle title="Gestion des Conteneurs" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Expédition" },
            { label: "Conteneurs" },
          ]}
        />
        <PageBody>
          <ContainersTable
            initialContainers={containers}
            initialStats={stats}
          />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Erreur chargement conteneurs:", error);
    return (
      <PageContainer>
        <PageTitle title="Gestion des Conteneurs" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Expédition" },
            { label: "Conteneurs" },
          ]}
        />
        <PageBody>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-muted-foreground">
                Impossible de charger les données des conteneurs
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
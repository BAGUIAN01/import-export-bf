
export const dynamic = "force-dynamic";

import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ContainerDetailView } from "@/components/modules/admin/containers/container-detail-view";

import {
  PageContainer,
  PageHeader,
  PageBody,
} from "@/components/layout/admin/page-shell";
import { PageTitle } from "@/components/layout/admin/page-title";

async function getContainerData(containerId) {
  try {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        trackingUpdates: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    return container;
  } catch (error) {
    console.error('Erreur lors de la récupération du conteneur:', error);
    throw error;
  }
}

export default async function ContainerDetailPage({ params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect('/auth/signin');
    }

    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      redirect('/unauthorized');
    }

    const container = await getContainerData(params.id);
    
    if (!container) {
      notFound();
    }

    return (
      <PageContainer>
        <PageTitle title={`Conteneur ${container.containerNumber}`} />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Expédition" },
            { label: "Conteneurs", href: "/admin/containers" },
            { label: container.containerNumber },
          ]}
        />
        <PageBody>
          <ContainerDetailView 
            container={container} 
            currentUser={session.user}
          />
        </PageBody>
      </PageContainer>
    );
  } catch (error) {
    console.error("Erreur chargement détail conteneur:", error);
    return (
      <PageContainer>
        <PageTitle title="Conteneur" />
        <PageHeader
          breadcrumbs={[
            { label: "Accueil", href: "/admin/dashboard" },
            { label: "Expédition" },
            { label: "Conteneurs", href: "/admin/containers" },
            { label: "Erreur" },
          ]}
        />
        <PageBody>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-gray-600">
                Impossible de charger les détails du conteneur
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
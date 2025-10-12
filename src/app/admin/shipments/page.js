// app/admin/shipments/page.js
export const dynamic = "force-dynamic";

import React from "react";
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
import { ShipmentsTable } from "@/components/modules/admin/shipments/shipments-table";

async function getShipmentsData(session) {
  // Shipments + relations minimales pour listing
  const shipments = await prisma.shipment.findMany({
    select: {
      id: true,
      shipmentNumber: true,
      createdAt: true,
      updatedAt: true,
      
      // Champs agrégés importants pour les stats
      packagesCount: true,
      totalQuantity: true,
      subtotal: true,
      pickupFeeTotal: true,
      insuranceFeeTotal: true,
      customsFeeTotal: true,
      discountTotal: true,
      totalAmount: true,
      paidAmount: true,
      paymentStatus: true,
      paymentMethod: true,
      paidAt: true,
      
      // Autres infos
      pickupAddress: true,
      pickupDate: true,
      pickupTime: true,
      deliveryAddress: true,
      specialInstructions: true,
      notes: true,
      
      // Relations
      client: {
        select: {
          id: true, firstName: true, lastName: true, clientCode: true,
          recipientCity: true, recipientAddress: true,
        },
      },
      container: {
        select: {
          id: true, containerNumber: true, name: true, status: true,
          departureDate: true, arrivalDate: true,
        },
      },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Clients actifs pour l’autocomplete du dialog
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
    where: { isActive: true },
    orderBy: { firstName: "asc" },
  });

  // Conteneurs actifs pour le dialog
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
    where: { status: { in: ["PREPARATION", "LOADED", "IN_TRANSIT"] } },
    orderBy: { createdAt: "desc" },
  });

  return { shipments, clients, containers };
}

export default async function ShipmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  if (!["ADMIN", "STAFF", "AGENT"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const { shipments, clients, containers } = await getShipmentsData(session);

  return (
    <PageContainer>
      <PageTitle title="Expéditions" />
      <PageHeader breadcrumbs={[{ label: "Accueil", href: "/admin/dashboard" }, { label: "Expéditions" }]} />
      <PageBody>
        <ShipmentsTable
          initialShipments={shipments}
          initialClients={clients}
          initialContainers={containers}
        />
      </PageBody>
    </PageContainer>
  );
}

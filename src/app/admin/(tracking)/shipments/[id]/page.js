// app/admin/shipments/[id]/page.js
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
import { FicheEnvoi } from "@/components/gestion/fiches/fiche-envoi";

async function getShipmentData(id) {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true, clientCode: true, firstName: true, lastName: true,
          phone: true, email: true, city: true, country: true,
          recipientName: true, recipientPhone: true, recipientAddress: true, recipientCity: true,
        },
      },
      container: {
        select: {
          id: true, containerNumber: true, name: true, status: true,
          departureDate: true, arrivalDate: true,
        },
      },
      user: { select: { id: true, firstName: true, lastName: true } },
      packages: {
        include: {
          client: {
            select: {
              id: true, firstName: true, lastName: true,
              recipientCity: true, recipientAddress: true,
            },
          },
          container: { select: { id: true, name: true, containerNumber: true, status: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shipment) return null;

  // Conteneurs actifs (pour réaffecter)
  const containers = await prisma.container.findMany({
    select: {
      id: true, containerNumber: true, name: true, status: true,
      departureDate: true, arrivalDate: true, capacity: true, currentLoad: true,
    },
    where: { status: { in: ["PREPARATION", "LOADED", "IN_TRANSIT"] } },
    orderBy: { createdAt: "desc" },
  });

  // Clients (pour éditer/ajouter colis si besoin)
  const clients = await prisma.client.findMany({
    select: {
      id: true, clientCode: true, firstName: true, lastName: true,
      phone: true, email: true, city: true, country: true,
      recipientName: true, recipientPhone: true, recipientAddress: true, recipientCity: true,
      isActive: true, isVip: true,
    },
    where: { isActive: true },
    orderBy: { firstName: "asc" },
  });

  return { shipment, containers, clients };
}

export default async function ShipmentPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  if (!["ADMIN", "CHEF_CAISSE", "TRACKER", "STAFF", "AGENT"].includes(session.user.role)) redirect("/admin");

  const { id } = await params; // Await params
  const data = await getShipmentData(id);
  if (!data) return notFound();

  return (
    <FicheEnvoi
      shipment={JSON.parse(JSON.stringify(data.shipment))}
      containers={JSON.parse(JSON.stringify(data.containers))}
      clients={JSON.parse(JSON.stringify(data.clients))}
    />
  );
}

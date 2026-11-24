// app/(dashboard)/admin/packages/page.js
export const dynamic = "force-dynamic";

import React from "react";
import { ListeColis } from "@/components/gestion/colis/liste-colis";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";


// Charge uniquement les données nécessaires au dialog (clients + conteneurs actifs).
// Les colis et stats sont chargés côté client via SWR dans PackagesTable.
async function getFormData() {
  const [clients, containers] = await Promise.all([
    prisma.client.findMany({
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
    }),
    prisma.container.findMany({
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
        status: { in: ["PREPARATION", "LOADED", "IN_TRANSIT"] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { clients, containers };
}

export default async function PackagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/signin");

  if (!["ADMIN", "TRACKER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const { clients, containers } = await getFormData();

  return <ListeColis clients={clients} containers={containers} />;
}

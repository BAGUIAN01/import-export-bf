// app/api/shipments/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const clientId = searchParams.get("clientId") || undefined;
    const containerId = searchParams.get("containerId") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;

    const where = {};
    if (clientId) where.clientId = clientId;
    if (containerId) where.containerId = containerId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Un client ne voit que ses propres expéditions
    if (session.user.role === "CLIENT") {
      const me = await prisma.client.findFirst({ where: { userId: session.user.id } });
      if (me) where.clientId = me.id;
    }

    const [data, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        select: {
          id: true,
          shipmentNumber: true,
          createdAt: true,
          updatedAt: true,
          
          // Champs agrégés pour les stats
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
          clientId: true,
          containerId: true,
          
          // Relations
          client: { 
            select: { 
              id: true, 
              clientCode: true, 
              firstName: true, 
              lastName: true 
            } 
          },
          container: { 
            select: { 
              id: true, 
              containerNumber: true, 
              name: true, 
              status: true 
            } 
          },
          user: { 
            select: { 
              id: true, 
              firstName: true, 
              lastName: true 
            } 
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("Erreur GET /api/shipments:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

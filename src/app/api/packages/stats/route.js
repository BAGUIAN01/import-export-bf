
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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

    // Transformation des données
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

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Erreur GET /api/packages/stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

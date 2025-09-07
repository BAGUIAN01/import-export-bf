// app/api/containers/stats/route.js
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

    const [
      total,
      statusCounts,
      packagesInContainers,
    ] = await Promise.all([
      prisma.container.count(),
      prisma.container.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      prisma.container.aggregate({
        _sum: {
          currentLoad: true,
        },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const stats = {
      total,
      inTransit: statusMap.IN_TRANSIT || 0,
      delivered: statusMap.DELIVERED || 0,
      preparation: statusMap.PREPARATION || 0,
      totalPackages: packagesInContainers._sum.currentLoad || 0,
      issues: statusMap.CANCELLED || 0,
      byStatus: statusMap,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Erreur GET /api/containers/stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
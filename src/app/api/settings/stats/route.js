import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Simulation de statistiques système
    // En production, ces données viendraient de vrais capteurs système
    const stats = {
      diskUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
      cpuUsage: Math.floor(Math.random() * 30) + 10, // 10-40%
      databaseSize: '2.4 GB',
      lastBackup: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Dernières 24h
      uptime: '15 jours, 8 heures',
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalRequests: Math.floor(Math.random() * 10000) + 50000,
      errorRate: (Math.random() * 0.5).toFixed(2) + '%',
      responseTime: Math.floor(Math.random() * 100) + 50 + 'ms'
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

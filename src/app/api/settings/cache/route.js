import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Simulation de vidage du cache
    // En production, ceci viderait le cache Redis/Memcached
    console.log('Cache vidé par:', session.user.email)

    return NextResponse.json({
      message: 'Cache vidé avec succès',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erreur lors du vidage du cache:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

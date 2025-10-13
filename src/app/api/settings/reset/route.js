import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Simulation de réinitialisation des paramètres
    // En production, ceci réinitialiserait les paramètres dans la base de données
    console.log('Paramètres réinitialisés par:', session.user.email)

    return NextResponse.json({
      message: 'Paramètres réinitialisés avec succès',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { type } = await request.json()

    // Simulation d'envoi de notification de test
    // En production, ceci enverrait une vraie notification
    const notificationResult = {
      type,
      sent: true,
      timestamp: new Date().toISOString(),
      recipient: session.user.email
    }

    console.log('Notification de test envoyée:', notificationResult)

    return NextResponse.json({
      message: `Notification ${type} de test envoyée avec succès`,
      result: notificationResult
    })
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de test:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

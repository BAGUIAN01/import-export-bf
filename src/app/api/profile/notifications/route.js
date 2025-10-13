import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/profile/notifications - Mettre à jour les paramètres de notification
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, sms, push } = body

    // Validation des données
    const notificationSettings = {}

    if (email !== undefined) {
      if (typeof email !== 'object' || email === null) {
        return NextResponse.json(
          { error: 'Paramètres email invalides' },
          { status: 400 }
        )
      }
      notificationSettings.email = email
    }

    if (sms !== undefined) {
      if (typeof sms !== 'object' || sms === null) {
        return NextResponse.json(
          { error: 'Paramètres SMS invalides' },
          { status: 400 }
        )
      }
      notificationSettings.sms = sms
    }

    if (push !== undefined) {
      if (typeof push !== 'object' || push === null) {
        return NextResponse.json(
          { error: 'Paramètres push invalides' },
          { status: 400 }
        )
      }
      notificationSettings.push = push
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour les paramètres de notification
    // Note: Dans un vrai projet, vous pourriez avoir une table séparée pour les paramètres de notification
    // Pour cet exemple, nous utilisons un champ JSON dans la table User
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        notificationSettings: {
          ...notificationSettings,
          updatedAt: new Date().toISOString()
        }
      }
    })

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_NOTIFICATION_SETTINGS_UPDATED',
        resource: 'user',
        resourceId: session.user.id,
        details: JSON.stringify({
          updatedSettings: Object.keys(notificationSettings),
          timestamp: new Date().toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: 'Paramètres de notification mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

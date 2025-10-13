import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/profile/2fa/disable - Désactiver l'authentification à deux facteurs
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, twoFactorEnabled: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si la 2FA est activée
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'L\'authentification à deux facteurs n\'est pas activée' },
        { status: 400 }
      )
    }

    // Désactiver la 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false }
    })

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_2FA_DISABLED',
        resource: 'user',
        resourceId: session.user.id,
        details: JSON.stringify({
          timestamp: new Date().toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: 'Authentification à deux facteurs désactivée avec succès'
    })
  } catch (error) {
    console.error('Erreur désactivation 2FA:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

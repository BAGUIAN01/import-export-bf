import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'

/**
 * PUT /api/profile/password - Changer le mot de passe de l'utilisateur
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
    const { currentPassword, newPassword } = body

    // Validation des données
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est requis' },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe est requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    if (!user.password) {
      return NextResponse.json(
        { error: 'Aucun mot de passe défini. Veuillez contacter le support.' },
        { status: 400 }
      )
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est incorrect' },
        { status: 400 }
      )
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hash(newPassword, 12)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword }
    })

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_PASSWORD_CHANGED',
        resource: 'user',
        resourceId: session.user.id,
        details: JSON.stringify({
          timestamp: new Date().toISOString(),
          method: 'profile_update'
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: 'Mot de passe mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

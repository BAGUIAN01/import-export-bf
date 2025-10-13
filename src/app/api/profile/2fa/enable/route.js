import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/twilio'
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * POST /api/profile/2fa/enable - Activer l'authentification à deux facteurs
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

    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone est requis' },
        { status: 400 }
      )
    }

    // Validation du numéro de téléphone
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      )
    }

    const parsedPhone = parsePhoneNumberFromString(phone)
    const normalizedPhone = parsedPhone?.number

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Impossible de traiter ce numéro de téléphone' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, phone: true, twoFactorEnabled: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si la 2FA est déjà activée
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'L\'authentification à deux facteurs est déjà activée' },
        { status: 400 }
      )
    }

    // Générer un code de vérification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Supprimer les anciens codes de vérification
    await prisma.phoneVerification.deleteMany({
      where: { phone: normalizedPhone }
    })

    // Créer le nouveau code de vérification
    await prisma.phoneVerification.create({
      data: {
        phone: normalizedPhone,
        code: verificationCode,
        expiresAt: codeExpiresAt,
        verified: false
      }
    })

    // Envoyer le SMS
    const message = `Import Export BF: Votre code de vérification pour activer la 2FA est ${verificationCode}. Valide 10 min. Ne le partagez jamais.`
    
    try {
      await sendSMS(normalizedPhone, message)
    } catch (smsError) {
      console.error('Erreur envoi SMS:', smsError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du SMS' },
        { status: 500 }
      )
    }

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_2FA_ENABLE_REQUESTED',
        resource: 'user',
        resourceId: session.user.id,
        details: JSON.stringify({
          phone: normalizedPhone,
          timestamp: new Date().toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: 'Code de vérification envoyé par SMS',
      phone: normalizedPhone
    })
  } catch (error) {
    console.error('Erreur activation 2FA:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

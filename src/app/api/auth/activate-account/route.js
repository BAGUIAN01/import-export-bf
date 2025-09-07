// app/api/auth/activate-account/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { phone, code } = body

    // Validation des paramètres
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et code requis' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Le code doit contenir 6 chiffres' },
        { status: 400 }
      )
    }

    // Valider et normaliser le numéro
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

    // Vérifier le code SMS
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        phone: normalizedPhone,
        code: code,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!verification) {
      // Incrémenter les tentatives pour rate limiting
      await prisma.phoneVerification.updateMany({
        where: { 
          phone: normalizedPhone,
          verified: false 
        },
        data: {
          attempts: { increment: 1 }
        }
      })
      
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Vérifier le nombre de tentatives
    if (verification.attempts >= 3) {
      return NextResponse.json(
        { error: 'Trop de tentatives incorrectes' },
        { status: 429 }
      )
    }

    // Marquer la vérification comme utilisée
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true }
    })

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Activer l'utilisateur
    const activatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true,
        lastLoginAt: new Date() 
      }
    })

    // Log d'activation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_ACCOUNT_ACTIVATED',
        resource: 'user',
        resourceId: user.id,
        details: JSON.stringify({
          phone: normalizedPhone,
          method: 'sms_verification'
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Nettoyer les codes de vérification utilisés
    await prisma.phoneVerification.deleteMany({
      where: { phone: normalizedPhone }
    })

    return NextResponse.json({
      success: true,
      message: 'Compte activé avec succès',
      user: {
        id: activatedUser.id,
        phone: activatedUser.phone,
        name: `${activatedUser.firstName} ${activatedUser.lastName}`.trim(),
        email: activatedUser.email,
        role: activatedUser.role
      }
    })

  } catch (error) {
    console.error('Erreur activation compte:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
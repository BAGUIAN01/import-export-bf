// app/api/auth/register/route.js
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '../../../../lib/prisma'
import { sendSMS } from '../../../../lib/twilio'
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      address,
      city
    } = body

    // Validation des champs requis
    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: 'Le prénom est requis' },
        { status: 400 }
      )
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone est requis' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Le mot de passe est requis' },
        { status: 400 }
      )
    }

    // Validation du téléphone avec libphonenumber-js
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      )
    }

    // Normaliser le numéro de téléphone au format E.164
    const parsedPhone = parsePhoneNumberFromString(phone)
    const normalizedPhone = parsedPhone?.number

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Impossible de traiter ce numéro de téléphone' },
        { status: 400 }
      )
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Validation de l'email si fourni
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        )
      }
    }

    // Récupérer l'IP du client
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Rate limiting par IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRegistrations = await prisma.auditLog.count({
      where: {
        action: 'USER_REGISTER',
        ipAddress: clientIP,
        createdAt: { gte: oneHourAgo }
      }
    })

    if (recentRegistrations >= 5) {
      return NextResponse.json(
        { error: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.' },
        { status: 429 }
      )
    }

    // Vérifier si l'utilisateur existe déjà (par téléphone ou email)
    const whereConditions = [{ phone: normalizedPhone }]
    if (email && email.trim()) {
      whereConditions.push({ email: email.trim().toLowerCase() })
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: whereConditions
      }
    })

    if (existingUser) {
      if (existingUser.phone === normalizedPhone) {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 409 }
        )
      }
      if (existingUser.email === email?.trim().toLowerCase()) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        )
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 12)

    // Déterminer le pays à partir du numéro ou utiliser celui fourni
    const detectedCountry = parsedPhone?.country
    const finalCountry = getCountryName(detectedCountry || country)

    // Générer le code de vérification SMS
    const verificationCode = generateVerificationCode()
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Créer l'utilisateur et le code de vérification dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          email: email?.trim().toLowerCase() || null,
          password: hashedPassword,
          address: address?.trim() || null,
          city: city?.trim() || null,
          country: finalCountry,
          role: 'CLIENT',
          isActive: false, // Sera activé après vérification SMS
        }
      })

      // Générer un code client unique
      const clientCode = await generateClientCode(tx)
      
      // Créer automatiquement un profil client
      const client = await tx.client.create({
        data: {
          clientCode,
          userId: user.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          email: email?.trim().toLowerCase() || null,
          address: address?.trim() || `${city?.trim() || ''}, ${finalCountry}`.trim().replace(/^,\s*/, ''),
          city: city?.trim() || '',
          country: finalCountry,
          recipientName: '', // À remplir plus tard
          recipientPhone: '',
          recipientAddress: '',
          recipientCity: getDefaultRecipientCity(finalCountry),
        }
      })

      // Supprimer les anciens codes de vérification pour ce numéro
      await tx.phoneVerification.deleteMany({
        where: { phone: normalizedPhone }
      })

      // Créer le code de vérification SMS
      const verification = await tx.phoneVerification.create({
        data: {
          phone: normalizedPhone,
          code: verificationCode,
          expiresAt: codeExpiresAt,
          attempts: 0,
          verified: false
        }
      })

      return { user, client, verification }
    })

    // Envoyer le SMS de vérification
    try {
      const countryName = getCountryName(detectedCountry)
      const smsMessage = `Import Export BF: Votre code de vérification pour créer votre compte est ${verificationCode}. Valide 10 min. Ne le partagez jamais.`
      
      await sendSMS(normalizedPhone, smsMessage)

      // Log de création de compte et envoi SMS
      await prisma.auditLog.create({
        data: {
          userId: result.user.id,
          action: 'USER_REGISTER',
          resource: 'user',
          resourceId: result.user.id,
          details: JSON.stringify({
            phone: normalizedPhone,
            country: finalCountry,
            clientCode: result.client.clientCode,
            smsCodeSent: true
          }),
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

    } catch (smsError) {
      console.error('Erreur lors de l\'envoi SMS:', smsError)
      
      // Supprimer le code de vérification si l'envoi SMS a échoué
      await prisma.phoneVerification.delete({
        where: { id: result.verification.id }
      })

      // Log de l'erreur SMS
      await prisma.auditLog.create({
        data: {
          userId: result.user.id,
          action: 'SMS_SEND_FAILED',
          resource: 'phone_verification',
          details: JSON.stringify({
            phone: normalizedPhone,
            error: smsError.message
          }),
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      return NextResponse.json(
        { 
          error: 'Compte créé mais impossible d\'envoyer le SMS de vérification. Veuillez contacter le support.',
          userId: result.user.id
        },
        { status: 201 } // Compte créé mais problème SMS
      )
    }

    // Retourner les données de l'utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = result.user

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Code de vérification envoyé par SMS.',
      user: {
        ...userWithoutPassword,
        clientCode: result.client.clientCode
      },
      verification: {
        phone: normalizedPhone,
        expiresIn: 600, // 10 minutes en secondes
        codeLength: 6
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target?.includes('phone')) {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 409 }
        )
      }
      if (target?.includes('email')) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors de la création du compte'
      },
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour générer un code client unique
async function generateClientCode(tx = prisma) {
  let clientCode
  let isUnique = false
  let counter = 1
  const year = new Date().getFullYear()

  // Trouver le dernier numéro utilisé pour cette année
  const lastClient = await tx.client.findFirst({
    where: {
      clientCode: {
        startsWith: `CLI${year}`
      }
    },
    orderBy: {
      clientCode: 'desc'
    }
  })

  if (lastClient) {
    const lastNumber = parseInt(lastClient.clientCode.slice(-4))
    counter = lastNumber + 1
  }

  while (!isUnique) {
    clientCode = `CLI${year}${String(counter).padStart(4, '0')}`
    
    const existingClient = await tx.client.findUnique({
      where: { clientCode }
    })
    
    if (!existingClient) {
      isUnique = true
    } else {
      counter++
    }
  }
  
  return clientCode
}

// Fonction pour générer un code de vérification sécurisé
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6 chiffres
}

// Fonction utilitaire pour convertir le code pays en nom
function getCountryName(countryCode) {
  const countries = {
    'FR': 'France',
    'BF': 'Burkina Faso',
    'CI': 'Côte d\'Ivoire',
    'ML': 'Mali',
    'SN': 'Sénégal',
    'NE': 'Niger',
    'TG': 'Togo',
    'BJ': 'Bénin',
    'GH': 'Ghana',
    'GN': 'Guinée'
  }
  return countries[countryCode] || 'Burkina Faso' // Défaut : Burkina Faso
}

// Fonction utilitaire pour déterminer la ville de livraison par défaut
function getDefaultRecipientCity(country) {
  const defaultCities = {
    'France': 'Paris',
    'Burkina Faso': 'Ouagadougou',
    'Côte d\'Ivoire': 'Abidjan',
    'Mali': 'Bamako',
    'Sénégal': 'Dakar',
    'Niger': 'Niamey',
    'Togo': 'Lomé',
    'Bénin': 'Cotonou',
    'Ghana': 'Accra',
    'Guinée': 'Conakry'
  }
  return defaultCities[country] || 'Ouagadougou'
}
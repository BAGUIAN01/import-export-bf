import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * GET /api/profile - Récupérer le profil de l'utilisateur connecté
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        address: true,
        city: true,
        country: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // Ne pas exposer le mot de passe
        password: false,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erreur récupération profil:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile - Mettre à jour le profil de l'utilisateur
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
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country,
      dateOfBirth,
    } = body

    // Validation des données
    const updateData = {}

    if (firstName !== undefined) {
      if (!firstName?.trim()) {
        return NextResponse.json(
          { error: 'Le prénom est requis' },
          { status: 400 }
        )
      }
      updateData.firstName = firstName.trim()
    }

    if (lastName !== undefined) {
      if (!lastName?.trim()) {
        return NextResponse.json(
          { error: 'Le nom est requis' },
          { status: 400 }
        )
      }
      updateData.lastName = lastName.trim()
    }

    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        )
      }
      updateData.email = email?.trim().toLowerCase() || null
    }

    if (phone !== undefined) {
      if (phone && !isValidPhoneNumber(phone)) {
        return NextResponse.json(
          { error: 'Numéro de téléphone invalide' },
          { status: 400 }
        )
      }
      
      if (phone) {
        const parsedPhone = parsePhoneNumberFromString(phone)
        updateData.phone = parsedPhone?.number || phone
      } else {
        updateData.phone = phone
      }
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || null
    }

    if (city !== undefined) {
      updateData.city = city?.trim() || null
    }

    if (country !== undefined) {
      updateData.country = country?.trim() || 'France'
    }

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    }

    // Mettre à jour le nom complet si firstName ou lastName changent
    if (updateData.firstName || updateData.lastName) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true }
      })
      
      const newFirstName = updateData.firstName || currentUser.firstName
      const newLastName = updateData.lastName || currentUser.lastName
      updateData.name = `${newFirstName || ''} ${newLastName || ''}`.trim()
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    // Vérifier l'unicité du téléphone si modifié
    if (updateData.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: updateData.phone,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        address: true,
        city: true,
        country: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      }
    })

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_PROFILE_UPDATED',
        resource: 'user',
        resourceId: session.user.id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData),
          timestamp: new Date().toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profil mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

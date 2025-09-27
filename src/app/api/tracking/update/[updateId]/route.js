// app/api/tracking/update/[updateId]/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Modifier une mise à jour de tracking
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { updateId } = await params
    const body = await request.json()
    const { location, description, isPublic } = body

    if (!location || !description) {
      return NextResponse.json(
        { error: 'Localisation et description requises' },
        { status: 400 }
      )
    }

    // Vérifier que la mise à jour existe
    const existingUpdate = await prisma.trackingUpdate.findUnique({
      where: { id: updateId }
    })

    if (!existingUpdate) {
      return NextResponse.json(
        { error: 'Mise à jour non trouvée' },
        { status: 404 }
      )
    }

    // Modifier la mise à jour
    const updatedTracking = await prisma.trackingUpdate.update({
      where: { id: updateId },
      data: {
        location,
        description,
        isPublic: isPublic ?? true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
          }
        }
      }
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRACKING_UPDATE_MODIFIED',
        resource: 'tracking_update',
        resourceId: updateId,
        details: JSON.stringify({
          location,
          description,
          isPublic,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      trackingUpdate: {
        ...updatedTracking,
        user: {
          name: updatedTracking.user.name || 
                `${updatedTracking.user.firstName} ${updatedTracking.user.lastName}`.trim()
        }
      }
    })

  } catch (error) {
    console.error('Erreur modification tracking:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

// Supprimer une mise à jour de tracking
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { updateId } = await params

    // Vérifier que la mise à jour existe
    const existingUpdate = await prisma.trackingUpdate.findUnique({
      where: { id: updateId }
    })

    if (!existingUpdate) {
      return NextResponse.json(
        { error: 'Mise à jour non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la mise à jour
    await prisma.trackingUpdate.delete({
      where: { id: updateId }
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRACKING_UPDATE_DELETED',
        resource: 'tracking_update',
        resourceId: updateId,
        details: JSON.stringify({
          location: existingUpdate.location,
          description: existingUpdate.description,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mise à jour supprimée'
    })

  } catch (error) {
    console.error('Erreur suppression tracking:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
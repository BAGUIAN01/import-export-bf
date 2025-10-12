import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    
    // Récupérer le conteneur avec la date de départ la plus proche
    const nextContainer = await prisma.container.findFirst({
      where: {
        departureDate: {
          gte: now // Date de départ >= maintenant
        },
        status: {
          in: ['PREPARATION', 'LOADED']
        }
      },
      orderBy: {
        departureDate: 'asc' // Le plus proche en premier
      },
      select: {
        id: true,
        containerNumber: true,
        name: true,
        departureDate: true,
        destination: true,
        origin: true,
        status: true,
        _count: {
          select: {
            packages: true
          }
        }
      }
    })

    if (!nextContainer) {
      return NextResponse.json({
        hasNextDeparture: false,
        message: 'Aucun départ programmé'
      })
    }

    // Formater la date pour l'affichage
    const departureDate = new Date(nextContainer.departureDate)
    const formattedDate = {
      full: departureDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      short: departureDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      iso: departureDate.toISOString().split('T')[0],
      timeUntil: calculateTimeUntil(departureDate)
    }

    return NextResponse.json({
      hasNextDeparture: true,
      container: {
        id: nextContainer.id,
        containerNumber: nextContainer.containerNumber,
        name: nextContainer.name,
        origin: nextContainer.origin,
        destination: nextContainer.destination,
        status: nextContainer.status,
        packagesCount: nextContainer._count.packages
      },
      departure: {
        date: nextContainer.departureDate,
        formatted: formattedDate
      }
    })

  } catch (error) {
    console.error('Erreur récupération prochain départ:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du prochain départ' },
      { status: 500 }
    )
  }
}

function calculateTimeUntil(targetDate) {
  const now = new Date()
  const difference = targetDate.getTime() - now.getTime()
  
  if (difference <= 0) {
    return { expired: true, text: 'Départ imminent' }
  }
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return { 
      days, 
      hours, 
      text: days === 1 ? '1 jour' : `${days} jours` 
    }
  } else if (hours > 0) {
    return { 
      hours, 
      text: hours === 1 ? '1 heure' : `${hours} heures` 
    }
  } else {
    return { text: 'Départ imminent' }
  }
}

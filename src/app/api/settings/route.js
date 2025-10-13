import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Simulation de données de paramètres (en production, ceci viendrait de la base de données)
const defaultSettings = {
  general: {
    companyName: 'Import Export BF',
    companyEmail: 'contact@import-export-bf.com',
    companyPhone: '+226 25 30 60 70',
    companyAddress: 'Ouagadougou, Burkina Faso',
    timezone: 'Africa/Ouagadougou',
    language: 'fr',
    currency: 'XOF',
    autoSave: true,
    showWelcomeMessage: true,
    enableAnalytics: false,
    maintenanceMode: false
  },
  notifications: {
    email: {
      enabled: true,
      newShipment: true,
      paymentReceived: true,
      packageDelivered: true,
      systemAlerts: true,
      frequency: 'immediate'
    },
    sms: {
      enabled: false,
      newShipment: false,
      paymentReceived: true,
      packageDelivered: true,
      systemAlerts: false,
      frequency: 'daily'
    },
    push: {
      enabled: true,
      newShipment: true,
      paymentReceived: true,
      packageDelivered: true,
      systemAlerts: true,
      frequency: 'immediate'
    },
    sound: {
      enabled: true,
      volume: 70
    }
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: false,
    auditLog: true,
    encryption: true
  },
  appearance: {
    theme: 'system',
    primaryColor: 'blue',
    fontSize: 'medium',
    density: 'comfortable',
    sidebarCollapsed: false,
    showAnimations: true,
    showTooltips: true,
    compactMode: false
  },
  system: {
    autoBackup: true,
    backupFrequency: 'daily',
    logRetention: 30,
    cacheEnabled: true,
    maintenanceMode: false,
    debugMode: false,
    performanceMode: false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // En production, récupérer les paramètres depuis la base de données
    // const settings = await prisma.settings.findFirst({
    //   where: { userId: session.user.id }
    // })

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const settings = await request.json()

    // En production, sauvegarder dans la base de données
    // await prisma.settings.upsert({
    //   where: { userId: session.user.id },
    //   update: settings,
    //   create: {
    //     userId: session.user.id,
    //     ...settings
    //   }
    // })

    console.log('Paramètres mis à jour:', settings)

    return NextResponse.json({ 
      message: 'Paramètres sauvegardés avec succès',
      settings 
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

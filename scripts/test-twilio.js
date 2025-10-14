// Script de test pour vérifier la configuration Twilio
import { validateTwilioConfig, sendSMS } from '../src/lib/twilio.js'

async function testTwilio() {
  console.log('🧪 Test de la configuration Twilio...\n')
  
  try {
    // 1. Vérifier la configuration
    console.log('1️⃣ Vérification de la configuration...')
    const isValid = await validateTwilioConfig()
    
    if (!isValid) {
      console.log('❌ Configuration Twilio invalide')
      console.log('\n📋 Variables d\'environnement requises:')
      console.log('- TWILIO_ACCOUNT_SID')
      console.log('- TWILIO_AUTH_TOKEN') 
      console.log('- TWILIO_PHONE_NUMBER')
      console.log('\n💡 Ajoutez ces variables à votre fichier .env.local')
      return
    }
    
    console.log('✅ Configuration Twilio valide\n')
    
    // 2. Test d'envoi de SMS (simulation en dev)
    console.log('2️⃣ Test d\'envoi de SMS...')
    
    const testPhone = '+33123456789' // Numéro de test
    const testMessage = 'Test SMS IE BF - Configuration OK ✅'
    
    const result = await sendSMS(testPhone, testMessage)
    
    console.log('✅ SMS envoyé avec succès:')
    console.log(`   SID: ${result.sid}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   To: ${result.to}`)
    console.log(`   From: ${result.from}`)
    
    if (result.simulated) {
      console.log('   🎭 Mode simulation activé (développement)')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

// Exécuter le test
testTwilio()

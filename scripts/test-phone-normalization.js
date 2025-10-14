// Script de test pour la normalisation des numéros de téléphone
import { smartNormalizePhone, normalizePhoneNumber, isValidE164Phone, formatPhoneForDisplay } from '../src/lib/utils/phone-normalizer.js'

function testPhoneNormalization() {
  console.log('🧪 Test de normalisation des numéros de téléphone\n')
  
  const testNumbers = [
    // Numéros français
    '07 45 37 12 82',
    '0745371282',
    '07-45-37-12-82',
    '07.45.37.12.82',
    '(07) 45 37 12 82',
    '07 45 37 12 82',
    
    // Numéros internationaux
    '0033 7 45 37 12 82',
    '33745371282',
    '+33 7 45 37 12 82',
    '+33745371282',
    
    // Numéros du Burkina Faso
    '9999999999',
    '8838383883',
    '226999999999',
    '+226999999999',
    '00226999999999',
    
    // Numéros invalides
    '123',
    'abc',
    '',
    null,
    undefined
  ]
  
  console.log('📱 Test avec contexte "burkina" (Burkina Faso):')
  console.log('=' .repeat(60))
  
  testNumbers.forEach(phone => {
    const normalized = smartNormalizePhone(phone, 'burkina')
    const isValid = normalized ? isValidE164Phone(normalized) : false
    const display = normalized ? formatPhoneForDisplay(normalized) : 'INVALIDE'
    
    console.log(`Original: ${phone || 'null'}`)
    console.log(`Normalisé: ${normalized || 'null'}`)
    console.log(`Affichage: ${display}`)
    console.log(`Valide E.164: ${isValid ? '✅' : '❌'}`)
    console.log('-'.repeat(40))
  })
  
  console.log('\n📱 Test avec contexte "france":')
  console.log('=' .repeat(60))
  
  const frenchNumbers = ['07 45 37 12 82', '0745371282', '33745371282']
  
  frenchNumbers.forEach(phone => {
    const normalized = smartNormalizePhone(phone, 'france')
    const isValid = normalized ? isValidE164Phone(normalized) : false
    const display = normalized ? formatPhoneForDisplay(normalized) : 'INVALIDE'
    
    console.log(`Original: ${phone}`)
    console.log(`Normalisé: ${normalized || 'null'}`)
    console.log(`Affichage: ${display}`)
    console.log(`Valide E.164: ${isValid ? '✅' : '❌'}`)
    console.log('-'.repeat(40))
  })
  
  console.log('\n🎯 Test des numéros problématiques du log:')
  console.log('=' .repeat(60))
  
  const problematicNumbers = [
    '07 45 37 12 82',
    '9999999999', 
    '8838383883'
  ]
  
  problematicNumbers.forEach(phone => {
    const normalized = smartNormalizePhone(phone, 'burkina')
    const isValid = normalized ? isValidE164Phone(normalized) : false
    
    console.log(`❌ Problématique: ${phone}`)
    console.log(`✅ Normalisé: ${normalized || 'INVALIDE'}`)
    console.log(`✅ Valide E.164: ${isValid ? 'OUI' : 'NON'}`)
    console.log('-'.repeat(40))
  })
}

// Exécuter le test
testPhoneNormalization()

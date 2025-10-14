/**
 * Utilitaires pour la normalisation des numéros de téléphone
 */

/**
 * Normalise un numéro de téléphone au format E.164
 * @param {string} phone - Numéro de téléphone à normaliser
 * @param {string} defaultCountryCode - Code pays par défaut (ex: '33' pour la France)
 * @returns {string|null} - Numéro au format E.164 ou null si invalide
 */
export function normalizePhoneNumber(phone, defaultCountryCode = '33') {
  if (!phone || typeof phone !== 'string') {
    return null
  }

  // Supprimer tous les espaces, tirets, points et parenthèses
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  
  // Supprimer le préfixe "00" s'il existe
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2)
  }
  
  // Si le numéro commence déjà par +, le retourner tel quel
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // Gestion des numéros français (commençant par 0)
  if (cleaned.startsWith('0')) {
    // Remplacer le 0 initial par le code pays approprié
    cleaned = '+' + defaultCountryCode + cleaned.substring(1)
    return cleaned
  }
  
  // Si le numéro commence par le code pays sans le +
  if (cleaned.startsWith(defaultCountryCode)) {
    return '+' + cleaned
  }
  
  // Si c'est un numéro local (sans code pays), ajouter le code pays par défaut
  if (cleaned.length >= 9 && cleaned.length <= 15) {
    return '+' + defaultCountryCode + cleaned
  }
  
  return null
}

/**
 * Valide si un numéro de téléphone est au format E.164
 * @param {string} phone - Numéro à valider
 * @returns {boolean} - True si valide
 */
export function isValidE164Phone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  // Format E.164: + suivi de 1 à 15 chiffres
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param {string} phone - Numéro au format E.164
 * @returns {string} - Numéro formaté pour l'affichage
 */
export function formatPhoneForDisplay(phone) {
  if (!phone || !isValidE164Phone(phone)) {
    return phone || ''
  }
  
  // Format français: +33 1 23 45 67 89
  if (phone.startsWith('+33')) {
    const number = phone.substring(3)
    if (number.length === 9) {
      return `+33 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`
    }
  }
  
  // Format international générique: +XX XXX XXX XXXX
  if (phone.length > 4) {
    const countryCode = phone.substring(0, 3)
    const number = phone.substring(3)
    
    if (number.length <= 10) {
      return `${countryCode} ${number.substring(0, 3)} ${number.substring(3)}`
    }
  }
  
  return phone
}

/**
 * Extrait le code pays d'un numéro E.164
 * @param {string} phone - Numéro au format E.164
 * @returns {string|null} - Code pays ou null
 */
export function getCountryCode(phone) {
  if (!isValidE164Phone(phone)) {
    return null
  }
  
  // Codes pays courants
  const countryCodes = {
    '1': 'US/CA',
    '33': 'FR',
    '32': 'BE',
    '41': 'CH',
    '44': 'GB',
    '49': 'DE',
    '39': 'IT',
    '34': 'ES',
    '31': 'NL',
    '226': 'BF', // Burkina Faso
    '225': 'CI', // Côte d'Ivoire
    '221': 'SN', // Sénégal
    '223': 'ML', // Mali
    '227': 'NE', // Niger
    '228': 'TG', // Togo
    '229': 'BJ', // Bénin
    '230': 'MU', // Maurice
    '231': 'LR', // Liberia
    '232': 'SL', // Sierra Leone
    '233': 'GH', // Ghana
    '234': 'NG', // Nigeria
    '235': 'TD', // Tchad
    '236': 'CF', // République centrafricaine
    '237': 'CM', // Cameroun
    '238': 'CV', // Cap-Vert
    '239': 'ST', // Sao Tomé-et-Principe
    '240': 'GQ', // Guinée équatoriale
    '241': 'GA', // Gabon
    '242': 'CG', // Congo
    '243': 'CD', // République démocratique du Congo
    '244': 'AO', // Angola
    '245': 'GW', // Guinée-Bissau
    '246': 'IO', // Territoire britannique de l'océan Indien
    '247': 'AC', // Ascension
    '248': 'SC', // Seychelles
    '249': 'SD', // Soudan
    '250': 'RW', // Rwanda
    '251': 'ET', // Éthiopie
    '252': 'SO', // Somalie
    '253': 'DJ', // Djibouti
    '254': 'KE', // Kenya
    '255': 'TZ', // Tanzanie
    '256': 'UG', // Ouganda
    '257': 'BI', // Burundi
    '258': 'MZ', // Mozambique
    '260': 'ZM', // Zambie
    '261': 'MG', // Madagascar
    '262': 'RE', // La Réunion
    '263': 'ZW', // Zimbabwe
    '264': 'NA', // Namibie
    '265': 'MW', // Malawi
    '266': 'LS', // Lesotho
    '267': 'BW', // Botswana
    '268': 'SZ', // Eswatini
    '269': 'KM', // Comores
    '290': 'SH', // Sainte-Hélène
    '291': 'ER', // Érythrée
    '297': 'AW', // Aruba
    '298': 'FO', // Îles Féroé
    '299': 'GL', // Groenland
  }
  
  // Essayer de trouver le code pays
  for (let i = 1; i <= 3; i++) {
    const code = phone.substring(1, 1 + i)
    if (countryCodes[code]) {
      return code
    }
  }
  
  return null
}

/**
 * Normalise un numéro de téléphone avec gestion intelligente du code pays
 * @param {string} phone - Numéro à normaliser
 * @param {string} context - Contexte (ex: 'france', 'burkina', 'international')
 * @returns {string|null} - Numéro normalisé ou null
 */
export function smartNormalizePhone(phone, context = 'france') {
  if (!phone) return null
  
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  
  // Si déjà au format E.164, le retourner
  if (isValidE164Phone(cleaned)) {
    return cleaned
  }
  
  // Déterminer le code pays par défaut selon le contexte
  let defaultCountryCode = '33' // France par défaut
  
  switch (context.toLowerCase()) {
    case 'burkina':
    case 'burkina_faso':
      defaultCountryCode = '226'
      break
    case 'cote_ivoire':
    case 'ivory_coast':
      defaultCountryCode = '225'
      break
    case 'senegal':
      defaultCountryCode = '221'
      break
    case 'mali':
      defaultCountryCode = '223'
      break
    case 'niger':
      defaultCountryCode = '227'
      break
    case 'togo':
      defaultCountryCode = '228'
      break
    case 'benin':
      defaultCountryCode = '229'
      break
    case 'ghana':
      defaultCountryCode = '233'
      break
    case 'nigeria':
      defaultCountryCode = '234'
      break
    case 'france':
    default:
      defaultCountryCode = '33'
      break
  }
  
  return normalizePhoneNumber(phone, defaultCountryCode)
}

// Export par défaut
export default {
  normalizePhoneNumber,
  isValidE164Phone,
  formatPhoneForDisplay,
  getCountryCode,
  smartNormalizePhone
}

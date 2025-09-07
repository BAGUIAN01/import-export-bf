// lib/utils/phone.js - Utilitaires pour les numéros de téléphone
class PhoneUtils {
  // Codes pays supportés
  static countryCodes = {
    // France
    FR: { code: '+33', regex: /^(\+33|0)[1-9](\d{8})$/, name: 'France' },
    
    // Afrique de l'Ouest
    BF: { code: '+226', regex: /^(\+226|0)?[0-9]{8}$/, name: 'Burkina Faso' },
    ML: { code: '+223', regex: /^(\+223|0)?[0-9]{8}$/, name: 'Mali' },
    SN: { code: '+221', regex: /^(\+221|0)?[0-9]{9}$/, name: 'Sénégal' },
    CI: { code: '+225', regex: /^(\+225|0)?[0-9]{8,10}$/, name: 'Côte d\'Ivoire' },
    GH: { code: '+233', regex: /^(\+233|0)?[0-9]{9}$/, name: 'Ghana' },
    NG: { code: '+234', regex: /^(\+234|0)?[0-9]{10}$/, name: 'Nigeria' },
    TG: { code: '+228', regex: /^(\+228|0)?[0-9]{8}$/, name: 'Togo' },
    BJ: { code: '+229', regex: /^(\+229|0)?[0-9]{8}$/, name: 'Bénin' },
    GN: { code: '+224', regex: /^(\+224|0)?[0-9]{9}$/, name: 'Guinée' },
    GW: { code: '+245', regex: /^(\+245|0)?[0-9]{7}$/, name: 'Guinée-Bissau' },
    LR: { code: '+231', regex: /^(\+231|0)?[0-9]{7,8}$/, name: 'Liberia' },
    SL: { code: '+232', regex: /^(\+232|0)?[0-9]{8}$/, name: 'Sierra Leone' },
    MR: { code: '+222', regex: /^(\+222|0)?[0-9]{8}$/, name: 'Mauritanie' },
    NE: { code: '+227', regex: /^(\+227|0)?[0-9]{8}$/, name: 'Niger' },
    GM: { code: '+220', regex: /^(\+220|0)?[0-9]{7}$/, name: 'Gambie' }
  }

  /**
   * Détecter le pays d'un numéro de téléphone
   */
  static detectCountry(phone) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    for (const [countryCode, config] of Object.entries(this.countryCodes)) {
      if (cleanPhone.startsWith(config.code) || 
          (countryCode === 'FR' && cleanPhone.startsWith('0')) ||
          config.regex.test(cleanPhone)) {
        return {
          country: countryCode,
          name: config.name,
          code: config.code,
          detected: true
        }
      }
    }

    return {
      country: null,
      name: 'Inconnu',
      code: null,
      detected: false
    }
  }

  /**
   * Valider un numéro de téléphone
   */
  static validate(phone, expectedCountry = null) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    if (!cleanPhone) {
      return { valid: false, error: 'Numéro de téléphone requis' }
    }

    const detected = this.detectCountry(cleanPhone)
    
    if (!detected.detected) {
      return { 
        valid: false, 
        error: 'Format de numéro non reconnu',
        supportedCountries: Object.values(this.countryCodes).map(c => c.name)
      }
    }

    if (expectedCountry && detected.country !== expectedCountry) {
      return { 
        valid: false, 
        error: `Numéro attendu pour ${this.countryCodes[expectedCountry]?.name || expectedCountry}`,
        detected: detected.name
      }
    }

    const config = this.countryCodes[detected.country]
    if (!config.regex.test(cleanPhone)) {
      return { 
        valid: false, 
        error: `Format invalide pour ${detected.name}`,
        example: this.getExample(detected.country)
      }
    }

    return {
      valid: true,
      country: detected.country,
      countryName: detected.name,
      formatted: this.format(cleanPhone, detected.country),
      international: this.toInternational(cleanPhone, detected.country)
    }
  }

  /**
   * Formater un numéro selon son pays
   */
  static format(phone, country = null) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    if (!country) {
      const detected = this.detectCountry(cleanPhone)
      country = detected.country
    }

    if (!country) return cleanPhone

    switch (country) {
      case 'FR':
        if (cleanPhone.startsWith('+33')) {
          return cleanPhone.replace('+33', '+33 ').replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
        } else if (cleanPhone.startsWith('0')) {
          return cleanPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
        }
        break
        
      case 'BF':
        if (cleanPhone.startsWith('+226')) {
          return cleanPhone.replace('+226', '+226 ').replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
        }
        break
        
      case 'SN':
        if (cleanPhone.startsWith('+221')) {
          return cleanPhone.replace('+221', '+221 ').replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')
        }
        break
        
      default:
        const config = this.countryCodes[country]
        if (config && cleanPhone.startsWith(config.code)) {
          return cleanPhone.replace(config.code, config.code + ' ')
        }
    }

    return cleanPhone
  }

  /**
   * Convertir en format international
   */
  static toInternational(phone, country = null) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    if (!country) {
      const detected = this.detectCountry(cleanPhone)
      country = detected.country
    }

    if (!country) return cleanPhone

    const config = this.countryCodes[country]
    
    // Déjà en format international
    if (cleanPhone.startsWith('+')) {
      return cleanPhone
    }

    // France : remplacer 0 par +33
    if (country === 'FR' && cleanPhone.startsWith('0')) {
      return '+33' + cleanPhone.slice(1)
    }

    // Autres pays : ajouter le code pays si pas déjà présent
    if (!cleanPhone.startsWith(config.code.slice(1))) {
      return config.code + cleanPhone.replace(/^0+/, '')
    }

    return '+' + cleanPhone
  }

  /**
   * Obtenir un exemple de numéro pour un pays
   */
  static getExample(country) {
    const examples = {
      FR: '06 12 34 56 78',
      BF: '+226 12 34 56 78',
      ML: '+223 12 34 56 78',
      SN: '+221 77 123 45 67',
      CI: '+225 07 12 34 56 78',
      GH: '+233 24 123 4567',
      NG: '+234 80 1234 5678',
      TG: '+228 12 34 56 78',
      BJ: '+229 12 34 56 78',
      GN: '+224 123 45 67 89',
      GW: '+245 123 4567',
      LR: '+231 123 4567',
      SL: '+232 12 34 5678',
      MR: '+222 12 34 56 78',
      NE: '+227 12 34 56 78',
      GM: '+220 123 4567'
    }
    
    return examples[country] || 'Format non défini'
  }

  /**
   * Obtenir la liste des pays supportés
   */
  static getSupportedCountries() {
    return Object.entries(this.countryCodes).map(([code, config]) => ({
      code,
      name: config.name,
      countryCode: config.code,
      example: this.getExample(code)
    }))
  }

  /**
   * Normaliser pour la base de données (format international)
   */
  static normalize(phone) {
    const validation = this.validate(phone)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    return validation.international
  }

  /**
   * Vérifier si un numéro peut recevoir des SMS
   */
  static canReceiveSMS(phone) {
    const validation = this.validate(phone)
    if (!validation.valid) return false

    // Tous les pays supportés peuvent normalement recevoir des SMS
    // Mais on peut ajouter des restrictions spécifiques si nécessaire
    const smsCapableCountries = Object.keys(this.countryCodes)
    return smsCapableCountries.includes(validation.country)
  }
}
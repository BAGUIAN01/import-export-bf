// lib/twilio.js
import twilio from 'twilio'

// Configuration Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

/**
 * Envoie un SMS via Twilio
 * @param {string} to - Numéro de téléphone au format E.164 (+33...)
 * @param {string} message - Message à envoyer
 * @param {object} options - Options supplémentaires
 * @returns {Promise<object>} - Résultat de l'envoi
 */
export async function sendSMS(to, message, options = {}) {
  try {
    // Validation des paramètres
    if (!to || !message) {
      throw new Error('Numéro de téléphone et message requis')
    }

    if (!to.startsWith('+')) {
      throw new Error('Le numéro doit être au format E.164 (+33...)')
    }

    // Vérifier que Twilio est configuré
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Configuration Twilio manquante')
    }

    // Mode simulation en développement
    if (process.env.SIMULATE_SMS_SEND === 'true' && process.env.NODE_ENV === 'development') {
      console.log('🚀 SMS SIMULÉ (dev mode):')
      console.log(`📱 Vers: ${to}`)
      console.log(`💬 Message: ${message}`)
      
      return {
        sid: `SM_simulated_${Date.now()}`,
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: message,
        status: 'delivered',
        dateCreated: new Date(),
        simulated: true
      }
    }

    // Préparer les paramètres du SMS
    const smsParams = {
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      ...options
    }

    // Ajouter des options supplémentaires si fournies
    if (options.statusCallback) {
      smsParams.statusCallback = options.statusCallback
    }

    if (options.validityPeriod) {
      smsParams.validityPeriod = options.validityPeriod
    }

    // Envoyer le SMS
    const result = await client.messages.create(smsParams)
    
    console.log(`✅ SMS envoyé avec succès:`, {
      sid: result.sid,
      to: result.to,
      status: result.status,
      direction: result.direction
    })
    
    return result

  } catch (error) {
    console.error('❌ Erreur envoi SMS:', {
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
      to,
      message: message?.substring(0, 50) + '...'
    })
    
    // Gestion d'erreurs spécifiques Twilio
    if (error.code === 21211) {
      throw new Error('Numéro de téléphone invalide')
    } else if (error.code === 21614) {
      throw new Error('Numéro de téléphone non valide pour ce pays')
    } else if (error.code === 21408) {
      throw new Error('Permission refusée pour ce numéro')
    } else if (error.code === 21610) {
      throw new Error('Message contient des caractères non autorisés')
    } else if (error.code >= 21200 && error.code <= 21299) {
      throw new Error('Erreur de validation Twilio: ' + error.message)
    } else if (error.code >= 21400 && error.code <= 21499) {
      throw new Error('Erreur d\'autorisation Twilio: ' + error.message)
    } else if (error.code >= 21500 && error.code <= 21599) {
      throw new Error('Erreur serveur Twilio: ' + error.message)
    }
    
    throw new Error('Impossible d\'envoyer le SMS: ' + error.message)
  }
}

/**
 * Envoie un message WhatsApp via Twilio
 * @param {string} to - Numéro de téléphone au format E.164
 * @param {string} message - Message à envoyer
 * @param {string|null} templateName - Nom du template WhatsApp approuvé
 * @param {object} options - Options supplémentaires
 * @returns {Promise<object>} - Résultat de l'envoi
 */
export async function sendWhatsAppMessage(to, message, templateName = null, options = {}) {
  try {
    if (!to || !message) {
      throw new Error('Numéro de téléphone et message requis')
    }

    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Numéro WhatsApp Twilio non configuré')
    }

    // Mode simulation en développement
    if (process.env.SIMULATE_SMS_SEND === 'true' && process.env.NODE_ENV === 'development') {
      console.log('🚀 WHATSAPP SIMULÉ (dev mode):')
      console.log(`📱 Vers: ${to}`)
      console.log(`💬 Message: ${message}`)
      console.log(`📋 Template: ${templateName || 'Aucun'}`)
      
      return {
        sid: `WA_simulated_${Date.now()}`,
        to: `whatsapp:${to}`,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        body: message,
        status: 'delivered',
        dateCreated: new Date(),
        simulated: true
      }
    }

    const messageData = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      ...options
    }

    if (templateName) {
      // Utiliser un template WhatsApp approuvé
      messageData.contentSid = templateName
    } else {
      messageData.body = message
    }

    const result = await client.messages.create(messageData)
    
    console.log(`✅ WhatsApp envoyé avec succès:`, {
      sid: result.sid,
      to: result.to,
      status: result.status
    })
    
    return result

  } catch (error) {
    console.error('❌ Erreur envoi WhatsApp:', error)
    throw new Error('Impossible d\'envoyer le message WhatsApp: ' + error.message)
  }
}

/**
 * Vérifie le statut d'un message envoyé
 * @param {string} messageSid - SID du message Twilio
 * @returns {Promise<object>} - Statut du message
 */
export async function getMessageStatus(messageSid) {
  try {
    if (!messageSid) {
      throw new Error('SID du message requis')
    }

    const message = await client.messages(messageSid).fetch()
    
    return {
      sid: message.sid,
      status: message.status,
      direction: message.direction,
      to: message.to,
      from: message.from,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
      priceUnit: message.priceUnit
    }

  } catch (error) {
    console.error('❌ Erreur récupération statut message:', error)
    throw new Error('Impossible de récupérer le statut du message: ' + error.message)
  }
}

/**
 * Récupère la liste des messages envoyés
 * @param {object} filters - Filtres de recherche
 * @returns {Promise<Array>} - Liste des messages
 */
export async function getMessages(filters = {}) {
  try {
    const options = {
      limit: filters.limit || 20,
      ...filters
    }

    if (filters.dateSentAfter) {
      options.dateSentAfter = new Date(filters.dateSentAfter)
    }

    if (filters.dateSentBefore) {
      options.dateSentBefore = new Date(filters.dateSentBefore)
    }

    const messages = await client.messages.list(options)
    
    return messages.map(message => ({
      sid: message.sid,
      status: message.status,
      direction: message.direction,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
      priceUnit: message.priceUnit
    }))

  } catch (error) {
    console.error('❌ Erreur récupération messages:', error)
    throw new Error('Impossible de récupérer les messages: ' + error.message)
  }
}

/**
 * Valide la configuration Twilio
 * @returns {Promise<boolean>} - True si la configuration est valide
 */
export async function validateTwilioConfig() {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Identifiants Twilio manquants')
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Numéro de téléphone Twilio manquant')
    }

    // Tester la connexion en récupérant le compte
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
    
    console.log('✅ Configuration Twilio valide:', {
      accountSid: account.sid,
      friendlyName: account.friendlyName,
      status: account.status
    })
    
    return true

  } catch (error) {
    console.error('❌ Configuration Twilio invalide:', error.message)
    return false
  }
}

/**
 * Formatters pour les messages SMS
 */
export const MessageTemplates = {
  // Code de vérification pour inscription
  verificationCode: (code, appName = "Naange Envoi") =>
    `${appName}: Votre code de vérification est ${code}. Valide 10 min. Ne le partagez jamais.`,

  // Code de connexion
  loginCode: (code, appName = "Naange Envoi") =>
    `${appName}: Votre code de connexion est ${code}. Valide 10 min. Ne le partagez jamais.`,

  // Notification de colis
  packageUpdate: (packageNumber, status, appName = "Naange Envoi") =>
    `${appName}: Votre colis ${packageNumber} est maintenant ${status}. Consultez l'app pour plus de détails.`,

  // Notification de livraison
  deliveryNotification: (packageNumber, appName = "Naange Envoi") =>
    `${appName}: Votre colis ${packageNumber} est arrivé et prêt pour la livraison. Contactez-nous pour organiser la réception.`,

  // Message de bienvenue
  welcome: (firstName, appName = "Naange Envoi") =>
    `Bienvenue ${firstName} ! Votre compte ${appName} est activé. Vous pouvez maintenant enregistrer vos colis.`
}

// Export par défaut
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  sendSMS,
  sendWhatsAppMessage,
  getMessageStatus,
  getMessages,
  validateTwilioConfig,
  MessageTemplates
}
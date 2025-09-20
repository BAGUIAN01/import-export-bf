/**
 * Calcule le total d'un colis en additionnant tous les frais
 * @param {Object} form// PackageDialogUtils.js - Fonctions utilitaires pour le PackageDialog

/**
 * Normalise les entrées de date provenant de différentes sources
 * @param {*} value - La valeur de date à normaliser
 * @returns {string} Date au format YYYY-MM-DD ou chaîne vide si invalide
 */
export function normalizeDateInput(value) {
  if (!value) return "";
  if (typeof value === "string") return value.includes("T") ? value.split("T")[0] : value;
  if (typeof value === "object" && typeof value.toDate === "function") {
    try { return value.toDate().toISOString().split("T")[0]; } catch { return ""; }
  }
  if (value && typeof value === "object" && "seconds" in value) {
    try {
      const ms = value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
      return new Date(ms).toISOString().split("T")[0];
    } catch { return ""; }
  }
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {}
  return "";
}

/**
 * Calcule le total d'un colis en additionnant tous les frais
 * @param {Object} form - Le formulaire contenant les prix et types sélectionnés
 * @returns {number} Le total calculé
 */
export const getTotal = (form) => {
  // Calculer le prix de base à partir des types sélectionnés
  let basePrice = 0;
  
  if (form.selectedTypes && Array.isArray(form.selectedTypes)) {
    // Nouveau format avec types multiples
    basePrice = form.selectedTypes.reduce((sum, item) => {
      const itemTotal = item.isQuoteOnly ? 0 : (item.unitPrice || 0) * (item.quantity || 1);
      return sum + itemTotal;
    }, 0);
  } else if (form.basePrice !== undefined) {
    // Format legacy avec basePrice direct
    basePrice = Number(form.basePrice || 0);
  }

  return Math.max(
    0,
    basePrice +
      Number(form.pickupFee || 0) +
      Number(form.insuranceFee || 0) +
      Number(form.customsFee || 0) -
      Number(form.discount || 0)
  );
};

/**
 * Détermine le statut de paiement basé sur le montant total et le montant payé
 * @param {number} totalAmount - Le montant total à payer
 * @param {number} paidAmount - Le montant déjà payé
 * @returns {string} Le statut de paiement ('PENDING', 'PARTIAL', 'PAID')
 */
export const derivePaymentStatus = (totalAmount, paidAmount) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);
  
  if (paid <= 0) return "PENDING";
  if (paid < total) return "PARTIAL";
  return "PAID";
};

/**
 * Valide un formulaire de colis
 * @param {Object} form - Le formulaire à valider
 * @returns {Object} Un objet contenant les erreurs de validation
 */
export const validatePackageForm = (form) => {
  const errors = {};

  // Validation des types de colis (nouveau format)
  if (!form.selectedTypes || !Array.isArray(form.selectedTypes) || form.selectedTypes.length === 0) {
    errors.selectedTypes = "Au moins un type de colis doit être sélectionné";
  } else {
    // Valider chaque type sélectionné
    form.selectedTypes.forEach((item, index) => {
      if (!item.type) {
        errors.selectedTypes = `Type manquant pour l'article ${index + 1}`;
      }
      if (!item.quantity || item.quantity < 1) {
        errors.selectedTypes = `Quantité invalide pour l'article ${index + 1}`;
      }
    });
  }

  // Validation de la description
  if (!form.description || form.description.trim().length === 0) {
    errors.description = "La description du contenu est requise";
  } else if (form.description.trim().length < 10) {
    errors.description = "La description doit contenir au moins 10 caractères";
  }

  // Validation du poids (optionnel mais si rempli doit être positif)
  if (form.weight && (isNaN(form.weight) || parseFloat(form.weight) <= 0)) {
    errors.weight = "Le poids doit être un nombre positif";
  }

  // Validation de la valeur déclarée (optionnel mais si rempli doit être positif)
  if (form.value && (isNaN(form.value) || parseFloat(form.value) < 0)) {
    errors.value = "La valeur déclarée doit être un nombre positif ou nul";
  }

  return errors;
};

/**
 * Valide les données partagées de l'expédition
 * @param {Object} sharedData - Les données partagées à valider
 * @returns {Object} Un objet contenant les erreurs de validation
 */
export const validateSharedData = (sharedData) => {
  const errors = {};

  // Validation du montant payé
  if (sharedData.paidAmount && (isNaN(sharedData.paidAmount) || sharedData.paidAmount < 0)) {
    errors.paidAmount = "Le montant payé doit être un nombre positif ou nul";
  }

  // Validation de la date de ramassage (si fournie)
  if (sharedData.pickupDate) {
    const pickupDate = new Date(sharedData.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate < today) {
      errors.pickupDate = "La date de ramassage ne peut pas être dans le passé";
    }
  }

  // Validation de la date de paiement (si fournie)
  if (sharedData.paidAt) {
    const paymentDate = new Date(sharedData.paidAt);
    const today = new Date();
    
    if (paymentDate > today) {
      errors.paidAt = "La date de paiement ne peut pas être dans le futur";
    }
  }

  return errors;
};

/**
 * Valide la sélection du client
 * @param {string} selectedClientId - L'ID du client sélectionné
 * @param {Array} clients - La liste des clients disponibles
 * @returns {Object} Un objet contenant les erreurs de validation
 */
export const validateClientSelection = (selectedClientId, clients) => {
  const errors = {};

  if (!selectedClientId) {
    errors.client = "Veuillez sélectionner un client";
  } else {
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) {
      errors.client = "Le client sélectionné n'existe pas";
    } else {
      // Validation des informations du destinataire
      if (!selectedClient.recipientName) {
        errors.recipient = "Le client sélectionné n'a pas de destinataire défini au Burkina Faso";
      }
      if (!selectedClient.recipientPhone) {
        errors.recipient = "Le client sélectionné n'a pas de numéro de téléphone de destinataire";
      }
      if (!selectedClient.recipientAddress) {
        errors.recipient = "Le client sélectionné n'a pas d'adresse de livraison au Burkina Faso";
      }
    }
  }

  return errors;
};

/**
 * Valide l'ensemble de l'expédition avant soumission
 * @param {Object} data - Toutes les données de l'expédition
 * @returns {Object} Un objet contenant toutes les erreurs de validation
 */
export const validateShipment = (data) => {
  const errors = {};

  // Validation du client
  const clientErrors = validateClientSelection(data.selectedClientId, data.clients);
  Object.assign(errors, clientErrors);

  // Validation des colis
  if (!data.packages || data.packages.length === 0) {
    errors.packages = "Au moins un colis est requis";
  } else {
    data.packages.forEach((pkg, index) => {
      const packageErrors = validatePackageForm(pkg);
      if (Object.keys(packageErrors).length > 0) {
        errors[`package_${index}`] = packageErrors;
      }
    });
  }

  // Validation des données partagées
  const sharedDataErrors = validateSharedData(data.sharedData);
  Object.assign(errors, sharedDataErrors);

  return errors;
};

/**
 * Formate un montant en euros
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté avec 2 décimales et le symbole €
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Formate une date au format français
 * @param {string|Date} date - La date à formater
 * @returns {string} La date formatée
 */
export const formatDate = (date) => {
  if (!date) return "";
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Génère un numéro de suivi unique
 * @param {string} prefix - Le préfixe du numéro (ex: "BF", "FR")
 * @returns {string} Un numéro de suivi unique
 */
export const generateTrackingNumber = (prefix = "BF") => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

/**
 * Calcule le poids total d'une expédition
 * @param {Array} packages - Liste des colis
 * @returns {number} Le poids total en kg
 */
export const calculateTotalWeight = (packages) => {
  return packages.reduce((total, pkg) => {
    const weight = parseFloat(pkg.weight) || 0;
    
    // Calculer la quantité totale selon le format
    let totalQuantity = 1;
    if (pkg.selectedTypes && Array.isArray(pkg.selectedTypes)) {
      totalQuantity = pkg.selectedTypes.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } else if (pkg.quantity) {
      totalQuantity = parseInt(pkg.quantity) || 1;
    }
    
    return total + (weight * totalQuantity);
  }, 0);
};

/**
 * Calcule la valeur déclarée totale d'une expédition
 * @param {Array} packages - Liste des colis
 * @returns {number} La valeur déclarée totale en euros
 */
export const calculateTotalDeclaredValue = (packages) => {
  return packages.reduce((total, pkg) => {
    const value = parseFloat(pkg.value) || 0;
    
    // Calculer la quantité totale selon le format
    let totalQuantity = 1;
    if (pkg.selectedTypes && Array.isArray(pkg.selectedTypes)) {
      totalQuantity = pkg.selectedTypes.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } else if (pkg.quantity) {
      totalQuantity = parseInt(pkg.quantity) || 1;
    }
    
    return total + (value * totalQuantity);
  }, 0);
};

/**
 * Détermine si une expédition contient des articles fragiles
 * @param {Array} packages - Liste des colis
 * @returns {boolean} True si au moins un colis est fragile
 */
export const hasFragileItems = (packages) => {
  return packages.some(pkg => pkg.isFragile === true);
};

/**
 * Détermine la priorité maximale d'une expédition
 * @param {Array} packages - Liste des colis
 * @returns {string} La priorité la plus élevée ('URGENT', 'HIGH', 'NORMAL', 'LOW')
 */
export const getMaxPriority = (packages) => {
  const priorityOrder = {
    'URGENT': 4,
    'HIGH': 3,
    'NORMAL': 2,
    'LOW': 1
  };

  let maxPriority = 'LOW';
  let maxPriorityValue = 0;

  packages.forEach(pkg => {
    const priority = pkg.priority || 'NORMAL';
    const priorityValue = priorityOrder[priority] || 2;
    
    if (priorityValue > maxPriorityValue) {
      maxPriorityValue = priorityValue;
      maxPriority = priority;
    }
  });

  return maxPriority;
};

/**
 * Nettoie et normalise une chaîne de caractères
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} La chaîne nettoyée
 */
export const cleanString = (str) => {
  if (!str) return "";
  return str.toString().trim().replace(/\s+/g, ' ');
};

/**
 * Crée un objet colis par défaut
 * @returns {Object} Un objet colis avec les valeurs par défaut
 */
export const createDefaultPackage = () => ({
  selectedTypes: [], // Nouveau format pour types multiples
  description: "",
  weight: "",
  value: "",
  priority: "NORMAL",
  isFragile: false,
  isInsured: false,
  pickupFee: 0,
  insuranceFee: 0,
  customsFee: 0,
  discount: 0,
});

/**
 * Crée un objet de données partagées par défaut
 * @returns {Object} Un objet de données partagées avec les valeurs par défaut
 */
export const createDefaultSharedData = () => ({
  pickupAddress: "",
  pickupDate: "",
  pickupTime: "",
  specialInstructions: "",
  paidAmount: 0,
  paymentMethod: "",
  paidAt: "",
});
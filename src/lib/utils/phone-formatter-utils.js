// Utilitaires pour le formatage des numéros de téléphone

const PHONE_FORMATS = {
  "France": {
    prefix: "+33",
    placeholder: "+33 1 23 45 67 89",
    pattern: /^(\+33\s?)?([0-9\s]{10,14})$/,
    format: (value) => {
      // Nettoyer le numéro
      let cleaned = value.replace(/[^\d]/g, '');
      
      // Si commence par 0, le retirer pour la France
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      
      // Ajouter le préfixe +33
      if (!value.startsWith('+33')) {
        cleaned = '+33 ' + cleaned;
      } else {
        cleaned = '+33 ' + cleaned;
      }
      
      // Formatter en groupes
      const match = cleaned.match(/^(\+33)\s?(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`;
      }
      
      return cleaned;
    },
    validate: (value) => {
      const cleaned = value.replace(/[^\d]/g, '');
      return cleaned.length >= 9 && cleaned.length <= 10;
    }
  },
  "Burkina Faso": {
    prefix: "+226",
    placeholder: "+226 70 12 34 56",
    pattern: /^(\+226\s?)?([0-9\s]{8,12})$/,
    format: (value) => {
      // Nettoyer le numéro
      let cleaned = value.replace(/[^\d]/g, '');
      
      // Ajouter le préfixe +226 si pas présent
      if (!value.startsWith('+226')) {
        cleaned = '+226 ' + cleaned;
      } else {
        cleaned = '+226 ' + cleaned;
      }
      
      // Formatter en groupes pour Burkina Faso (8 chiffres)
      const match = cleaned.match(/^(\+226)\s?(\d{2})(\d{2})(\d{2})(\d{2})$/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
      }
      
      return cleaned;
    },
    validate: (value) => {
      const cleaned = value.replace(/[^\d]/g, '');
      return cleaned.length === 8;
    }
  }
};

export const formatPhoneNumber = (value, country) => {
  if (!value || !country || !PHONE_FORMATS[country]) {
    return value;
  }
  
  const formatter = PHONE_FORMATS[country];
  
  // Si le champ est vide, retourner vide
  if (!value.trim()) {
    return '';
  }
  
  // Si l'utilisateur efface tout, permettre le vide
  if (value.length < formatter.prefix.length) {
    return value;
  }
  
  return formatter.format(value);
};

export const validatePhoneNumber = (value, country) => {
  if (!value || !country || !PHONE_FORMATS[country]) {
    return false;
  }
  
  const formatter = PHONE_FORMATS[country];
  return formatter.validate(value);
};

export const getPhonePlaceholder = (country) => {
  if (!country || !PHONE_FORMATS[country]) {
    return "Numéro de téléphone";
  }
  
  return PHONE_FORMATS[country].placeholder;
};

export const getPhonePrefix = (country) => {
  if (!country || !PHONE_FORMATS[country]) {
    return "";
  }
  
  return PHONE_FORMATS[country].prefix;
};
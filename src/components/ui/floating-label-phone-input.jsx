"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"

// Fonction pour formater le numéro de téléphone burkinabé
const formatPhoneNumber = (value) => {
  if (!value) return "";
  
  // Retirer tous les caractères non numériques sauf le +
  let cleaned = value.replace(/[^\d+]/g, "");
  
  // Si ça commence par +226, on garde tel quel et on formate le reste
  if (cleaned.startsWith("+226")) {
    cleaned = cleaned.substring(4); // Enlever +226
    cleaned = cleaned.replace(/\D/g, ""); // Garder seulement les chiffres
    // Limiter strictement à 8 chiffres (format standard burkinabé)
    cleaned = cleaned.substring(0, 8);
    // Format: XX XX XX XX (8 chiffres avec espaces)
    if (cleaned.length > 0) {
      const match = cleaned.match(/.{1,2}/g);
      return match ? "+226 " + match.join(" ") : "+226 " + cleaned;
    }
    return "+226 ";
  } else if (cleaned.startsWith("226")) {
    // Si ça commence par 226 sans le +
    cleaned = cleaned.substring(3);
    cleaned = cleaned.replace(/\D/g, "");
    cleaned = cleaned.substring(0, 8); // Limiter à 8 chiffres
    if (cleaned.length > 0) {
      const match = cleaned.match(/.{1,2}/g);
      return match ? "+226 " + match.join(" ") : "+226 " + cleaned;
    }
    return "+226 ";
  } else {
    // Si ça ne commence pas par +226 ou 226, on ajoute +226
    cleaned = cleaned.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    
    // Limiter strictement à 8 chiffres (format standard burkinabé)
    cleaned = cleaned.substring(0, 8);
    
    if (cleaned.length > 0) {
      const match = cleaned.match(/.{1,2}/g);
      return match ? "+226 " + match.join(" ") : "+226 " + cleaned;
    }
    return "+226 ";
  }
};

// Fonction pour nettoyer le numéro (enlever les espaces et garder seulement +226XXXXXXXX)
const cleanPhoneNumber = (value) => {
  if (!value) return null;
  // Garder +226 et les chiffres suivants, enlever les espaces
  const cleaned = value.replace(/\s/g, "");
  return cleaned || null;
};

const FloatingLabelPhoneInput = React.forwardRef(
  ({ className, label, id, value, error, onChange, onBlur, disabled, placeholder = "+226 XX XX XX XX", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      return value ? formatPhoneNumber(value) : "";
    });

    React.useEffect(() => {
      if (value) {
        const formatted = formatPhoneNumber(value);
        setDisplayValue(formatted);
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      setDisplayValue(formatted);
      
      // Appeler onChange avec la valeur formatée (pour l'affichage)
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted,
          },
        };
        onChange(syntheticEvent);
      }
    };

    const handleBlur = (e) => {
      // Garder le formatage visible même après le blur
      // La validation utilisera cleanPhoneNumber pour vérifier
      if (onBlur) {
        onBlur(e);
      }
    };

    const handleKeyDown = (e) => {
      // Empêcher la saisie de caractères non numériques (sauf +, backspace, delete, etc.)
      const allowedKeys = [
        "Backspace", "Delete", "Tab", "Escape", "Enter",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End"
      ];
      const isAllowedKey = allowedKeys.includes(e.key);
      const isNumber = /[0-9]/.test(e.key);
      const isPlus = e.key === "+";
      
      if (!isAllowedKey && !isNumber && !isPlus) {
        e.preventDefault();
      }
    };

    return (
      <FloatingLabelInput
        ref={ref}
        id={id}
        label={label}
        type="tel"
        value={displayValue}
        error={error}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    );
  }
);

FloatingLabelPhoneInput.displayName = "FloatingLabelPhoneInput";

export { FloatingLabelPhoneInput, formatPhoneNumber, cleanPhoneNumber };


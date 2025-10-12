"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Phone, CheckCircle, Check, ChevronsUpDown } from "lucide-react";
import {
  AsYouType,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Pays supportés + exemples servant de référence de longueur */
export const COUNTRY_OPTIONS = [
  { iso2: "FR", name: "France",        dial: "+33",  flag: "🇫🇷", sample: "06 12 34 56 78" },    // 10 national
  { iso2: "BF", name: "Burkina Faso",  dial: "+226", flag: "🇧🇫", sample: "70 12 34 56" },       // 8
  { iso2: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮", sample: "01 23 45 67 89" },    // 10 (nouveau plan)
  { iso2: "ML", name: "Mali",          dial: "+223", flag: "🇲🇱", sample: "65 12 34 56" },       // 8
  { iso2: "SN", name: "Sénégal",       dial: "+221", flag: "🇸🇳", sample: "70 123 45 67" },      // 9
  { iso2: "NE", name: "Niger",         dial: "+227", flag: "🇳🇪", sample: "90 12 34 56" },       // 8
  { iso2: "TG", name: "Togo",          dial: "+228", flag: "🇹🇬", sample: "90 12 34 56" },       // 8
  { iso2: "BJ", name: "Bénin",         dial: "+229", flag: "🇧🇯", sample: "90 12 34 56" },       // 8
  { iso2: "GH", name: "Ghana",         dial: "+233", flag: "🇬🇭", sample: "024 123 4567" },      // 10 national
  { iso2: "GN", name: "Guinée",        dial: "+224", flag: "🇬🇳", sample: "620 12 34 56" },      // 9
];

const ISO2_TO_OPTION = COUNTRY_OPTIONS.reduce((acc, c) => {
  acc[c.iso2] = c;
  return acc;
}, {});

/** Compte le nombre de chiffres dans l'exemple -> sert de borne max */
function getMaxNationalDigits(iso2) {
  const sample = ISO2_TO_OPTION[iso2]?.sample || "";
  return (sample.match(/\d/g) || []).length || 10;
}

/** Extrait uniquement les chiffres d'une chaîne */
function extractDigits(str) {
  return (str.match(/\d/g) || []).join("");
}

/** Calcule formatted / e164 / valid à partir d'un raw et d'un iso préféré */
function computePhoneState(raw, preferredIso2) {
  if (!raw || !raw.trim()) {
    return { iso2: preferredIso2, formatted: "", e164: "", valid: false };
  }

  const trimmed = raw.trim();
  
  // Essayer de parser en international d'abord
  const parsedIntl = parsePhoneNumberFromString(trimmed);
  let detectedIso2 = parsedIntl?.country || preferredIso2;

  // Formater avec AsYouType
  const ayt = new AsYouType(detectedIso2);
  const formatted = ayt.input(trimmed);

  // Parser le résultat formaté pour validation
  const parsed = parsePhoneNumberFromString(formatted, detectedIso2);
  const e164 = parsed?.number || "";
  const valid = parsed ? parsed.isValid() : false;

  return { iso2: detectedIso2, formatted, e164, valid };
}

/**
 * Échappe le numéro pour permettre la suppression caractère par caractère
 */
function handleBackspaceDelete(currentValue, key, selectionStart, selectionEnd) {
  if (selectionStart !== selectionEnd) {
    return currentValue.slice(0, selectionStart) + currentValue.slice(selectionEnd);
  }

  if (key === "Backspace" && selectionStart > 0) {
    let pos = selectionStart - 1;
    while (pos > 0 && !/\d/.test(currentValue[pos])) {
      pos--;
    }
    return currentValue.slice(0, pos) + currentValue.slice(selectionStart);
  }

  if (key === "Delete" && selectionStart < currentValue.length) {
    let pos = selectionStart;
    while (pos < currentValue.length && !/\d/.test(currentValue[pos])) {
      pos++;
    }
    return currentValue.slice(0, selectionStart) + currentValue.slice(pos + 1);
  }

  return currentValue;
}

/**
 * PhoneInput avec shadcn/ui combobox
 */
export default function PhoneInput({
  value = "",
  countryIso2 = "BF",
  onChange,
  onCountryChange,
  onE164Change,
  onValidityChange,
  label = "Numéro de téléphone",
  required = false,
  error = "",
  disabled = false,
  id = "phone",
}) {
  const [display, setDisplay] = useState(value);
  const [iso2, setIso2] = useState(countryIso2);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const country = useMemo(
    () => ISO2_TO_OPTION[iso2] || COUNTRY_OPTIONS[0],
    [iso2]
  );
  
  const placeholder = country.sample;
  const maxDigits = getMaxNationalDigits(iso2);

  // Refs anti-boucle
  const prevE164Ref = useRef("");
  const prevValidRef = useRef(false);
  const prevDisplayRef = useRef(display);
  const prevIsoRef = useRef(iso2);

  // Sync props -> état
  useEffect(() => {
    if (value !== prevDisplayRef.current) {
      setDisplay(value);
      prevDisplayRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (countryIso2 && countryIso2 !== prevIsoRef.current) {
      setIso2(countryIso2);
      prevIsoRef.current = countryIso2;
    }
  }, [countryIso2]);

  function notifyCountry(nextIso2) {
    if (nextIso2 !== prevIsoRef.current) {
      prevIsoRef.current = nextIso2;
      setIso2(nextIso2);
      if (typeof onCountryChange === "function") onCountryChange(nextIso2);
    }
  }

  function notifyDisplay(nextDisplay) {
    if (nextDisplay !== prevDisplayRef.current) {
      prevDisplayRef.current = nextDisplay;
      if (typeof onChange === "function") onChange(nextDisplay);
    }
  }

  function notifyE164(nextE164) {
    if (nextE164 !== prevE164Ref.current) {
      prevE164Ref.current = nextE164;
      if (typeof onE164Change === "function") onE164Change(nextE164);
    }
  }

  function notifyValid(nextValid) {
    if (nextValid !== prevValidRef.current) {
      prevValidRef.current = nextValid;
      if (typeof onValidityChange === "function") onValidityChange(nextValid);
    }
  }

  const handleCountrySelect = (nextIso2) => {
    notifyCountry(nextIso2);
    setOpen(false);

    // Extraire les chiffres et reformater avec le nouveau pays
    const digits = extractDigits(display);
    if (!digits) {
      setDisplay("");
      notifyDisplay("");
      notifyE164("");
      notifyValid(false);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // Limiter au max du nouveau pays
    const max = getMaxNationalDigits(nextIso2);
    const limitedDigits = digits.slice(0, max);

    // Reformater
    const { formatted, e164, valid } = computePhoneState(limitedDigits, nextIso2);
    setDisplay(formatted);
    notifyDisplay(formatted);
    notifyE164(e164);
    notifyValid(valid);

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const input = e.target;
      const newValue = handleBackspaceDelete(
        display,
        e.key,
        input.selectionStart,
        input.selectionEnd
      );

      // Extraire uniquement les chiffres pour retraiter
      const digits = extractDigits(newValue);
      
      if (!digits) {
        setDisplay("");
        notifyDisplay("");
        notifyE164("");
        notifyValid(false);
        return;
      }

      // Limiter au max du pays actuel
      const max = getMaxNationalDigits(iso2);
      const limitedDigits = digits.slice(0, max);

      // Reformater avec le pays actuel
      const { formatted, e164, valid, iso2: detectedIso } = computePhoneState(limitedDigits, iso2);
      
      // Mettre à jour le pays si détecté différent (format international)
      if (detectedIso !== iso2) {
        notifyCountry(detectedIso);
      }

      setDisplay(formatted);
      notifyDisplay(formatted);
      notifyE164(e164);
      notifyValid(valid);
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;

    if (!raw || !raw.trim()) {
      setDisplay("");
      notifyDisplay("");
      notifyE164("");
      notifyValid(false);
      return;
    }

    // Extraire les chiffres
    const digits = extractDigits(raw);
    
    // Détecter le pays si format international
    const isInternational = raw.trim().startsWith("+");
    let workingIso = iso2;

    if (isInternational) {
      const { iso2: detectedIso } = computePhoneState(raw, iso2);
      if (detectedIso && detectedIso !== iso2) {
        workingIso = detectedIso;
        notifyCountry(detectedIso);
      }
    }

    // Limiter selon le pays
    const max = getMaxNationalDigits(workingIso);
    
    // Pour le format international, extraire le dial code
    let limitedDigits = digits;
    if (isInternational) {
      const dialCode = ISO2_TO_OPTION[workingIso]?.dial.replace("+", "") || "";
      if (digits.startsWith(dialCode)) {
        const nationalPart = digits.slice(dialCode.length);
        limitedDigits = dialCode + nationalPart.slice(0, max);
      } else {
        limitedDigits = digits.slice(0, max);
      }
    } else {
      limitedDigits = digits.slice(0, max);
    }

    // Reformater
    const inputForFormat = isInternational ? `+${limitedDigits}` : limitedDigits;
    const { formatted, e164, valid } = computePhoneState(inputForFormat, workingIso);

    setDisplay(formatted);
    notifyDisplay(formatted);
    notifyE164(e164);
    notifyValid(valid);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text") || "";

    if (!text.trim()) return;

    // Détecter le pays
    const { iso2: detectedIso } = computePhoneState(text, iso2);
    const workingIso = detectedIso || iso2;
    
    if (workingIso !== iso2) {
      notifyCountry(workingIso);
    }

    // Extraire et limiter les chiffres
    const digits = extractDigits(text);
    const isInternational = text.trim().startsWith("+");
    const max = getMaxNationalDigits(workingIso);
    
    let limitedDigits = digits;
    if (isInternational) {
      const dialCode = ISO2_TO_OPTION[workingIso]?.dial.replace("+", "") || "";
      if (digits.startsWith(dialCode)) {
        const nationalPart = digits.slice(dialCode.length);
        limitedDigits = dialCode + nationalPart.slice(0, max);
      } else {
        limitedDigits = digits.slice(0, max);
      }
    } else {
      limitedDigits = digits.slice(0, max);
    }

    // Reformater
    const inputForFormat = isInternational ? `+${limitedDigits}` : limitedDigits;
    const { formatted, e164, valid } = computePhoneState(inputForFormat, workingIso);

    setDisplay(formatted);
    notifyDisplay(formatted);
    notifyE164(e164);
    notifyValid(valid);
  };

  const isValid = prevValidRef.current;

  // Compteur de chiffres nationaux optimisé
  const nationalDigitsCount = useMemo(() => {
    const digits = extractDigits(display);
    const dialCode = country.dial.replace("+", "");
    
    if (display.startsWith("+") && digits.startsWith(dialCode)) {
      return digits.slice(dialCode.length).length;
    }
    return digits.length;
  }, [display, country.dial]);

  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className={`flex rounded-lg overflow-hidden border transition-all duration-200 
        ${error ? "border-red-300 focus-within:ring-2 focus-within:ring-red-500" : "border-gray-300 focus-within:ring-2 focus-within:ring-blue-500"}`}>
        
        {/* Sélecteur de pays shadcn/ui */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Sélectionner le pays"
              disabled={disabled}
              className="h-10 rounded-none border-0 bg-gray-50 hover:bg-gray-100 px-3 justify-between min-w-[140px]"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                <span className="font-medium text-gray-700">{country.dial}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un pays..." />
              <CommandList>
                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                <CommandGroup>
                  {COUNTRY_OPTIONS.map((c) => (
                    <CommandItem
                      key={c.iso2}
                      value={`${c.name} ${c.dial}`}
                      onSelect={() => handleCountrySelect(c.iso2)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          iso2 === c.iso2 ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span className="text-lg mr-2">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-gray-500 text-sm">{c.dial}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Champ téléphone */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={disabled}
            className="w-full h-10 pl-10 pr-10 border-0 focus:ring-0 bg-white text-gray-900"
            placeholder={placeholder}
            value={display}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            aria-invalid={!!error}
            aria-describedby={errorId}
            aria-required={required}
          />
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {isValid && !error && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" aria-label="Numéro valide" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Format international :{" "}
          <span className="font-mono text-gray-900 font-medium">{prevE164Ref.current || "—"}</span>
        </span>
        <span className="text-gray-500">
          {nationalDigitsCount}/{maxDigits} chiffres
        </span>
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

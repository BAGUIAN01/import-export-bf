"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import {
  MessageCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  AsYouType,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
} from "libphonenumber-js/min";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

// Countries supported
const COUNTRY_OPTIONS = [
  { iso2: "FR", name: "France", dial: "+33", flag: "🇫🇷", sample: "06 12 34 56 78" },
  { iso2: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫", sample: "70 12 34 56" },
  { iso2: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮", sample: "01 23 45 67" },
  { iso2: "ML", name: "Mali", dial: "+223", flag: "🇲🇱", sample: "65 12 34 56" },
  { iso2: "SN", name: "Sénégal", dial: "+221", flag: "🇸🇳", sample: "70 123 45 67" },
  { iso2: "NE", name: "Niger", dial: "+227", flag: "🇳🇪", sample: "90 12 34 56" },
  { iso2: "TG", name: "Togo", dial: "+228", flag: "🇹🇬", sample: "90 12 34 56" },
  { iso2: "BJ", name: "Bénin", dial: "+229", flag: "🇧🇯", sample: "90 12 34 56" },
  { iso2: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭", sample: "024 123 4567" },
  { iso2: "GN", name: "Guinée", dial: "+224", flag: "🇬🇳", sample: "620 12 34 56" },
];

const ISO2_TO_OPTION = COUNTRY_OPTIONS.reduce((acc, c) => {
  acc[c.iso2] = c;
  return acc;
}, {});

export default function SignUpMain() {
  const router = useRouter();

  const [selectedIso2, setSelectedIso2] = useState("BF");
  const selectedCountry = useMemo(
    () => ISO2_TO_OPTION[selectedIso2] ?? COUNTRY_OPTIONS[0],
    [selectedIso2]
  );

  const [phone, setPhone] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function computePhoneState(raw, preferredIso2) {
    const parsedIntl = parsePhoneNumberFromString(raw);
    let iso2 = preferredIso2;
    if (parsedIntl?.country) iso2 = parsedIntl.country;

    const ayt = new AsYouType(iso2);
    const formatted = ayt.input(raw);

    const parsed = parsePhoneNumberFromString(formatted, iso2);
    const e164 = parsed?.number ?? parsedIntl?.number ?? "";
    const valid = parsed?.isValid?.() || (e164 ? isValidPhoneNumber(e164) : false);

    return { iso2, formatted, e164, valid };
  }

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const { iso2, formatted, e164, valid } = computePhoneState(raw, selectedIso2);
    if (iso2 !== selectedIso2) setSelectedIso2(iso2);
    setPhone(formatted);
    setPhoneE164(e164 ?? "");
    setPhoneValid(Boolean(valid));
    setError("");
  };

  const handleCountryChange = (e) => {
    const iso2 = e.target.value;
    setSelectedIso2(iso2);
    const { formatted, e164, valid } = computePhoneState(phone, iso2);
    setPhone(formatted);
    setPhoneE164(e164 ?? "");
    setPhoneValid(Boolean(valid));
  };

  const validateForm = () => {
    if (!phone || !firstName || !lastName || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires");
      return false;
    }
    if (!phoneValid || !phoneE164) {
      setError(`Numéro de téléphone invalide pour ${selectedCountry?.name}`);
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format d'email invalide");
      return false;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email || null,
          password,
          phone: phoneE164,
          country: selectedCountry.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du compte");
      }

      // Connexion automatique (téléphone + mot de passe), sans vérification SMS
      const result = await signIn("credentials", {
        login: phoneE164,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Compte créé mais connexion automatique impossible : rediriger vers la connexion
        setSuccess("Compte créé avec succès ! Veuillez vous connecter.");
        setTimeout(() => router.push("/auth/signin"), 2000);
        return;
      }

      setStep(3);
      setSuccess("Compte créé avec succès !");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const phonePlaceholder = useMemo(() => {
    const c = selectedCountry;
    return `${c.sample}`;
  }, [selectedCountry]);

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#0E7A34]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#0E7A34]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue !</h2>
            <p className="text-gray-600 mb-6">Votre compte a été créé avec succès</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-[#0E7A34] rounded-full animate-pulse"></div>
              <span>Redirection vers votre tableau de bord...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6 overflow-hidden">
            <Image
              src="/logo.jpeg"
              alt="Naange Envoi"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Rejoignez Naange Envoi
          </h1>
          <p className="text-gray-500 text-lg">
            Créez votre compte en quelques minutes
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#0E7A34] flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm leading-relaxed">{success}</p>
            </div>
          )}

          {/* Step 1: Registration Form */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="firstName"
                  type="text"
                  label="Prénom *"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                />
                <FloatingLabelInput
                  id="lastName"
                  type="text"
                  label="Nom *"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <div className="flex rounded-md overflow-hidden border-2 border-zinc-300 focus-within:border-zinc-900 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] transition-all duration-300">
                  <div className="relative shrink-0">
                    <select
                      className="appearance-none h-14 pl-4 pr-8 bg-gray-50 border-0 focus:ring-0 focus:outline-none text-sm font-medium text-zinc-700 cursor-pointer"
                      value={selectedIso2}
                      onChange={handleCountryChange}
                      aria-label="Pays du numéro"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.iso2} value={c.iso2}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>

                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="flex-1 h-14 px-4 border-0 focus:ring-0 focus:outline-none bg-transparent text-sm text-zinc-900"
                    placeholder={`Téléphone — ex. ${phonePlaceholder}`}
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>

                {phone && (
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-gray-500">
                      Format international:{" "}
                      <span className="font-mono text-gray-700">
                        {phoneE164 || "—"}
                      </span>
                    </span>
                    {phoneValid && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-[#0B5C28]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valide
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Email */}
              <FloatingLabelInput
                id="email"
                type="email"
                label="Email (optionnel)"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="password"
                  type="password"
                  label="Mot de passe *"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <FloatingLabelInput
                  id="confirmPassword"
                  type="password"
                  label="Confirmer *"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                />
              </div>

              {/* Terms Acceptance */}
              <div className="flex items-start space-x-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setError("");
                  }}
                  className="mt-1 h-4 w-4 text-[#0E7A34] focus:ring-[#0E7A34] border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-relaxed">
                  J'accepte les{" "}
                  <a href="/terms" className="text-[#0E7A34] hover:text-[#0B5C28] font-medium underline underline-offset-2">
                    conditions d'utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="/privacy" className="text-[#0E7A34] hover:text-[#0B5C28] font-medium underline underline-offset-2">
                    politique de confidentialité
                  </a>
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-[#0E7A34] mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Information</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Les informations de livraison seront demandées lors de l'enregistrement de votre premier colis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl text-base font-semibold text-white bg-[#0E7A34] hover:bg-[#0B5C28] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E7A34] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Créer mon compte
                  </>
                )}
              </button>

              {/* Sign In Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Déjà un compte ?{" "}
                  <a href="/auth/signin" className="text-[#0E7A34] hover:text-[#0B5C28] font-medium transition-colors">
                    Se connecter
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{" "}
            <a href="/contact" className="text-[#0E7A34] hover:text-[#0B5C28] font-medium transition-colors">
              Contactez notre support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

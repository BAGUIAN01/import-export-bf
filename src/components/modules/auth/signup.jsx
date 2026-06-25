"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Phone,
  MessageCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Eye,
  EyeOff,
  ChevronDown,
  Shield,
  Package,
} from "lucide-react";
import {
  AsYouType,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
} from "libphonenumber-js/min";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue !</h2>
            <p className="text-gray-600 mb-6">Votre compte a été créé avec succès</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>Redirection vers votre tableau de bord...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 my-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Rejoignez Naange Envoi
          </h1>
          <p className="text-gray-600 text-lg">
            Créez votre compte en quelques minutes
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-sm leading-relaxed">{success}</p>
            </div>
          )}

          {/* Step 1: Registration Form */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="given-name"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                      placeholder="Votre prénom"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setError("");
                      }}
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="family-name"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                      placeholder="Votre nom"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setError("");
                      }}
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl shadow-sm overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all duration-200">
                  <div className="relative">
                    <select
                      className="appearance-none h-full pl-4 pr-8 py-3 bg-gray-50 border-0 focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer"
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
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      className="w-full pl-12 pr-4 py-3 border-0 focus:ring-0 bg-white"
                      placeholder={phonePlaceholder}
                      value={phone}
                      onChange={handlePhoneChange}
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Format international:{" "}
                      <span className="font-mono text-gray-700">
                        {phoneE164 || "—"}
                      </span>
                    </span>
                    {phoneValid && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valide
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-gray-400 text-xs">(optionnel)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                      placeholder="Minimum 6 caractères"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirmer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                      placeholder="Répétez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
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
                  className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-relaxed">
                  J'accepte les{" "}
                  <a href="/terms" className="text-amber-600 hover:text-amber-500 font-medium underline underline-offset-2">
                    conditions d'utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="/privacy" className="text-amber-600 hover:text-amber-500 font-medium underline underline-offset-2">
                    politique de confidentialité
                  </a>
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">Information</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Les informations de livraison seront demandées lors de l'enregistrement de votre premier colis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  <a href="/auth/signin" className="text-amber-600 hover:text-amber-500 font-medium underline underline-offset-2 transition-colors">
                    Se connecter
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Besoin d'aide ?{" "}
            <a href="/contact" className="text-amber-600 hover:text-amber-500 font-medium underline underline-offset-2 transition-colors">
              Contactez notre support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
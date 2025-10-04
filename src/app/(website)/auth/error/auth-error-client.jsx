"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorCode = searchParams.get("code");

  const getErrorMessage = (errorType) => {
    switch (errorType) {
      case "CredentialsSignin":
        return "Identifiants incorrects. Vérifiez votre numéro de téléphone et le code de vérification.";
      case "OAuthSignin":
        return "Erreur lors de la connexion avec le fournisseur.";
      case "OAuthCallback":
        return "Erreur de callback OAuth.";
      case "OAuthCreateAccount":
        return "Erreur lors de la création du compte OAuth.";
      case "EmailCreateAccount":
        return "Erreur lors de la création du compte email.";
      case "Callback":
        return "Erreur de callback d'authentification.";
      case "OAuthAccountNotLinked":
        return "Ce compte est déjà lié à un autre fournisseur.";
      case "EmailSignin":
        return "Erreur lors de l'envoi de l'email de connexion.";
      case "CredentialsSignUp":
        return "Erreur lors de l'inscription.";
      case "SessionRequired":
        return "Vous devez être connecté pour accéder à cette page.";
      default:
        return error || "Une erreur d'authentification s'est produite.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur d'authentification
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">{getErrorMessage(error)}</p>

            {error && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700">
                  <strong>Type d'erreur :</strong> {error}
                </p>
                {errorCode && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Code :</strong> {errorCode}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>

            <a
              href="/auth/signin"
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Réessayer la connexion
            </a>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Si le problème persiste, contactez le support technique.
          </div>
        </div>
      </div>
    </div>
  );
}

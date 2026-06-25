// app/auth/signin/page.js
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, AlertCircle, Lock } from 'lucide-react'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'

export default function SignInMain() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!login || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        login: login.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Identifiants incorrects')
      } else if (result?.ok) {
        router.push('/admin')
      }
    } catch (err) {
      setError('Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
          <p className="text-gray-500">Accédez à votre espace Naange Envoi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <FloatingLabelInput
              id="login"
              name="login"
              type="text"
              label="Email ou numéro de téléphone"
              autoComplete="username"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value)
                setError('')
              }}
            />

            <FloatingLabelInput
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
            />

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <a
                href="/auth/forgot-password"
                className="text-sm text-[#0E7A34] hover:text-[#0B5C28] font-medium transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !login || !password}
              className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl text-base font-semibold text-white bg-[#0E7A34] hover:bg-[#0B5C28] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E7A34] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <a
                href="/auth/signup"
                className="text-[#0E7A34] hover:text-[#0B5C28] font-medium transition-colors"
              >
                Créer un compte
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <a
              href="/contact"
              className="text-[#0E7A34] hover:text-[#0B5C28] font-medium transition-colors"
            >
              Contactez notre support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

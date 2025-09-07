// app/auth/signin/page.js
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock,
  User,
  Shield
} from 'lucide-react'

export default function SignInMain() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Form states
  const [login, setLogin] = useState('') // Email ou téléphone
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Simple login with credentials
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Connexion
          </h1>
          <p className="text-gray-600">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email/Phone Field */}
            <div className="space-y-2">
              <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                Email ou numéro de téléphone
              </label>
              <div className="relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  autoComplete="username"
                  required
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value)
                    setError('')
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50"
                  placeholder="email@exemple.com ou +226 70 12 34 56"
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50"
                  placeholder="Votre mot de passe"
                />
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a 
                  href="/auth/forgot-password" 
                  className="text-emerald-600 hover:text-emerald-500 font-medium underline underline-offset-2 transition-colors"
                >
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !login || !password}
              className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="text-emerald-600 hover:text-emerald-500 font-medium underline underline-offset-2 transition-colors"
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
              className="text-emerald-600 hover:text-emerald-500 font-medium underline underline-offset-2 transition-colors"
            >
              Contactez notre support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
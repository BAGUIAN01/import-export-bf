"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useProfileMutations } from '@/hooks/use-profile'

export function SecuritySettings({ user, isLoading }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isEnabling2FA, setIsEnabling2FA] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [twoFactorData, setTwoFactorData] = useState({
    phone: user?.phone || '',
    code: '',
  })

  const { updatePassword, enableTwoFactor, disableTwoFactor } = useProfileMutations()

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handleTwoFactorChange = (field, value) => {
    setTwoFactorData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsChangingPassword(true)

    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      toast.success('Mot de passe mis à jour avec succès')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du mot de passe')
      console.error('Password update error:', error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true)
    try {
      await enableTwoFactor(twoFactorData.phone)
      toast.success('Code de vérification envoyé par SMS')
    } catch (error) {
      toast.error('Erreur lors de l\'activation de la 2FA')
      console.error('2FA enable error:', error)
    } finally {
      setIsEnabling2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    try {
      await disableTwoFactor()
      toast.success('Authentification à deux facteurs désactivée')
    } catch (error) {
      toast.error('Erreur lors de la désactivation de la 2FA')
      console.error('2FA disable error:', error)
    }
  }

  const getSecurityScore = () => {
    let score = 0
    if (user?.password) score += 30
    if (user?.email) score += 20
    if (user?.phone) score += 20
    if (user?.twoFactorEnabled) score += 30
    return score
  }

  const securityScore = getSecurityScore()
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Bon'
    if (score >= 40) return 'Moyen'
    return 'Faible'
  }

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Niveau de sécurité
          </CardTitle>
          <CardDescription>
            Évaluez la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de sécurité</span>
              <Badge variant={securityScore >= 80 ? 'default' : securityScore >= 60 ? 'secondary' : 'destructive'}>
                {getScoreLabel(securityScore)}
              </Badge>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  securityScore >= 80 ? 'bg-green-500' : 
                  securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${securityScore}%` }}
              />
            </div>
            
            <p className={`text-sm font-medium ${getScoreColor(securityScore)}`}>
              {securityScore}/100
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Changez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  disabled={isLoading || isChangingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Votre nouveau mot de passe"
                  disabled={isLoading || isChangingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  disabled={isLoading || isChangingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isChangingPassword || isLoading}
              className="w-full"
            >
              {isChangingPassword ? 'Mise à jour...' : 'Changer le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Authentification à deux facteurs
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">SMS 2FA</p>
                <p className="text-xs text-muted-foreground">
                  Recevez un code par SMS lors de la connexion
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user?.twoFactorEnabled ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Activé
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Désactivé
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {!user?.twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone2FA">Numéro de téléphone</Label>
                  <Input
                    id="phone2FA"
                    type="tel"
                    value={twoFactorData.phone}
                    onChange={(e) => handleTwoFactorChange('phone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                    disabled={isLoading || isEnabling2FA}
                  />
                </div>
                <Button 
                  onClick={handleEnable2FA}
                  disabled={isEnabling2FA || isLoading || !twoFactorData.phone}
                  className="w-full"
                >
                  {isEnabling2FA ? 'Activation...' : 'Activer la 2FA'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">2FA activée</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Votre compte est protégé par l'authentification à deux facteurs
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isLoading}
                  className="w-full"
                >
                  Désactiver la 2FA
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Conseils de sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Utilisez un mot de passe unique et complexe</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Activez l'authentification à deux facteurs</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Ne partagez jamais vos identifiants</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Déconnectez-vous après chaque session</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

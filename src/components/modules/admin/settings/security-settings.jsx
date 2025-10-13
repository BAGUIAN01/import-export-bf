'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff,
  Smartphone,
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  QrCode
} from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: false,
    auditLog: true,
    encryption: true
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSaveSecurity = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Paramètres de sécurité sauvegardés')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Mot de passe modifié avec succès')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSecurity(prev => ({ ...prev, twoFactorEnabled: true }))
      toast.success('Authentification à deux facteurs activée')
    } catch (error) {
      toast.error('Erreur lors de l\'activation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSecurity(prev => ({ ...prev, twoFactorEnabled: false }))
      toast.success('Authentification à deux facteurs désactivée')
    } catch (error) {
      toast.error('Erreur lors de la désactivation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statut de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Statut de sécurité
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de votre niveau de sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className={`p-2 rounded-full ${security.twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">2FA</p>
                <Badge variant={security.twoFactorEnabled ? "default" : "secondary"}>
                  {security.twoFactorEnabled ? "Activé" : "Désactivé"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Chiffrement</p>
                <Badge variant="default">Activé</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Sessions</p>
                <Badge variant="outline">{security.sessionTimeout} min</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentification à deux facteurs */}
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
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Authentification à deux facteurs</Label>
              <p className="text-sm text-muted-foreground">
                Utilisez votre téléphone pour vérifier votre identité
              </p>
            </div>
            <Switch
              checked={security.twoFactorEnabled}
              onCheckedChange={(checked) => 
                checked ? handleEnable2FA() : handleDisable2FA()
              }
              disabled={isLoading}
            />
          </div>

          {security.twoFactorEnabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                L'authentification à deux facteurs est activée. Vous recevrez un code de vérification sur votre téléphone lors de la connexion.
              </AlertDescription>
            </Alert>
          )}

          {!security.twoFactorEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                L'authentification à deux facteurs n'est pas activée. Nous recommandons de l'activer pour renforcer la sécurité de votre compte.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe pour maintenir la sécurité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Entrez votre mot de passe actuel"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Entrez votre nouveau mot de passe"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirmez votre nouveau mot de passe"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleChangePassword} disabled={isLoading} className="w-full">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Paramètres de session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Paramètres de session
          </CardTitle>
          <CardDescription>
            Configurez la durée et la sécurité des sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Délai d'expiration de session</Label>
              <p className="text-sm text-muted-foreground">
                Durée avant déconnexion automatique (minutes)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                className="w-20"
                min="5"
                max="480"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Expiration du mot de passe</Label>
              <p className="text-sm text-muted-foreground">
                Durée avant expiration du mot de passe (jours)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={security.passwordExpiry}
                onChange={(e) => setSecurity(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
                className="w-20"
                min="30"
                max="365"
              />
              <span className="text-sm text-muted-foreground">jours</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Limite de tentatives de connexion</Label>
              <p className="text-sm text-muted-foreground">
                Nombre de tentatives avant blocage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={security.loginAttempts}
                onChange={(e) => setSecurity(prev => ({ ...prev, loginAttempts: parseInt(e.target.value) }))}
                className="w-20"
                min="3"
                max="10"
              />
              <span className="text-sm text-muted-foreground">tentatives</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres avancés
          </CardTitle>
          <CardDescription>
            Options de sécurité avancées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Liste blanche IP</Label>
              <p className="text-sm text-muted-foreground">
                Restreindre l'accès à certaines adresses IP
              </p>
            </div>
            <Switch
              checked={security.ipWhitelist}
              onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, ipWhitelist: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Journal d'audit</Label>
              <p className="text-sm text-muted-foreground">
                Enregistrer toutes les activités de sécurité
              </p>
            </div>
            <Switch
              checked={security.auditLog}
              onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, auditLog: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Chiffrement des données</Label>
              <p className="text-sm text-muted-foreground">
                Chiffrer les données sensibles en base
              </p>
            </div>
            <Switch
              checked={security.encryption}
              onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, encryption: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Dernière mise à jour: Il y a 5 minutes
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={handleSaveSecurity} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

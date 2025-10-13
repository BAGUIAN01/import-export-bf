'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

export function GeneralSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    companyName: 'Import Export BF',
    companyEmail: 'contact@import-export-bf.com',
    companyPhone: '+226 25 30 60 70',
    companyAddress: 'Ouagadougou, Burkina Faso',
    timezone: 'Africa/Ouagadougou',
    language: 'fr',
    currency: 'XOF',
    autoSave: true,
    showWelcomeMessage: true,
    enableAnalytics: false,
    maintenanceMode: false
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulation d'une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Paramètres généraux sauvegardés avec succès')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSettings({
      companyName: 'Import Export BF',
      companyEmail: 'contact@import-export-bf.com',
      companyPhone: '+226 25 30 60 70',
      companyAddress: 'Ouagadougou, Burkina Faso',
      timezone: 'Africa/Ouagadougou',
      language: 'fr',
      currency: 'XOF',
      autoSave: true,
      showWelcomeMessage: true,
      enableAnalytics: false,
      maintenanceMode: false
    })
    toast.info('Paramètres réinitialisés')
  }

  return (
    <div className="space-y-6">
      {/* Informations de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
          <CardDescription>
            Configurez les informations de base de votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Nom de votre entreprise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email de contact</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                placeholder="contact@entreprise.com"
              />
            </div>
          </div>

          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Téléphone</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                placeholder="+226 XX XX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Adresse</Label>
              <Input
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                placeholder="Ville, Pays"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration régionale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuration régionale
          </CardTitle>
          <CardDescription>
            Définissez la langue, la devise et le fuseau horaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">Dollar US (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Ouagadougou">Ouagadougou (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Préférences de l'application */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Préférences de l'application
          </CardTitle>
          <CardDescription>
            Personnalisez le comportement de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sauvegarde automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Sauvegarde automatique des modifications
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSave: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Message de bienvenue</Label>
                <p className="text-sm text-muted-foreground">
                  Afficher le message de bienvenue au démarrage
                </p>
              </div>
              <Switch
                checked={settings.showWelcomeMessage}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showWelcomeMessage: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Collecter des données d'utilisation anonymes
                </p>
              </div>
              <Switch
                checked={settings.enableAnalytics}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAnalytics: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Activer le mode maintenance pour les utilisateurs
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>
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
                Dernière sauvegarde: Il y a 2 minutes
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
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

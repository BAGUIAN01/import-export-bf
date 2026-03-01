'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { FloatingLabelSelect } from '@/components/ui/floating-label-select'
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea'
import { Switch } from '@/components/ui/switch'
import { SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Globe, 
  Clock,
  Save,
  RefreshCw
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="companyName"
              label="Nom de l'entreprise"
              value={settings.companyName}
              onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
            />
            <FloatingLabelInput
              id="companyEmail"
              label="Email de contact"
              type="email"
              value={settings.companyEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
            />
            <FloatingLabelInput
              id="companyPhone"
              label="Téléphone"
              value={settings.companyPhone}
              onChange={(e) => setSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
            />
            <FloatingLabelInput
              id="companyAddress"
              label="Adresse"
              value={settings.companyAddress}
              onChange={(e) => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuration régionale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FloatingLabelSelect
              id="language"
              label="Langue"
              value={settings.language}
              onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
            >
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </FloatingLabelSelect>

            <FloatingLabelSelect
              id="currency"
              label="Devise"
              value={settings.currency}
              onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
            >
              <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="USD">Dollar US (USD)</SelectItem>
            </FloatingLabelSelect>

            <FloatingLabelSelect
              id="timezone"
              label="Fuseau horaire"
              value={settings.timezone}
              onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
            >
              <SelectItem value="Africa/Ouagadougou">Ouagadougou (GMT+0)</SelectItem>
              <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
              <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
            </FloatingLabelSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Préférences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sauvegarde automatique</span>
            <Switch
              checked={settings.autoSave}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSave: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Message de bienvenue</span>
            <Switch
              checked={settings.showWelcomeMessage}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showWelcomeMessage: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Analytics</span>
            <Switch
              checked={settings.enableAnalytics}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAnalytics: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mode maintenance</span>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end gap-2">
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
        </CardContent>
      </Card>
    </div>
  )
}

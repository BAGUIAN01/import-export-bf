'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Eye,
  Layout,
  Type,
  Save,
  RefreshCw,
  CheckCircle,
  Paintbrush
} from 'lucide-react'
import { toast } from 'sonner'

export function AppearanceSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [appearance, setAppearance] = useState({
    theme: 'system',
    primaryColor: 'blue',
    fontSize: 'medium',
    density: 'comfortable',
    sidebarCollapsed: false,
    showAnimations: true,
    showTooltips: true,
    compactMode: false
  })

  const themes = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor }
  ]

  const colors = [
    { value: 'blue', label: 'Bleu', color: 'bg-blue-500' },
    { value: 'green', label: 'Vert', color: 'bg-green-500' },
    { value: 'purple', label: 'Violet', color: 'bg-purple-500' },
    { value: 'red', label: 'Rouge', color: 'bg-red-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'pink', label: 'Rose', color: 'bg-pink-500' }
  ]

  const fontSizes = [
    { value: 'small', label: 'Petit' },
    { value: 'medium', label: 'Moyen' },
    { value: 'large', label: 'Grand' }
  ]

  const densities = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Confortable' },
    { value: 'spacious', label: 'Spacieux' }
  ]

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Paramètres d\'apparence sauvegardés')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setAppearance({
      theme: 'system',
      primaryColor: 'blue',
      fontSize: 'medium',
      density: 'comfortable',
      sidebarCollapsed: false,
      showAnimations: true,
      showTooltips: true,
      compactMode: false
    })
    toast.info('Paramètres d\'apparence réinitialisés')
  }

  return (
    <div className="space-y-6">
      {/* Thème */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Thème
          </CardTitle>
          <CardDescription>
            Choisissez le thème de votre interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xs:gap-3 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
            {themes.map((theme) => {
              const Icon = theme.icon
              return (
                <Button
                  key={theme.value}
                  variant={appearance.theme === theme.value ? "default" : "outline"}
                  className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 min-h-[60px] sm:min-h-[80px]"
                  onClick={() => setAppearance(prev => ({ ...prev, theme: theme.value }))}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{theme.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Couleur principale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Couleur principale
          </CardTitle>
          <CardDescription>
            Sélectionnez la couleur principale de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xs:gap-3 sm:gap-3 grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
            {colors.map((color) => (
              <Button
                key={color.value}
                variant={appearance.primaryColor === color.value ? "default" : "outline"}
                className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 min-h-[60px] sm:min-h-[80px]"
                onClick={() => setAppearance(prev => ({ ...prev, primaryColor: color.value }))}
              >
                <div className={`w-6 h-6 rounded-full ${color.color}`} />
                <span className="text-sm">{color.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typographie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typographie
          </CardTitle>
          <CardDescription>
            Ajustez la taille et le style du texte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Taille de police</Label>
            <Select value={appearance.fontSize} onValueChange={(value) => setAppearance(prev => ({ ...prev, fontSize: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Densité de l'interface</Label>
            <Select value={appearance.density} onValueChange={(value) => setAppearance(prev => ({ ...prev, density: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {densities.map((density) => (
                  <SelectItem key={density.value} value={density.value}>
                    {density.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Disposition
          </CardTitle>
          <CardDescription>
            Configurez la disposition de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Barre latérale réduite</Label>
              <p className="text-sm text-muted-foreground">
                Réduire automatiquement la barre latérale
              </p>
            </div>
            <Switch
              checked={appearance.sidebarCollapsed}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, sidebarCollapsed: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode compact</Label>
              <p className="text-sm text-muted-foreground">
                Réduire les espacements pour plus de contenu
              </p>
            </div>
            <Switch
              checked={appearance.compactMode}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, compactMode: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Animations et effets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Animations et effets
          </CardTitle>
          <CardDescription>
            Personnalisez les animations et les effets visuels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animations</Label>
              <p className="text-sm text-muted-foreground">
                Activer les animations de transition
              </p>
            </div>
            <Switch
              checked={appearance.showAnimations}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, showAnimations: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Info-bulles</Label>
              <p className="text-sm text-muted-foreground">
                Afficher les info-bulles d'aide
              </p>
            </div>
            <Switch
              checked={appearance.showTooltips}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, showTooltips: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Aperçu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu
          </CardTitle>
          <CardDescription>
            Aperçu de vos paramètres d'apparence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full ${colors.find(c => c.value === appearance.primaryColor)?.color || 'bg-blue-500'}`} />
              <div>
                <p className="font-medium">Exemple de carte</p>
                <p className="text-sm text-muted-foreground">Description de l'élément</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="default">Actif</Badge>
              <Badge variant="secondary">Secondaire</Badge>
              <Badge variant="outline">Contour</Badge>
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
                Thème: {themes.find(t => t.value === appearance.theme)?.label}
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

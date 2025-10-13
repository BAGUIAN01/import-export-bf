'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Save,
  Settings,
  Activity,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

export function SystemSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [system, setSystem] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    logRetention: 30,
    cacheEnabled: true,
    maintenanceMode: false,
    debugMode: false,
    performanceMode: false
  })

  const [systemStats] = useState({
    diskUsage: 65,
    memoryUsage: 42,
    cpuUsage: 23,
    databaseSize: '2.4 GB',
    lastBackup: '2024-01-15 14:30',
    uptime: '15 jours, 8 heures'
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Paramètres système sauvegardés')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackup = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Sauvegarde créée avec succès')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Cache vidé avec succès')
    } catch (error) {
      toast.error('Erreur lors du vidage du cache')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimizeDatabase = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Base de données optimisée')
    } catch (error) {
      toast.error('Erreur lors de l\'optimisation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistiques système */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisation disque</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.diskUsage}%</div>
            <Progress value={systemStats.diskUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {systemStats.databaseSize} utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.memoryUsage}%</div>
            <Progress value={systemStats.memoryUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              RAM utilisée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.cpuUsage}%</div>
            <Progress value={systemStats.cpuUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Charge processeur
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.uptime}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sauvegarde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sauvegarde
          </CardTitle>
          <CardDescription>
            Configurez les sauvegardes automatiques et manuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sauvegarde automatique</Label>
              <p className="text-sm text-muted-foreground">
                Créer des sauvegardes automatiques
              </p>
            </div>
            <Switch
              checked={system.autoBackup}
              onCheckedChange={(checked) => setSystem(prev => ({ ...prev, autoBackup: checked }))}
            />
          </div>

          {system.autoBackup && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Fréquence de sauvegarde</Label>
                <Select value={system.backupFrequency} onValueChange={(value) => setSystem(prev => ({ ...prev, backupFrequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Rétention des logs (jours)</Label>
            <Select value={system.logRetention.toString()} onValueChange={(value) => setSystem(prev => ({ ...prev, logRetention: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
                <SelectItem value="365">1 an</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Dernière sauvegarde: {systemStats.lastBackup}
            </div>
            <Button onClick={handleBackup} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Créer une sauvegarde
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Performance
          </CardTitle>
          <CardDescription>
            Optimisez les performances du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cache activé</Label>
              <p className="text-sm text-muted-foreground">
                Utiliser le cache pour améliorer les performances
              </p>
            </div>
            <Switch
              checked={system.cacheEnabled}
              onCheckedChange={(checked) => setSystem(prev => ({ ...prev, cacheEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode performance</Label>
              <p className="text-sm text-muted-foreground">
                Optimiser pour les performances maximales
              </p>
            </div>
            <Switch
              checked={system.performanceMode}
              onCheckedChange={(checked) => setSystem(prev => ({ ...prev, performanceMode: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode debug</Label>
              <p className="text-sm text-muted-foreground">
                Activer les logs de débogage (développement uniquement)
              </p>
            </div>
            <Switch
              checked={system.debugMode}
              onCheckedChange={(checked) => setSystem(prev => ({ ...prev, debugMode: checked }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClearCache} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le cache
            </Button>
            <Button variant="outline" onClick={handleOptimizeDatabase} disabled={isLoading}>
              <Database className="h-4 w-4 mr-2" />
              Optimiser la base
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance
          </CardTitle>
          <CardDescription>
            Gestion de la maintenance système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode maintenance</Label>
              <p className="text-sm text-muted-foreground">
                Activer le mode maintenance pour les utilisateurs
              </p>
            </div>
            <Switch
              checked={system.maintenanceMode}
              onCheckedChange={(checked) => setSystem(prev => ({ ...prev, maintenanceMode: checked }))}
            />
          </div>

          {system.maintenanceMode && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le mode maintenance est activé. Les utilisateurs ne pourront pas accéder à l'application.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Actions de maintenance</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Redémarrer les services
              </Button>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Shield className="h-4 w-4 mr-2" />
                Vérifier la sécurité
              </Button>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                Mettre à jour
              </Button>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Activity className="h-4 w-4 mr-2" />
                Vérifier les logs
              </Button>
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
                Système opérationnel
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={isLoading}>
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

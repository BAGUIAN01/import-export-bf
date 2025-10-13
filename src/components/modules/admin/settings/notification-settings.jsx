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
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react'
import { toast } from 'sonner'

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      newShipment: true,
      paymentReceived: true,
      packageDelivered: true,
      systemAlerts: true,
      frequency: 'immediate'
    },
    sms: {
      enabled: false,
      newShipment: false,
      paymentReceived: true,
      packageDelivered: true,
      systemAlerts: false,
      frequency: 'daily'
    },
    push: {
      enabled: true,
      newShipment: true,
      paymentReceived: true,
      packageDelivered: true,
      systemAlerts: true,
      frequency: 'immediate'
    },
    sound: {
      enabled: true,
      volume: 70
    }
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Paramètres de notifications sauvegardés')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = (type) => {
    toast.success(`Notification ${type} de test envoyée`)
  }

  return (
    <div className="space-y-6">
      {/* Notifications par email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications par email
            <Badge variant={notifications.email.enabled ? "default" : "secondary"}>
              {notifications.email.enabled ? "Activé" : "Désactivé"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configurez les notifications par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer les emails</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications par email
              </p>
            </div>
            <Switch
              checked={notifications.email.enabled}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ 
                  ...prev, 
                  email: { ...prev.email, enabled: checked } 
                }))
              }
            />
          </div>

          {notifications.email.enabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nouveaux envois</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifier lors de nouveaux envois
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email.newShipment}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        email: { ...prev.email, newShipment: checked } 
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Paiements reçus</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifier les paiements reçus
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email.paymentReceived}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        email: { ...prev.email, paymentReceived: checked } 
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Livraisons</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifier les livraisons effectuées
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email.packageDelivered}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        email: { ...prev.email, packageDelivered: checked } 
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes système</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifier les alertes système importantes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email.systemAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        email: { ...prev.email, systemAlerts: checked } 
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fréquence des emails</Label>
                  <Select 
                    value={notifications.email.frequency} 
                    onValueChange={(value) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        email: { ...prev.email, frequency: value } 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immédiat</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestNotification('email')}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Tester l'email
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notifications SMS
            <Badge variant={notifications.sms.enabled ? "default" : "secondary"}>
              {notifications.sms.enabled ? "Activé" : "Désactivé"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configurez les notifications par SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer les SMS</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications par SMS
              </p>
            </div>
            <Switch
              checked={notifications.sms.enabled}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ 
                  ...prev, 
                  sms: { ...prev.sms, enabled: checked } 
                }))
              }
            />
          </div>

          {notifications.sms.enabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Paiements reçus</Label>
                    <p className="text-sm text-muted-foreground">
                      SMS pour les paiements importants
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms.paymentReceived}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        sms: { ...prev.sms, paymentReceived: checked } 
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Livraisons urgentes</Label>
                    <p className="text-sm text-muted-foreground">
                      SMS pour les livraisons urgentes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms.packageDelivered}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        sms: { ...prev.sms, packageDelivered: checked } 
                      }))
                    }
                  />
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTestNotification('SMS')}
                  className="w-full"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Tester le SMS
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications push
            <Badge variant={notifications.push.enabled ? "default" : "secondary"}>
              {notifications.push.enabled ? "Activé" : "Désactivé"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configurez les notifications push du navigateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer les notifications push</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications dans le navigateur
              </p>
            </div>
            <Switch
              checked={notifications.push.enabled}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ 
                  ...prev, 
                  push: { ...prev.push, enabled: checked } 
                }))
              }
            />
          </div>

          {notifications.push.enabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Toutes les notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir toutes les notifications push
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push.newShipment && notifications.push.paymentReceived && notifications.push.packageDelivered}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        push: { 
                          ...prev.push, 
                          newShipment: checked,
                          paymentReceived: checked,
                          packageDelivered: checked
                        } 
                      }))
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Paramètres audio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notifications.sound.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            Paramètres audio
          </CardTitle>
          <CardDescription>
            Configurez les sons de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activer les sons</Label>
              <p className="text-sm text-muted-foreground">
                Jouer des sons pour les notifications
              </p>
            </div>
            <Switch
              checked={notifications.sound.enabled}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ 
                  ...prev, 
                  sound: { ...prev.sound, enabled: checked } 
                }))
              }
            />
          </div>

          {notifications.sound.enabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Volume des notifications</Label>
                <div className="flex items-center gap-2">
                  <VolumeX className="h-4 w-4" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={notifications.sound.volume}
                    onChange={(e) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        sound: { ...prev.sound, volume: parseInt(e.target.value) } 
                      }))
                    }
                    className="flex-1"
                  />
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground w-12">
                    {notifications.sound.volume}%
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Notifications configurées
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

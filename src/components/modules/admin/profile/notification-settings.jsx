"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  Save
} from 'lucide-react'
import { useProfileMutations } from '@/hooks/use-profile'

export function NotificationSettings({ user, isLoading }) {
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      newShipment: true,
      shipmentUpdate: true,
      paymentReceived: true,
      systemAlerts: true,
    },
    sms: {
      enabled: false,
      newShipment: false,
      shipmentUpdate: false,
      paymentReceived: false,
      systemAlerts: true,
    },
    push: {
      enabled: true,
      newShipment: true,
      shipmentUpdate: true,
      paymentReceived: true,
      systemAlerts: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const { updateNotificationSettings } = useProfileMutations()

  useEffect(() => {
    if (user?.notificationSettings) {
      setNotifications(user.notificationSettings)
    }
  }, [user])

  const handleNotificationChange = (category, setting, value) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateNotificationSettings(notifications)
      toast.success('Paramètres de notification mis à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des paramètres')
      console.error('Notification settings update error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const notificationCategories = [
    {
      id: 'email',
      title: 'Notifications par email',
      description: 'Recevez des notifications par email',
      icon: <Mail className="h-4 w-4" />,
      color: 'text-blue-600',
    },
    {
      id: 'sms',
      title: 'Notifications par SMS',
      description: 'Recevez des notifications par SMS',
      icon: <Smartphone className="h-4 w-4" />,
      color: 'text-green-600',
    },
    {
      id: 'push',
      title: 'Notifications push',
      description: 'Recevez des notifications push dans l\'application',
      icon: <Bell className="h-4 w-4" />,
      color: 'text-purple-600',
    },
  ]

  const notificationTypes = [
    {
      id: 'newShipment',
      title: 'Nouvelle expédition',
      description: 'Quand une nouvelle expédition est créée',
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: 'shipmentUpdate',
      title: 'Mise à jour d\'expédition',
      description: 'Quand le statut d\'une expédition change',
      icon: <Truck className="h-4 w-4" />,
    },
    {
      id: 'paymentReceived',
      title: 'Paiement reçu',
      description: 'Quand un paiement est enregistré',
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: 'systemAlerts',
      title: 'Alertes système',
      description: 'Notifications importantes du système',
      icon: <AlertCircle className="h-4 w-4" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Notification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Paramètres de notification
          </CardTitle>
          <CardDescription>
            Gérez comment et quand vous recevez des notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {notificationCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={category.color}>
                    {category.icon}
                  </div>
                  <span className="text-sm font-medium">{category.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{category.description}</p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={notifications[category.id]?.enabled || false}
                    onCheckedChange={(checked) => 
                      handleNotificationChange(category.id, 'enabled', checked)
                    }
                    disabled={isLoading}
                  />
                  <Badge variant={notifications[category.id]?.enabled ? 'default' : 'secondary'}>
                    {notifications[category.id]?.enabled ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Settings */}
      {notificationCategories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={category.color}>
                {category.icon}
              </div>
              {category.title}
            </CardTitle>
            <CardDescription>
              {category.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications[category.id]?.enabled ? (
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {type.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{type.title}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[category.id]?.[type.id] || false}
                      onCheckedChange={(checked) => 
                        handleNotificationChange(category.id, type.id, checked)
                      }
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Activez {category.title.toLowerCase()} pour configurer les notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  )
}

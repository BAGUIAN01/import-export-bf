'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Globe,
  Users,
  Mail
} from 'lucide-react'

import { GeneralSettings } from './general-settings'
import { NotificationSettings } from './notification-settings'
import { SecuritySettings } from './security-settings'
import { AppearanceSettings } from './appearance-settings'
import { SystemSettings } from './system-settings'

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    {
      id: 'general',
      label: 'Général',
      icon: Settings,
      description: 'Paramètres de base de l\'application',
      badge: null
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Gestion des notifications',
      badge: '3'
    },
    {
      id: 'security',
      label: 'Sécurité',
      icon: Shield,
      description: 'Paramètres de sécurité et authentification',
      badge: null
    },
    {
      id: 'appearance',
      label: 'Apparence',
      icon: Palette,
      description: 'Thème et personnalisation',
      badge: null
    },
    {
      id: 'system',
      label: 'Système',
      icon: Database,
      description: 'Configuration système et maintenance',
      badge: '2'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paramètres actifs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 depuis la semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 non lues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">
              Niveau de sécurité élevé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Système</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              Disponibilité
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des paramètres */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-1 sm:gap-2 relative min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

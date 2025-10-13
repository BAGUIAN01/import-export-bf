"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Shield, 
  Bell, 
  Globe,
  Camera,
  Save,
  RefreshCw
} from 'lucide-react'
import { ProfileForm } from './profile-form'
import { SecuritySettings } from './security-settings'
import { NotificationSettings } from './notification-settings'
import { useProfile } from '@/hooks/use-profile'

export function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, isLoading, error, mutate } = useProfile()

  const handleRefresh = () => {
    mutate()
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-2">Erreur lors du chargement du profil</p>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.image} alt={user?.name || 'Utilisateur'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {user?.name || 'Utilisateur'}
                </h2>
                <Badge variant="secondary" className="w-fit">
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {user?.email || 'Email non renseigné'}
              </p>
              <p className="text-sm text-muted-foreground">
                Membre depuis {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileForm user={user} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecuritySettings user={user} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings user={user} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>
                Personnalisez votre expérience utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Les préférences seront disponibles prochainement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getRoleLabel(role) {
  switch (role) {
    case "ADMIN":
      return "Administrateur"
    case "CLIENT":
      return "Client"
    case "STAFF":
      return "Personnel"
    default:
      return role || "Utilisateur"
  }
}

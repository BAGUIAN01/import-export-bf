'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Shield
} from 'lucide-react'

import { GeneralSettings } from './general-settings'
import { SecuritySettings } from './security-settings'

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    {
      id: 'general',
      label: 'Général',
      icon: Settings
    },
    {
      id: 'security',
      label: 'Sécurité',
      icon: Shield
    }
  ]

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

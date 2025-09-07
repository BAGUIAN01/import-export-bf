'use client'

import { SessionProvider } from 'next-auth/react'
import { LayoutProvider } from '@/components/layout/admin/layout-provider'
import { MobileSidebar } from '@/components/layout/admin/sidebar/mobile-sidebar'
import { Sidebar } from '@/components/layout/admin/sidebar/sidebar'
import { Header } from '@/components/layout/admin/header'

export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <LayoutProvider>
        <div className="h-screen bg-background flex flex-col">
          <MobileSidebar />
          
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar fixe */}
          <Sidebar />
          
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header fixe */}
            <Header/>
            
            {/* Zone scrollable avec hauteur calculée */}
            <main className="flex-1 overflow-y-auto p-4">
              {children}
            </main>
          </div>
        </div>

        </div>
      </LayoutProvider>
    </SessionProvider>
  )
}
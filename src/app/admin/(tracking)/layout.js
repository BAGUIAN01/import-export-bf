'use client'

import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
import { LayoutProvider } from '@/components/layout/admin/layout-provider'
import { SWRProvider } from '@/components/providers/swr-provider'
import { MobileSidebar } from '@/components/layout/admin/sidebar/mobile-sidebar'
import { Sidebar } from '@/components/layout/admin/sidebar/sidebar'
import { Header } from '@/components/layout/admin/header'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <SWRProvider>
        <LayoutProvider>
          <div className={`h-screen bg-background flex flex-col ${inter.className}`}>
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
      </SWRProvider>
    </SessionProvider>
  )
}
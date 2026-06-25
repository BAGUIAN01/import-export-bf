'use client'

import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
import { LayoutProvider } from '@/components/layout/admin/layout-provider'
import { SWRProvider } from '@/components/providers/swr-provider'
import { MobileSidebar } from '@/components/layout/admin/sidebar/mobile-sidebar'
import { Sidebar } from '@/components/layout/admin/sidebar/sidebar'
import { Header } from '@/components/layout/admin/header'
import { AdminBottomNav } from '@/components/layout/admin/admin-bottom-nav'

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
          <div
            className={`h-[100dvh] bg-background flex flex-col ${inter.className}`}
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <MobileSidebar />

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar fixe */}
              <Sidebar />

              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header fixe */}
                <Header/>

                {/* Zone scrollable — marges réduites sur mobile pour occuper la largeur */}
                <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6">
                  {children}
                </main>
              </div>
            </div>

            {/* Bottom navbar mobile (style application) */}
            <AdminBottomNav />
          </div>
        </LayoutProvider>
      </SWRProvider>
    </SessionProvider>
  )
}
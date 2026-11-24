'use client'

import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { LayoutProvider } from '@/components/layout/admin/layout-provider'
import { SWRProvider } from '@/components/providers/swr-provider'
import { BarreGestion } from '@/components/gestion/barre-gestion'
import { geist, geistMono } from '@/lib/polices'

/**
 * Coquille de la gestion (conteneurs, colis, clients, encaissements, tarifs…) :
 * barre à onglets en haut comme la caisse, contenu défilant dessous.
 */
export default function GestionLayout({ children }) {
  // La coquille occupe tout l'écran et gère son défilement : pas de double barre.
  useEffect(() => {
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    // Les feuilles et menus s'ouvrent dans <body> (portail) : ils ont besoin des polices.
    document.body.classList.add(geist.variable, geistMono.variable)
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      document.body.classList.remove(geist.variable, geistMono.variable)
    }
  }, [])

  return (
    <SessionProvider>
      <SWRProvider>
        <LayoutProvider>
          <div
            className={`${geist.variable} ${geistMono.variable} flex h-[100dvh] flex-col bg-surface-page font-caisse`}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <BarreGestion />
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 lg:p-6">{children}</main>
          </div>
        </LayoutProvider>
      </SWRProvider>
    </SessionProvider>
  )
}

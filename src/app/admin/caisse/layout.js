"use client";

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import { CaisseProvider } from "@/contexts/caisse-context";
import { CaisseSidebar } from "@/components/layout/caisse-sidebar";
import { CaisseHeader } from "@/components/layout/caisse-header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

/**
 * Layout du module Caisse.
 * Routes couvertes : /admin/caisse/**
 */
export default function CaisseLayout({ children }) {
  // Verrouille le scroll global : la coquille caisse gère son propre scroll
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <CaisseProvider>
      <div className={`flex h-[100dvh] overflow-hidden bg-[#fafaf9] font-sans antialiased ${inter.className}`}>
        <CaisseSidebar />
        {/* Contenu principal — décalé selon la largeur du sidebar */}
        <main className="flex-1 flex flex-col min-w-0 md:ml-28 transition-all duration-300">
          <CaisseHeader />
          {/* Zone de contenu (hauteur = viewport - header) ; chaque page gère son scroll */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </CaisseProvider>
  );
}

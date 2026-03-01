"use client";

import { Inter } from 'next/font/google';
import { CaisseProvider } from "@/contexts/caisse-context";
import { CaisseSidebar } from "@/components/layout/caisse-sidebar";
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
  return (
    <CaisseProvider>
      <div className={`flex min-h-screen bg-[#fafaf9] font-sans antialiased ${inter.className}`}>
        <CaisseSidebar />
        {/* Contenu principal — décalé selon la largeur du sidebar */}
        <main className="flex-1 flex flex-col min-w-0 md:ml-28 transition-all duration-300">
          {children}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </CaisseProvider>
  );
}

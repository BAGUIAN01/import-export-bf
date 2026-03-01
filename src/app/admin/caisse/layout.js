"use client";

import { CaisseProvider } from "@/contexts/caisse-context";
import { CaisseSidebar } from "@/components/layout/caisse-sidebar";
import { Toaster } from "@/components/ui/sonner";

/**
 * Layout du module Caisse.
 * Routes couvertes : /admin/caisse/**
 */
export default function CaisseLayout({ children }) {
  return (
    <CaisseProvider>
      <div className="flex min-h-screen bg-[#fafaf9]">
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

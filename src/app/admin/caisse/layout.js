"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { CaisseProvider } from "@/contexts/caisse-context";
import { BarreCaisse } from "@/components/caisse/barre-caisse";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/**
 * Coquille de la caisse (routes /admin/caisse/**), pensée tablette d'abord :
 * une barre de 72 px en haut (accueil, étapes Client · Colis · Paiement,
 * conteneur en chargement, profil), le reste pour l'écran de l'étape.
 */
export default function CaisseLayout({ children }) {
  // La coquille gère son propre défilement : pas de double barre de défilement.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // Les feuilles s'ouvrent dans <body> (portail) : elles ont besoin des polices.
    document.body.classList.add(geist.variable, geistMono.variable);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.body.classList.remove(geist.variable, geistMono.variable);
    };
  }, []);

  return (
    <SessionProvider>
      <CaisseProvider>
        <div
          className={`caisse ${geist.variable} ${geistMono.variable} flex h-[100dvh] flex-col overflow-hidden bg-surface-page font-caisse text-[15px] text-ink antialiased`}
        >
          <BarreCaisse />
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
        <Toaster richColors position="top-center" />
      </CaisseProvider>
    </SessionProvider>
  );
}

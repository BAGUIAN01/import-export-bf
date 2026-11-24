"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { geist, geistMono } from "@/lib/polices";

/** Fournisseurs communs des modules plein écran (session, polices, défilement). */
export function FournisseursModule({ children }) {
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // Feuilles et menus en portail dans <body> : ils ont besoin des polices
    document.body.classList.add(geist.variable, geistMono.variable);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.body.classList.remove(geist.variable, geistMono.variable);
    };
  }, []);
  return (
    <SessionProvider>
      <div className={`${geist.variable} ${geistMono.variable}`}>{children}</div>
    </SessionProvider>
  );
}

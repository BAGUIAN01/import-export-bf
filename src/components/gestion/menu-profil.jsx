"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutGrid, LogOut } from "lucide-react";
import { initiales } from "@/lib/caisse/montants";
import { libelleRole } from "@/lib/roles";

/**
 * Avatar de la barre (caisse, gestion, retraits, paramétrage) : menu avec
 * l'accueil des modules, des liens propres à l'écran et la déconnexion.
 * `liens` : [{ href, libelle, icone }].
 */
export function MenuProfil({ nom, role, liens = [] }) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e) => {
      if (zone.current && !zone.current.contains(e.target)) setOuvert(false);
    };
    const echap = (e) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={`${nom || "Profil"} : menu`}
        onClick={() => setOuvert((v) => !v)}
        className="grid size-12 place-items-center rounded-full bg-ink text-sm font-semibold text-white"
      >
        {initiales(nom)}
      </button>
      {ouvert && (
        <div role="menu" className="absolute right-0 top-14 z-40 w-64 rounded-2xl border border-line bg-white p-2 text-[15px] shadow-xl">
          <div className="px-3 py-2">
            <div className="font-semibold">{nom || "Utilisateur"}</div>
            <div className="text-sm text-ink-muted">{libelleRole(role)}</div>
          </div>
          <Link role="menuitem" href="/admin" onClick={() => setOuvert(false)} className="flex h-12 items-center gap-3 rounded-xl px-3 hover:bg-surface-muted">
            <LayoutGrid className="size-5 text-ink-muted" aria-hidden="true" />
            Accueil des modules
          </Link>
          {liens.map(({ href, libelle, icone: Icone }) => (
            <Link key={href} role="menuitem" href={href} onClick={() => setOuvert(false)} className="flex h-12 items-center gap-3 rounded-xl px-3 hover:bg-surface-muted">
              <Icone className="size-5 text-ink-muted" aria-hidden="true" />
              {libelle}
            </Link>
          ))}
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

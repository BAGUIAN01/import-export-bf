"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronRight, LayoutGrid, LogOut } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { initiales } from "@/lib/caisse/montants";
import { libelleRole } from "@/lib/roles";

/**
 * Avatar de la barre (caisse, gestion, retraits, paramétrage) : menu avec
 * l'accueil des modules, des liens propres à l'écran et la déconnexion.
 * `liens` : [{ href, libelle, icone }].
 */
export function MenuProfil({ nom, role, liens = [] }) {
  const [ouvert, setOuvert] = useState(false);
  const [feuille, setFeuille] = useState(false);
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
        onClick={() => {
          // Téléphone : feuille du bas, comme le compte d'une application
          if (window.matchMedia("(max-width: 767px)").matches) setFeuille(true);
          else setOuvert((v) => !v);
        }}
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

      <Feuille ouvert={feuille} onFermer={() => setFeuille(false)} titre="Compte" largeur="max-w-md">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-page p-3">
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
            {initiales(nom)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{nom || "Utilisateur"}</span>
            <span className="text-sm text-ink-muted">{libelleRole(role)}</span>
          </span>
        </div>
        <ul className="-mx-2 mt-2 flex flex-col gap-1">
          {[{ href: "/admin", libelle: "Accueil des modules", icone: LayoutGrid }, ...liens].map(({ href, libelle, icone: Icone }) => (
            <li key={href}>
              <Link href={href} onClick={() => setFeuille(false)} className="flex h-14 items-center gap-3 rounded-2xl px-3 font-semibold active:bg-surface-page">
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-surface-muted text-ink-muted">
                  <Icone className="size-5" />
                </span>
                <span className="flex-1">{libelle}</span>
                <ChevronRight className="size-5 text-ink-subtle" aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex h-14 w-full items-center gap-3 rounded-2xl px-3 text-left font-semibold text-danger active:bg-danger-soft"
            >
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-danger-soft">
                <LogOut className="size-5" />
              </span>
              Se déconnecter
            </button>
          </li>
        </ul>
      </Feuille>
    </div>
  );
}

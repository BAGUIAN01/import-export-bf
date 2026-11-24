"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { initiales } from "@/lib/caisse/montants";

/** Carte de l'utilisateur dans l'en-tête de l'accueil : un toucher = se déconnecter. */
export function CarteUtilisateur({ nom, role }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      aria-label={`${nom}, ${role} : se déconnecter`}
      className="ml-auto flex h-[52px] items-center gap-2.5 rounded-[14px] border border-line bg-white py-0 pr-2 pl-1.5 text-left"
    >
      <span className="grid size-10 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{initiales(nom)}</span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="font-semibold">{nom}</span>
        <span className="text-xs text-ink-muted">{role}</span>
      </span>
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg text-ink-muted">
        <LogOut className="size-[18px]" />
      </span>
    </button>
  );
}

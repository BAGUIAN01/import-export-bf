"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid } from "lucide-react";
import { MenuProfil } from "@/components/gestion/menu-profil";
import { RechercheGlobale } from "@/components/recherche/recherche-globale";
import { cn } from "@/lib/utils";

/**
 * Barre de 72 px d'un module (Paramétrage, Retraits…), même dessin que la
 * caisse et la gestion : accueil des modules, titre, onglets, extras, profil.
 * `onglets` : [{ href, libelle, icone }] ; `sousTitre` sous le titre.
 */
export function BarreModule({ titre, sousTitre, onglets = [], droite = null }) {
  const chemin = usePathname() || "";
  const { data } = useSession();
  const nom = data?.user?.name || data?.user?.email || "";

  return (
    <header className="caisse flex h-16 shrink-0 items-center gap-2 border-b border-line bg-white px-3 font-caisse text-[15px] text-ink sm:h-[72px] sm:gap-3 lg:px-5">
      <Link href="/admin" aria-label="Accueil des modules" className="hidden size-12 shrink-0 place-items-center rounded-xl bg-ink text-white sm:grid">
        <LayoutGrid className="size-5" aria-hidden="true" />
      </Link>
      <span className={cn("flex min-w-0 flex-col leading-tight", onglets.length > 0 && "hidden max-md:flex min-[1180px]:flex")}>
        <span className="truncate text-lg font-semibold tracking-tight">{titre}</span>
        {sousTitre && <span className="truncate text-xs text-ink-muted">{sousTitre}</span>}
      </span>

      {onglets.length > 0 && (
        <nav aria-label={`Onglets : ${titre}`} className="hidden min-w-0 md:block lg:ml-2">
          <ul className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-surface-muted p-1 [scrollbar-width:none]">
            {onglets.map((o) => {
              const actif = chemin === o.href || chemin.startsWith(`${o.href}/`);
              const Icone = o.icone;
              return (
                <li key={o.href}>
                  <Link
                    href={o.href}
                    aria-current={actif ? "page" : undefined}
                    aria-label={o.libelle}
                    className={cn(
                      "flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl px-3 whitespace-nowrap",
                      actif ? "bg-brand font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]" : "font-medium text-ink-muted hover:text-ink"
                    )}
                  >
                    {Icone && <Icone className="size-5 shrink-0" aria-hidden="true" />}
                    <span className={cn(actif ? "inline" : "hidden min-[1000px]:inline")}>{o.libelle}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        <RechercheGlobale />
        {droite}
        <MenuProfil nom={nom} role={data?.user?.role} />
      </div>
    </header>
  );
}

/** Coquille plein écran d'un module : barre + contenu défilant. */
export function CoquilleModule({ barre, bas = null, children, defilement = true }) {
  return (
    <div className="flex h-[100dvh] flex-col bg-surface-page font-caisse" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {barre}
      <main className={cn("caisse min-h-0 flex-1 text-[15px] text-ink", defilement ? "overflow-y-auto overscroll-contain p-3 sm:p-4 lg:p-6" : "overflow-hidden")}>
        {children}
      </main>
      {bas}
    </div>
  );
}

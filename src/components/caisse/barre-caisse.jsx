"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Check, CreditCard, LayoutGrid, LogOut, Package, User } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { PastilleConteneur } from "@/components/caisse/pastille-conteneur";
import { initiales } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

const ETAPES = [
  { cle: "client", libelle: "Client", href: "/admin/caisse/client", icone: User, chemins: ["/admin/caisse/client", "/admin/caisse"] },
  { cle: "colis", libelle: "Colis", href: "/admin/caisse/commande", icone: Package, chemins: ["/admin/caisse/commande"] },
  {
    cle: "paiement",
    libelle: "Paiement",
    href: "/admin/caisse/encaissement",
    icone: CreditCard,
    chemins: ["/admin/caisse/encaissement", "/admin/caisse/impression", "/admin/caisse/terminer"],
  },
];

export const ROLES_LIBELLES = {
  ADMIN: "Administrateur",
  STAFF: "Caissier",
  AGENT: "Agent",
  TRACKER: "Suivi",
  CLIENT: "Client",
};

/** Profil courant : le chef de caisse (ADMIN) gère conteneurs et remises. */
export function useProfilCaisse() {
  const { data } = useSession();
  const role = data?.user?.role || "STAFF";
  return { nom: data?.user?.name || data?.user?.email || "", role, estChef: role === "ADMIN" };
}

export function BarreCaisse() {
  const chemin = (usePathname() || "").replace(/\/$/, "");
  const { selectedClient, orderItems } = useCaisse();
  const { nom, role, estChef } = useProfilCaisse();

  const indexActif = Math.max(
    0,
    ETAPES.findIndex((e) => e.chemins.includes(chemin))
  );
  const accessible = {
    client: true,
    colis: !!selectedClient,
    paiement: !!selectedClient && orderItems.length > 0,
  };

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-2 border-b border-line bg-white px-3 sm:gap-3 lg:px-5">
      <Link
        href="/admin"
        aria-label="Accueil des modules"
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-white"
      >
        <LayoutGrid className="size-5" aria-hidden="true" />
      </Link>
      <span className="hidden text-lg font-semibold tracking-tight min-[1180px]:block">Caisse</span>

      <nav aria-label="Étapes de la caisse" className="flex min-w-0 items-center gap-1 rounded-2xl bg-surface-muted p-1 lg:ml-2">
        {ETAPES.map((e, i) => {
          const actif = i === indexActif;
          const fait = i < indexActif;
          const ok = accessible[e.cle];
          const Icone = e.icone;
          const contenu = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
                  actif ? "bg-white/20" : fait ? "bg-brand text-white" : "bg-white text-ink-muted"
                )}
              >
                {fait ? <Check className="size-4" /> : <Icone className="size-4" />}
              </span>
              <span className={cn("flex min-w-0 flex-col leading-tight", !actif && "hidden sm:flex")}>
                <span className="truncate">{e.libelle}</span>
                {e.cle === "client" && selectedClient && (
                  <span className={cn("hidden max-w-[140px] truncate text-[11px] font-normal min-[1180px]:block", actif ? "text-white/80" : "text-ink-muted")}>
                    {selectedClient.name || `${selectedClient.firstName ?? ""} ${selectedClient.lastName ?? ""}`}
                  </span>
                )}
                {e.cle === "colis" && orderItems.length > 0 && (
                  <span className={cn("hidden text-[11px] font-normal min-[1180px]:block", actif ? "text-white/80" : "text-ink-muted")}>
                    {orderItems.reduce((s, x) => s + x.quantity, 0)} article(s)
                  </span>
                )}
              </span>
            </>
          );
          const classe = cn(
            "flex h-12 min-w-12 items-center gap-2 rounded-xl px-2 text-[15px] sm:px-3",
            actif
              ? "bg-brand font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
              : "font-medium text-ink-muted",
            !ok && "opacity-45"
          );
          return ok && !actif ? (
            <Link key={e.cle} href={e.href} className={classe}>
              {contenu}
            </Link>
          ) : (
            <span key={e.cle} aria-current={actif ? "step" : undefined} aria-disabled={!ok || undefined} className={classe}>
              {contenu}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <PastilleConteneur peutGerer={estChef} />
        <MenuProfil nom={nom} role={role} />
      </div>
    </header>
  );
}

function MenuProfil({ nom, role }) {
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
        <div role="menu" className="absolute right-0 top-14 z-40 w-64 rounded-2xl border border-line bg-white p-2 shadow-xl">
          <div className="px-3 py-2">
            <div className="font-semibold">{nom || "Utilisateur"}</div>
            <div className="text-sm text-ink-muted">{ROLES_LIBELLES[role] || role}</div>
          </div>
          <Link role="menuitem" href="/admin" className="flex h-12 items-center gap-3 rounded-xl px-3 hover:bg-surface-muted">
            <LayoutGrid className="size-5 text-ink-muted" aria-hidden="true" />
            Accueil des modules
          </Link>
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

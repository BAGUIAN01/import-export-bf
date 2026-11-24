"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Container as IconeConteneur, LayoutDashboard, LayoutGrid, Package, PackageCheck, Receipt, Settings, Tag, UserCog, Users } from "lucide-react";
import { MenuProfil } from "@/components/gestion/menu-profil";
import { canAccess } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const ONGLETS = [
  { href: "/admin/containers", libelle: "Conteneurs", icone: IconeConteneur },
  { href: "/admin/packages", libelle: "Colis", icone: Package },
  { href: "/admin/clients", libelle: "Clients", icone: Users },
  { href: "/admin/retraits", libelle: "Retraits", icone: PackageCheck },
  { href: "/admin/shipments", libelle: "Encaissements", icone: Receipt },
  { href: "/admin/tarifs", libelle: "Tarifs", icone: Tag },
];

/**
 * Barre de la gestion, même dessin que la caisse : accueil des modules,
 * onglets en pilule (icône seule sous 1180 px sauf l'onglet actif),
 * conteneur en chargement, profil.
 */
export function BarreGestion() {
  const chemin = usePathname() || "";
  const { data } = useSession();
  const role = data?.user?.role;
  const nom = data?.user?.name || data?.user?.email || "";
  const onglets = role ? ONGLETS.filter((o) => canAccess(role, o.href)) : ONGLETS;
  const conteneur = useConteneurEnCours();

  return (
    <header className="caisse flex h-[72px] shrink-0 items-center gap-2 border-b border-line bg-white px-3 font-caisse text-[15px] text-ink sm:gap-3 lg:px-5">
      <Link href="/admin" aria-label="Accueil des modules" className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-white">
        <LayoutGrid className="size-5" aria-hidden="true" />
      </Link>
      <span className="hidden text-lg font-semibold tracking-tight min-[1180px]:block">Gestion</span>

      <nav aria-label="Onglets de la gestion" className="min-w-0 lg:ml-2">
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
                  <Icone className="size-5 shrink-0" aria-hidden="true" />
                  <span className={cn(actif ? "inline" : "hidden min-[1180px]:inline")}>{o.libelle}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {conteneur && (
          <Link
            href={`/admin/containers/${conteneur.id}`}
            className="hidden h-12 items-center gap-2.5 rounded-2xl border-2 border-brand bg-brand-soft/60 px-3 md:flex"
          >
            <span aria-hidden="true" className="size-2.5 rounded-full bg-brand" />
            <span className="flex flex-col leading-tight">
              <span className="hidden text-[11px] font-medium text-brand-strong min-[1180px]:block">En chargement</span>
              <span className="chiffres text-sm font-semibold">
                {conteneur.containerNumber}
                <span className="font-normal text-ink-muted"> · {conteneur.packagesCount ?? 0}</span>
              </span>
            </span>
          </Link>
        )}
        <MenuProfil
          nom={nom}
          role={role}
          liens={[
            { href: "/admin/dashboard", libelle: "Tableau de bord", icone: LayoutDashboard },
            { href: "/admin/profile", libelle: "Mon profil", icone: UserCog },
            ...(role && canAccess(role, "/admin/parametrage") ? [{ href: "/admin/parametrage", libelle: "Paramétrage", icone: Settings }] : []),
          ]}
        />
      </div>
    </header>
  );
}

/** Conteneur qui reçoit les colis (le plus proche du départ). */
function useConteneurEnCours() {
  const [c, setC] = useState(null);
  useEffect(() => {
    let actif = true;
    fetch("/api/containers?limit=50")
      .then((r) => (r.ok ? r.json() : { containers: [] }))
      .then((d) => {
        if (!actif) return;
        const ouverts = (d.containers || []).filter((x) => x.status === "PREPARATION");
        ouverts.sort((a, b) => new Date(a.departureDate || 8.64e15) - new Date(b.departureDate || 8.64e15));
        setC(ouverts[0] || null);
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, []);
  return c;
}

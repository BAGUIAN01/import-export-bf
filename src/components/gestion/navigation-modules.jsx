"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Container as IconeConteneur, LayoutDashboard, LayoutGrid, PackageCheck, Receipt, ShoppingBag, UserCog } from "lucide-react";
import { OngletsBas } from "@/components/gestion/onglets-bas";
import { canAccess } from "@/lib/rbac";

// Barres du bas des retraits et de la caisse (téléphone), scanneur au centre.
// Elles ne s'affichent que sur les écrans d'accueil du module : les étapes
// (colis, paiement, panier…) ont déjà leur barre d'action en bas.

const sansBarre = (chemin) => (chemin || "").replace(/\/$/, "");

/** Écrans des retraits qui ont la barre du bas : la liste des destinataires. */
export function basRetraits(chemin) {
  return sansBarre(chemin) === "/admin/retraits";
}

/** Écrans de la caisse qui ont la barre du bas : choix du client, reçus, conteneurs. */
export function basCaisse(chemin) {
  return ["/admin/caisse/client", "/admin/caisse/recus", "/admin/caisse/conteneurs"].includes(sansBarre(chemin));
}

const MODULES = { href: "/admin", libelle: "Accueil des modules", court: "Modules", icone: LayoutGrid };
const PROFIL = { href: "/admin/profile", libelle: "Mon profil", icone: UserCog };

export function NavigationBasRetraits() {
  const chemin = usePathname() || "";
  const { data } = useSession();
  const role = data?.user?.role;
  if (!role || !basRetraits(chemin)) return null;
  const onglets = [
    { href: "/admin/retraits", libelle: "Retraits", icone: PackageCheck },
    ...(canAccess(role, "/admin/caisse") ? [{ href: "/admin/caisse/client", libelle: "Caisse", icone: ShoppingBag }] : []),
    ...(canAccess(role, "/admin/containers") ? [{ href: "/admin/containers", libelle: "Gestion", icone: IconeConteneur }] : []),
  ];
  const liens = [...(canAccess(role, "/admin/dashboard") ? [{ href: "/admin/dashboard", libelle: "Tableau de bord", icone: LayoutDashboard }] : []), MODULES, PROFIL];
  return <OngletsBas onglets={onglets} liens={liens} scanner />;
}

export function NavigationBasCaisse() {
  const chemin = usePathname() || "";
  const { data } = useSession();
  const role = data?.user?.role;
  if (!role || !basCaisse(chemin)) return null;
  const chef = role === "ADMIN" || role === "CHEF_CAISSE";
  const onglets = [
    { href: "/admin/caisse/client", libelle: "Nouvel envoi", court: "Caisse", icone: ShoppingBag },
    { href: "/admin/caisse/recus", libelle: "Reçus du jour", court: "Reçus", icone: Receipt },
    ...(chef ? [{ href: "/admin/caisse/conteneurs", libelle: "Conteneurs de la caisse", court: "Conteneurs", icone: IconeConteneur }] : []),
  ];
  const liens = [
    ...(canAccess(role, "/admin/retraits") ? [{ href: "/admin/retraits", libelle: "Retraits", icone: PackageCheck }] : []),
    ...(canAccess(role, "/admin/containers") ? [{ href: "/admin/containers", libelle: "Gestion", icone: LayoutDashboard }] : []),
    MODULES,
    PROFIL,
  ];
  return <OngletsBas onglets={onglets} liens={liens} scanner />;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, ChevronLeft, Container as IconeConteneur, CreditCard, LayoutGrid, Package, Receipt, User } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { PastilleConteneur } from "@/components/caisse/pastille-conteneur";
import { MenuProfil } from "@/components/gestion/menu-profil";
import { RechercheGlobale } from "@/components/recherche/recherche-globale";
import { basCaisse } from "@/components/gestion/navigation-modules";
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


/** Profil courant : le chef de caisse (ADMIN) gère conteneurs et remises. */
export function useProfilCaisse() {
  const { data } = useSession();
  const role = data?.user?.role || "STAFF";
  return { nom: data?.user?.name || data?.user?.email || "", role, estChef: role === "ADMIN" || role === "CHEF_CAISSE" };
}

export function BarreCaisse() {
  const chemin = (usePathname() || "").replace(/\/$/, "");
  const { selectedClient, orderItems } = useCaisse();
  const { nom, role, estChef } = useProfilCaisse();

  // -1 sur les écrans Conteneurs et Reçus : aucune étape en cours
  const indexActif = ETAPES.findIndex((e) => e.chemins.includes(chemin));
  const accessible = {
    client: true,
    colis: !!selectedClient,
    paiement: !!selectedClient && orderItems.length > 0,
  };

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-2 border-b border-line bg-white px-3 sm:h-[72px] sm:gap-3 lg:px-5">
      <Link
        href="/admin"
        aria-label="Accueil des modules"
        className="hidden size-12 shrink-0 place-items-center rounded-xl bg-ink text-white sm:grid"
      >
        <LayoutGrid className="size-5" aria-hidden="true" />
      </Link>
      <span className="hidden text-lg font-semibold tracking-tight min-[1180px]:block">Caisse</span>

      {/* Téléphone, Reçus et Conteneurs : retour à la caisse (client ou colis en cours) */}
      {indexActif < 0 && (
        <Link
          href={selectedClient ? "/admin/caisse/commande" : "/admin/caisse/client"}
          className="-ml-1.5 flex h-11 min-w-0 items-center rounded-xl pr-2 text-[17px] font-medium text-brand-strong active:opacity-60 sm:hidden"
        >
          <ChevronLeft className="size-7 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          Caisse
        </Link>
      )}
      {/* Téléphone : l'étape en titre, la progression sous la barre */}
      <div className={cn("min-w-0 flex-1 leading-tight sm:hidden", indexActif < 0 && "invisible")}>
        <div className="text-[11px] font-medium text-ink-muted">{indexActif >= 0 ? `Caisse · étape ${indexActif + 1} sur ${ETAPES.length}` : "Caisse"}</div>
        <div className="truncate text-[17px] font-semibold">
          {indexActif >= 0 ? ETAPES[indexActif].libelle : chemin === "/admin/caisse/recus" ? "Reçus du jour" : "Conteneurs"}
          {indexActif > 0 && selectedClient && <span className="font-normal text-ink-muted"> · {selectedClient.name || selectedClient.lastName}</span>}
        </div>
      </div>
      {indexActif >= 0 && (
        <div aria-hidden="true" className="absolute inset-x-3 bottom-0 flex gap-1 sm:hidden">
          {ETAPES.map((e, i) => (
            <span key={e.cle} className={cn("h-[3px] flex-1 rounded-full", i <= indexActif ? "bg-brand" : "bg-line")} />
          ))}
        </div>
      )}

      <nav aria-label="Étapes de la caisse" className="hidden min-w-0 items-center gap-1 rounded-2xl bg-surface-muted p-1 sm:flex lg:ml-2">
        {ETAPES.map((e, i) => {
          const actif = i === indexActif;
          const fait = indexActif > 0 && i < indexActif;
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
              <span className={cn("flex min-w-0 flex-col leading-tight", !actif && "hidden min-[960px]:flex")}>
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

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Téléphone : le scanneur est au centre de la barre du bas (client, reçus, conteneurs) */}
        <RechercheGlobale prefere="client" scanTelephone={!basCaisse(chemin)} />
        <Link
          href="/admin/caisse/recus"
          aria-label="Reçus du jour"
          aria-current={chemin === "/admin/caisse/recus" ? "page" : undefined}
          className={cn("hidden size-12 place-items-center rounded-xl border sm:grid", chemin === "/admin/caisse/recus" ? "border-brand bg-brand-soft text-brand-strong" : "border-line text-ink-muted")}
        >
          <Receipt className="size-5" aria-hidden="true" />
        </Link>
        {estChef && (
          <Link
            href="/admin/caisse/conteneurs"
            aria-label="Conteneurs"
            aria-current={chemin === "/admin/caisse/conteneurs" ? "page" : undefined}
            className={cn("hidden size-12 place-items-center rounded-xl border sm:grid", chemin === "/admin/caisse/conteneurs" ? "border-brand bg-brand-soft text-brand-strong" : "border-line text-ink-muted")}
          >
            <IconeConteneur className="size-5" aria-hidden="true" />
          </Link>
        )}
        <PastilleConteneur peutGerer={estChef} />
        <MenuProfil
          nom={nom}
          role={role}
          liens={[
            { href: "/admin/caisse/recus", libelle: "Reçus du jour", icone: Receipt },
            ...(estChef ? [{ href: "/admin/caisse/conteneurs", libelle: "Conteneurs de la caisse", icone: IconeConteneur }] : []),
          ]}
        />
      </div>
    </header>
  );
}

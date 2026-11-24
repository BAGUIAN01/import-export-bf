"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, ChevronDown, CreditCard, LayoutGrid, Package, UserRound } from "lucide-react";
import { useRetraits } from "@/contexts/retraits-context";
import { MenuProfil } from "@/components/gestion/menu-profil";
import { RechercheGlobale } from "@/components/recherche/recherche-globale";
import { Feuille } from "@/components/caisse/feuille";
import { devise } from "@/lib/devises";
import { resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

const ETAPES = [
  { cle: "destinataire", libelle: "Destinataire", href: "/admin/retraits", icone: UserRound, chemins: ["/admin/retraits"] },
  { cle: "colis", libelle: "Colis", href: "/admin/retraits/colis", icone: Package, chemins: ["/admin/retraits/colis"] },
  { cle: "paiement", libelle: "Paiement", href: "/admin/retraits/paiement", icone: CreditCard, chemins: ["/admin/retraits/paiement", "/admin/retraits/fin"] },
];

const jourMois = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : null);

/** Barre des retraits, même dessin que la caisse : étapes Destinataire · Colis · Paiement. */
export function BarreRetraits() {
  const chemin = (usePathname() || "").replace(/\/$/, "");
  const { data } = useSession();
  const { envoi, verifies, conteneur, agence, envois, donnees, changerConteneur } = useRetraits();
  const [feuille, setFeuille] = useState(false);

  const indexActif = ETAPES.findIndex((e) => e.chemins.includes(chemin));
  const colisOk = !!envoi && (envoi.packages || []).length > 0 && verifies.length === envoi.packages.length;
  const accessible = { destinataire: true, colis: !!envoi && !envoi.deliveredAt, paiement: colisOk && resteEnvoi(envoi) > 0.009 };

  return (
    <header className="caisse flex h-[72px] shrink-0 items-center gap-2 border-b border-line bg-white px-3 font-caisse text-[15px] text-ink sm:gap-3 lg:px-5">
      <Link href="/admin" aria-label="Accueil des modules" className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-white">
        <LayoutGrid className="size-5" aria-hidden="true" />
      </Link>
      <span className="hidden flex-col leading-tight min-[1180px]:flex">
        <span className="text-lg font-semibold tracking-tight">Retraits</span>
        {agence && <span className="text-xs text-ink-muted">{agence.ville} · {devise(agence.devise).symbole}</span>}
      </span>

      <nav aria-label="Étapes du retrait" className="flex min-w-0 items-center gap-1 rounded-2xl bg-surface-muted p-1 lg:ml-2">
        {ETAPES.map((e, i) => {
          const actif = i === indexActif;
          const fait = indexActif > 0 && i < indexActif;
          const ok = accessible[e.cle];
          const Icone = e.icone;
          const contenu = (
            <>
              <span aria-hidden="true" className={cn("grid size-7 shrink-0 place-items-center rounded-full", actif ? "bg-white/20" : fait ? "bg-brand text-white" : "bg-white text-ink-muted")}>
                {fait ? <Check className="size-4" /> : <Icone className="size-4" />}
              </span>
              <span className={cn("flex min-w-0 flex-col leading-tight", !actif && "hidden min-[960px]:flex")}>
                <span className="truncate">{e.libelle}</span>
                {e.cle === "destinataire" && envoi && (
                  <span className={cn("hidden max-w-[150px] truncate text-[11px] font-normal min-[1180px]:block", actif ? "text-white/80" : "text-ink-muted")}>
                    {envoi.client?.recipientName || envoi.shipmentNumber}
                  </span>
                )}
                {e.cle === "colis" && envoi && (
                  <span className={cn("hidden text-[11px] font-normal min-[1180px]:block", actif ? "text-white/80" : "text-ink-muted")}>
                    {envoi.deliveredAt ? "Remis" : `${verifies.length} / ${(envoi.packages || []).length} vérifiés`}
                  </span>
                )}
              </span>
            </>
          );
          const classe = cn(
            "flex h-12 min-w-12 items-center gap-2 rounded-xl px-2 text-[15px] sm:px-3",
            actif ? "bg-brand font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]" : "font-medium text-ink-muted",
            !ok && !actif && "opacity-45"
          );
          return ok && !actif ? (
            <Link key={e.cle} href={e.href} className={classe}>
              {contenu}
            </Link>
          ) : (
            <span key={e.cle} aria-current={actif ? "step" : undefined} aria-disabled={!ok && !actif ? true : undefined} className={classe}>
              {contenu}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <RechercheGlobale prefere="envoi" />
        {conteneur && (
          <button type="button" onClick={() => setFeuille(true)} className="flex h-12 items-center gap-2.5 rounded-2xl border-2 border-brand bg-brand-soft/60 px-3 text-left">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-brand" />
            <span className="flex flex-col leading-tight">
              <span className="hidden text-[11px] font-medium text-brand-strong sm:block">
                {conteneur.status === "DELIVERED" ? `Arrivé${conteneur.actualArrival ? ` le ${jourMois(conteneur.actualArrival)}` : ""}` : "En douane"}
              </span>
              <span className="chiffres text-sm font-semibold">
                {conteneur.containerNumber}
                <span className="font-normal text-ink-muted">
                  {" "}
                  · {envois.filter((x) => x.deliveredAt).length} / {envois.length}
                </span>
              </span>
            </span>
            <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />
          </button>
        )}
        <MenuProfil nom={data?.user?.name || data?.user?.email || ""} role={data?.user?.role} />
      </div>

      {feuille && (
        <Feuille ouvert onFermer={() => setFeuille(false)} titre="Conteneurs arrivés" sousTitre="Les retraits se font conteneur par conteneur." largeur="max-w-md">
          <ul className="flex flex-col gap-2">
            {(donnees?.conteneurs || []).map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => {
                    changerConteneur(x.id);
                    setFeuille(false);
                  }}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left", x.id === conteneur?.id ? "border-2 border-brand bg-brand-soft/50" : "border-line")}
                >
                  <span>
                    <span className="chiffres block font-semibold">{x.containerNumber}</span>
                    <span className="text-sm text-ink-muted">
                      {x.status === "DELIVERED" ? `Arrivé${x.actualArrival ? ` le ${jourMois(x.actualArrival)}` : ""}` : "En douane"} · {x.shipmentsCount} envois
                    </span>
                  </span>
                  {x.id === conteneur?.id && <Check className="size-5 text-brand" aria-label="Choisi" />}
                </button>
              </li>
            ))}
          </ul>
        </Feuille>
      )}
    </header>
  );
}

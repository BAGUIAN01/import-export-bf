"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PackageSearch } from "lucide-react";
import { useRetraits } from "@/contexts/retraits-context";
import { Etat, Pastilles, Recherche } from "@/components/epure";
import { ZoneActualisable } from "@/components/gestion/actualisation";
import { formatDevise } from "@/lib/devises";
import { initiales } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";
import { sansAccents } from "@/lib/caisse/familles";
import { resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

const FILTRES = [
  { id: "aRetirer", label: "À retirer", test: (e) => !e.deliveredAt },
  { id: "reste", label: "Reste à payer", test: (e) => !e.deliveredAt && resteEnvoi(e) > 0.009 },
  { id: "retires", label: "Retirés", test: (e) => !!e.deliveredAt },
];

/**
 * Retraits · 1. Destinataire
 * Comme l'étape Client de la caisse : chercher le destinataire (nom,
 * téléphone, n° de suivi) dans le conteneur arrivé, puis passer aux colis.
 */
export default function RetraitsDestinatairePage() {
  const router = useRouter();
  const { donnees, envois, agence, conteneur, envoi, choisir, charger } = useRetraits();
  const [filtre, setFiltre] = useState("aRetirer");
  const [recherche, setRecherche] = useState("");

  const q = sansAccents(recherche).trim();
  const liste = envois
    .filter(FILTRES.find((f) => f.id === filtre).test)
    .filter((e) => !q || sansAccents(`${e.shipmentNumber} ${e.client?.recipientName} ${e.client?.recipientPhone} ${e.client?.firstName} ${e.client?.lastName}`).includes(q));
  const aRetirer = envois.filter((e) => !e.deliveredAt);
  const aEncaisser = aRetirer.reduce((s, e) => s + resteEnvoi(e), 0);

  function ouvrir(e) {
    if (e.id !== envoi?.id) choisir(e);
    router.push(e.deliveredAt ? "/admin/retraits/fin" : "/admin/retraits/colis");
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-col gap-3 border-b border-line bg-surface-page px-4 pt-4 pb-3 sm:px-6 lg:pt-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Destinataire</h1>
            <p className="text-ink-muted">Cherchez par nom, téléphone ou n° de suivi.</p>
          </div>
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="Nom, téléphone, n° de suivi" libelle="Rechercher un destinataire" className="h-14 rounded-2xl" />
          <Pastilles options={FILTRES.map((f) => ({ id: f.id, label: f.label, compte: envois.filter(f.test).length }))} valeur={filtre} onChange={setFiltre} libelle="Filtrer" />
        </div>

        <ZoneActualisable onActualiser={charger} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {donnees === null ? (
            <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="h-[84px] animate-pulse rounded-2xl bg-white" />
              ))}
            </ul>
          ) : !conteneur ? (
            <Vide texte="Aucun conteneur arrivé pour l'instant." />
          ) : liste.length === 0 ? (
            <Vide texte="Personne dans cette liste." />
          ) : (
            <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {liste.map((e) => {
                const nom = e.client?.recipientName || nomAffiche(e.client);
                const reste = resteEnvoi(e);
                const nb = (e.packages || []).reduce((s, p) => s + (p.totalQuantity || 1), 0);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => ouvrir(e)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,20,.04)] active:bg-surface-page",
                        e.id === envoi?.id ? "border-2 border-brand bg-brand-soft/40" : "border-line"
                      )}
                    >
                      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-ink-muted">
                        {initiales(nom)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-base font-semibold">{nom}</span>
                        <span className="chiffres truncate text-[13px] text-ink-muted">
                          {affichageTelephone(e.client?.recipientPhone) || "—"} · {e.shipmentNumber}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {e.deliveredAt ? <Etat ton="vert">Retiré</Etat> : reste > 0.009 ? <Etat ton="ambre">Reste {formatDevise(reste, agence)}</Etat> : <Etat ton="vert">Soldé</Etat>}
                          <span className="text-xs text-ink-subtle">
                            {nb} colis · de {nomAffiche(e.client)}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-brand" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ZoneActualisable>
      </div>

      {/* Panneau droit en paysage : le conteneur du jour */}
      <aside aria-label="Conteneur" className="hidden min-h-0 flex-col gap-3 overflow-y-auto border-l border-line bg-white p-5 lg:flex">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Conteneur</h2>
        <div className="rounded-[20px] bg-ink p-5 text-white">
          <div className="text-sm text-white/70">À encaisser au retrait</div>
          <div className="chiffres mt-1 text-[32px] font-semibold leading-none tracking-tight">{donnees ? formatDevise(aEncaisser, agence) : "…"}</div>
          <div className="mt-3 text-sm text-white/70">{conteneur ? `${conteneur.containerNumber} · ${aRetirer.length} envoi(s) à retirer` : "—"}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line p-3">
            <div className="text-xs text-ink-muted">À retirer</div>
            <div className="chiffres text-lg font-semibold">{aRetirer.length}</div>
          </div>
          <div className="rounded-2xl border border-line p-3">
            <div className="text-xs text-ink-muted">Retirés</div>
            <div className="chiffres text-lg font-semibold">{envois.length - aRetirer.length}</div>
          </div>
        </div>
        <p className="rounded-2xl bg-surface-page p-4 text-sm text-ink-muted">
          Touchez un destinataire, cochez ses colis, encaissez le reste en {agence ? agence.devise === "XOF" ? "FCFA" : agence.devise : "devise locale"}, puis remettez.
        </p>
      </aside>
    </div>
  );
}

function Vide({ texte }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">
      <PackageSearch className="size-10 text-line-strong" aria-hidden="true" />
      {texte}
    </div>
  );
}

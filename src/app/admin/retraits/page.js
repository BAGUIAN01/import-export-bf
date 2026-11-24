"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { BarreModule, CoquilleModule } from "@/components/gestion/barre-module";
import { Feuille } from "@/components/caisse/feuille";
import { DetailRetrait } from "@/components/retraits/detail-retrait";
import { devise, formatDevise } from "@/lib/devises";
import { nomAffiche } from "@/lib/caisse/clients";
import { sansAccents } from "@/lib/caisse/familles";
import { resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

const FILTRES = [
  { cle: "aRetirer", libelle: "À retirer", test: (e) => !e.deliveredAt },
  { cle: "reste", libelle: "Reste à payer", test: (e) => !e.deliveredAt && resteEnvoi(e) > 0.009 },
  { cle: "retires", libelle: "Retirés", test: (e) => !!e.deliveredAt },
];

const jourMois = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : null);

/**
 * Retraits à l'arrivée (agence d'arrivée, ex. Ouagadougou en FCFA)
 * Liste des destinataires du conteneur arrivé, puis la remise : colis
 * vérifiés, reste encaissé dans la devise de l'agence, pièce notée.
 */
export default function RetraitsPage() {
  const [donnees, setDonnees] = useState(null);
  const [conteneurId, setConteneurId] = useState(null);
  const [filtre, setFiltre] = useState("aRetirer");
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState(null);
  const [feuilleConteneur, setFeuilleConteneur] = useState(false);

  const charger = useCallback((id) => {
    fetch(`/api/retraits${id ? `?conteneur=${id}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setDonnees(d);
      })
      .catch((e) => {
        toast.error(e.message);
        setDonnees({ envois: [], conteneurs: [] });
      });
  }, []);
  useEffect(() => charger(conteneurId), [charger, conteneurId]);

  const agence = donnees?.agence;
  const envois = useMemo(() => donnees?.envois || [], [donnees]);
  const q = sansAccents(recherche).trim();
  const liste = envois
    .filter(FILTRES.find((f) => f.cle === filtre).test)
    .filter((e) => !q || sansAccents(`${e.shipmentNumber} ${e.client?.recipientName} ${e.client?.recipientPhone} ${e.client?.firstName} ${e.client?.lastName} ${e.client?.phone}`).includes(q));
  const envoiChoisi = envois.find((e) => e.id === choisi);
  const c = donnees?.conteneur;

  function remis(maj) {
    setDonnees((d) => ({ ...d, envois: d.envois.map((e) => (e.id === maj.id ? { ...e, ...maj } : e)) }));
  }

  const pastille = c ? (
    <button type="button" onClick={() => setFeuilleConteneur(true)} className="flex h-12 items-center gap-2.5 rounded-2xl border-2 border-brand bg-brand-soft/60 px-3 text-left">
      <span aria-hidden="true" className="size-2.5 rounded-full bg-brand" />
      <span className="flex flex-col leading-tight">
        <span className="hidden text-[11px] font-medium text-brand-strong sm:block">
          {c.status === "DELIVERED" ? `Arrivé${c.actualArrival ? ` le ${jourMois(c.actualArrival)}` : ""}` : "En douane"}
        </span>
        <span className="chiffres text-sm font-semibold">
          {c.containerNumber}
          <span className="font-normal text-ink-muted">
            {" "}
            · {envois.filter((e) => e.deliveredAt).length} / {envois.length}
          </span>
        </span>
      </span>
      <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />
    </button>
  ) : null;

  return (
    <CoquilleModule
      defilement={false}
      barre={<BarreModule titre="Retraits" sousTitre={agence ? `${agence.nom} · ${devise(agence.devise).symbole}` : "Agence d'arrivée"} droite={pastille} />}
    >
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        {/* Liste des destinataires */}
        <section aria-label="Destinataires" className={cn("min-h-0 flex-col border-line bg-surface-page lg:flex lg:border-r", envoiChoisi ? "hidden" : "flex")}>
          <div className="flex flex-col gap-3 p-4">
            <label className="relative flex h-14 items-center rounded-2xl border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="sr-only">Rechercher un destinataire</span>
              <Search className="ml-4 size-5 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Nom, téléphone, n° d'envoi"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {recherche && (
                <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="mr-1 grid size-11 place-items-center rounded-xl text-ink-muted">
                  <X className="size-5" aria-hidden="true" />
                </button>
              )}
            </label>
            <div role="tablist" aria-label="Filtrer" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {FILTRES.map((f) => (
                <button
                  key={f.cle}
                  type="button"
                  role="tab"
                  aria-selected={filtre === f.cle}
                  onClick={() => setFiltre(f.cle)}
                  className={cn("flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5", filtre === f.cle ? "border-brand bg-brand font-semibold text-white" : "border-line bg-white font-medium")}
                >
                  {f.libelle}
                  <span className={cn("chiffres text-xs", filtre === f.cle ? "text-white/80" : "text-ink-muted")}>{envois.filter(f.test).length}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pb-4">
            {donnees === null ? (
              [0, 1, 2, 3].map((i) => <li key={i} className="h-[84px] animate-pulse rounded-2xl bg-white" aria-hidden="true" />)
            ) : !c ? (
              <li className="rounded-2xl border border-dashed border-line-strong bg-white p-6 text-center text-ink-muted">Aucun conteneur arrivé pour l&apos;instant.</li>
            ) : liste.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-line-strong bg-white p-6 text-center text-ink-muted">Personne dans cette liste.</li>
            ) : (
              liste.map((e) => {
                const reste = resteEnvoi(e);
                const nb = (e.packages || []).reduce((s, p) => s + (p.totalQuantity || 1), 0);
                const actif = e.id === choisi;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setChoisi(e.id)}
                      className={cn("flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left", actif ? "border-2 border-brand bg-brand-soft/40" : "border-line")}
                    >
                      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-ink-muted">
                        {(e.client?.recipientName || nomAffiche(e.client)).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{e.client?.recipientName || nomAffiche(e.client)}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {e.deliveredAt ? (
                            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong">
                              <Check className="size-3" aria-hidden="true" />
                              Retiré
                            </span>
                          ) : reste > 0.009 ? (
                            <span className="chiffres rounded-full bg-alerte-soft px-2 py-0.5 text-xs font-medium text-alerte">Reste {formatDevise(reste, agence)}</span>
                          ) : (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong">Soldé</span>
                          )}
                          <span className="chiffres text-[13px] text-ink-muted">
                            {nb} colis · {e.shipmentNumber}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-brand" aria-hidden="true" />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {/* Remise */}
        <section aria-label="Remise des colis" className={cn("min-h-0 flex-col bg-white lg:flex", envoiChoisi ? "flex" : "hidden")}>
          {envoiChoisi ? (
            <DetailRetrait key={envoiChoisi.id} envoi={envoiChoisi} agence={agence} onRetour={() => setChoisi(null)} onRemis={remis} />
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-ink-muted">Choisissez un destinataire dans la liste.</div>
          )}
        </section>
      </div>

      {feuilleConteneur && (
        <Feuille ouvert onFermer={() => setFeuilleConteneur(false)} titre="Conteneurs arrivés" sousTitre="Les retraits se font conteneur par conteneur." largeur="max-w-md">
          <ul className="flex flex-col gap-2">
            {(donnees?.conteneurs || []).map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => {
                    setConteneurId(x.id);
                    setChoisi(null);
                    setFeuilleConteneur(false);
                  }}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left", x.id === c?.id ? "border-2 border-brand bg-brand-soft/50" : "border-line")}
                >
                  <span>
                    <span className="chiffres block font-semibold">{x.containerNumber}</span>
                    <span className="text-sm text-ink-muted">
                      {x.status === "DELIVERED" ? `Arrivé${x.actualArrival ? ` le ${jourMois(x.actualArrival)}` : ""}` : "En douane"} · {x.shipmentsCount} envois
                    </span>
                  </span>
                  {x.id === c?.id && <Check className="size-5 text-brand" aria-label="Choisi" />}
                </button>
              </li>
            ))}
          </ul>
        </Feuille>
      )}
    </CoquilleModule>
  );
}

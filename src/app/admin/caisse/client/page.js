"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, ScanLine, Search, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { useCaisse } from "@/contexts/caisse-context";
import { CarteClient } from "@/components/caisse/client/carte-client";
import { NouveauClient } from "@/components/caisse/client/nouveau-client";
import { BandeauJour, PanneauJour, useJournee } from "@/components/caisse/client/panneau-jour";
import { nomAffiche, resteDu, versClientCaisse } from "@/lib/caisse/clients";
import { formatMontant } from "@/lib/caisse/montants";
import { Feuille } from "@/components/caisse/feuille";
import { Scanneur } from "@/components/recherche/scanneur";
import { vibrer } from "@/lib/vibrer";
import { cn } from "@/lib/utils";

/**
 * Caisse · 1. Client
 * Chercher (nom, téléphone, code client) ou créer le client, puis passer aux colis.
 * Paysage : liste à gauche, panneau « Aujourd'hui » à droite.
 */
export default function CaisseClientPage() {
  const router = useRouter();
  const { selectedClient, setSelectedClient, orderItems, orderTotal } = useCaisse();
  const { stats, depart } = useJournee();

  const [recents, setRecents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState(null);
  const [cherche, setCherche] = useState(false);
  const [vue, setVue] = useState("recents");
  const [nouveau, setNouveau] = useState(false);
  const [scan, setScan] = useState(false);
  const [auto, setAuto] = useState(false); // après un scan : un seul client trouvé = on le prend

  /* ── Clients récents (et ceux qui ont un reste à payer) ── */
  useEffect(() => {
    let actif = true;
    fetch("/api/clients?limit=100")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Erreur ${r.status}`))))
      .then((d) => actif && setRecents(Array.isArray(d) ? d : d?.data || []))
      .catch(() => actif && toast.error("Impossible de charger les clients."))
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
  }, []);

  /* ── Recherche pendant la frappe ── */
  useEffect(() => {
    const q = recherche.trim();
    if (q.length < 2) {
      setResultats(null);
      setCherche(false);
      return;
    }
    setCherche(true);
    const controle = new AbortController();
    // Recherche intelligente (comme la barre de recherche) : noms sans accents ni
    // fautes, destinataire, téléphone sous toutes les formes, code client, n° de
    // suivi ou QR du bordereau (on prend le client de l'envoi).
    const minuteur = setTimeout(
      () => {
        fetch(`/api/recherche?q=${encodeURIComponent(q)}`, { signal: controle.signal })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Erreur ${r.status}`))))
          .then((d) => {
            const vus = new Map();
            for (const g of d.groupes || []) {
              if (g.type !== "client" && g.type !== "envoi") continue;
              for (const r of g.resultats) if (r.client && !vus.has(r.client.id)) vus.set(r.client.id, r.client);
            }
            setResultats([...vus.values()]);
          })
          .catch((e) => e.name !== "AbortError" && toast.error("La recherche n'a pas abouti."))
          .finally(() => !controle.signal.aborted && setCherche(false));
      },
      auto ? 0 : 250
    );
    return () => {
      clearTimeout(minuteur);
      controle.abort();
    };
  }, [recherche, auto]);

  const choisir = useCallback(
    (client) => {
      setSelectedClient(versClientCaisse(client));
      router.push("/admin/caisse/commande");
    },
    [setSelectedClient, router]
  );

  // Bordereau scanné : un seul client trouvé, on passe directement à ses colis
  useEffect(() => {
    if (!auto || cherche || resultats === null) return;
    setAuto(false);
    if (resultats.length === 1) {
      vibrer();
      toast.success(`${nomAffiche(resultats[0])} : client retrouvé.`);
      choisir(resultats[0]);
    }
  }, [auto, cherche, resultats, choisir]);

  const surScan = useCallback((texte) => {
    setScan(false);
    setRecherche(texte);
    setAuto(true);
  }, []);

  const aSolder = useMemo(() => recents.filter((c) => resteDu(c) > 0), [recents]);
  const enRecherche = recherche.trim().length >= 2;
  const liste = enRecherche ? resultats || [] : vue === "solder" ? aSolder : recents.slice(0, 30);


  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)]">
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-col gap-3 border-b border-line bg-surface-page px-4 pt-4 pb-3 sm:px-6 lg:pt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Client</h1>
              <p className="text-ink-muted">Cherchez par nom, téléphone ou code client.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <label className="relative flex h-14 min-w-0 flex-1 items-center rounded-2xl border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="sr-only">Rechercher un client</span>
              <Search className="ml-4 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Nom, téléphone, n° de suivi"
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {cherche && <Loader2 className="mr-2 size-5 animate-spin text-ink-muted" aria-label="Recherche en cours" />}
              {recherche ? (
                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  aria-label="Effacer la recherche"
                  className="mr-1 grid size-11 place-items-center rounded-xl text-ink-muted"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              ) : (
                // Client qui revient : on scanne son bordereau
                <button
                  type="button"
                  onClick={() => setScan(true)}
                  aria-label="Scanner un bordereau"
                  title="Scanner le QR code du bordereau"
                  className="mr-1 grid size-11 place-items-center rounded-xl text-brand-strong hover:bg-brand-soft"
                >
                  <ScanLine className="size-5" aria-hidden="true" />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setNouveau(true)}
              className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-brand px-4 font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)] sm:px-5"
            >
              <Plus className="size-5" aria-hidden="true" />
              <span>Client</span>
            </button>
          </div>

          <BandeauJour stats={stats} />

          {!enRecherche && (
            <div role="tablist" aria-label="Listes de clients" className="flex gap-1 self-start rounded-2xl bg-surface-muted p-1">
              {[
                { cle: "recents", libelle: "Clients récents" },
                { cle: "solder", libelle: "À solder", nombre: aSolder.length },
              ].map((o) => (
                <button
                  key={o.cle}
                  type="button"
                  role="tab"
                  aria-selected={vue === o.cle}
                  onClick={() => setVue(o.cle)}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-xl px-4 text-[15px]",
                    vue === o.cle ? "bg-white font-semibold text-ink shadow-sm" : "font-medium text-ink-muted"
                  )}
                >
                  {o.libelle}
                  {o.nombre > 0 && (
                    <span className="chiffres rounded-full bg-alerte-soft px-2 text-xs font-semibold text-alerte">{o.nombre}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="defilant min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {selectedClient && !enRecherche && (
            <button
              type="button"
              onClick={() => router.push("/admin/caisse/commande")}
              className="mb-4 flex w-full items-center gap-3 rounded-2xl border-2 border-brand bg-brand-soft/50 p-4 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-brand-strong">Client en cours</span>
                <span className="block truncate text-lg font-semibold">{nomAffiche(selectedClient)}</span>
                {orderItems.length > 0 && (
                  <span className="chiffres block text-sm text-ink-muted">
                    {orderItems.reduce((s, i) => s + i.quantity, 0)} article(s) · {formatMontant(orderTotal)}
                  </span>
                )}
              </span>
              <span className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white">
                Continuer
                <ArrowRight className="size-5" aria-hidden="true" />
              </span>
            </button>
          )}

          {enRecherche && (
            <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
              {cherche ? "Recherche…" : `${liste.length} client${liste.length > 1 ? "s" : ""} pour « ${recherche.trim()} »`}
            </p>
          )}

          {/* Squelette pendant le chargement, et pendant une première recherche (pas « Aucun client » trop tôt) */}
          {(chargement && !enRecherche) || (enRecherche && cherche && resultats === null) ? (
            <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="h-[84px] animate-pulse rounded-2xl bg-white" />
              ))}
            </ul>
          ) : liste.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center">
              <UserX className="size-10 text-line-strong" aria-hidden="true" />
              <p className="text-ink-muted">
                {enRecherche ? "Aucun client ne correspond." : vue === "solder" ? "Aucun client n'a de reste à payer." : "Aucun client pour l'instant."}
              </p>
              {enRecherche && !cherche && (
                <button type="button" onClick={() => setNouveau(true)} className="flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white">
                  <Plus className="size-5" aria-hidden="true" />
                  Créer « {recherche.trim()} »
                </button>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {liste.map((c) => (
                <li key={c.id}>
                  <CarteClient client={c} onChoisir={choisir} choisi={selectedClient?.id === c.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PanneauJour stats={stats} depart={depart} />

      <Feuille ouvert={scan} onFermer={() => setScan(false)} titre="Scanner le bordereau" sousTitre="QR code du bordereau d'un client qui revient" largeur="max-w-md">
        {scan && <Scanneur onLu={surScan} />}
      </Feuille>

      {nouveau && (
        <NouveauClient
          rechercheInitiale={liste.length === 0 ? recherche : ""}
          onFermer={() => setNouveau(false)}
          onCree={(client) => {
            setNouveau(false);
            toast.success(`${nomAffiche(client)} est enregistré.`);
            choisir(client);
          }}
        />
      )}
    </div>
  );
}

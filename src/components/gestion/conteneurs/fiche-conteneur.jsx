"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, Printer, Search } from "lucide-react";
import { BoutonActionConteneur } from "@/components/gestion/conteneurs/action-conteneur";
import { ContainerDetailView } from "@/components/modules/admin/containers/container-detail-view";
import { STATUTS_CONTENEUR } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";
import { PACKAGE_TYPES } from "@/lib/data/packages";
import { sansAccents } from "@/lib/caisse/familles";
import { cn } from "@/lib/utils";

const ONGLETS = [
  { cle: "envois", libelle: "Envois" },
  { cle: "colis", libelle: "Colis" },
  { cle: "manifeste", libelle: "Manifeste" },
  { cle: "suivi", libelle: "Suivi" },
];

const STATUT_PAIEMENT = {
  PAID: { libelle: "Soldé", classe: "bg-brand-soft text-brand-strong" },
  PARTIAL: { libelle: "Acompte", classe: "bg-alerte-soft text-alerte" },
  PENDING: { libelle: "À payer", classe: "bg-alerte-soft text-alerte" },
  CANCELLED: { libelle: "Annulé", classe: "bg-surface-muted text-ink-muted" },
  REFUNDED: { libelle: "Remboursé", classe: "bg-surface-muted text-ink-muted" },
};

const LIBELLE_TYPE = Object.fromEntries(PACKAGE_TYPES.map((t) => [t.value, t.label]));

function typesDe(colis) {
  try {
    const t = typeof colis.types === "string" ? JSON.parse(colis.types) : colis.types;
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}

/**
 * Fiche d'un conteneur : en-tête (statut, action suivante) et onglets
 * Envois · Colis · Manifeste · Suivi (écran de suivi existant).
 */
export function FicheConteneur({ container: initial, currentUser }) {
  const [c, setC] = useState(initial);
  const [onglet, setOnglet] = useState("envois");
  const [envois, setEnvois] = useState(null);
  const [colis, setColis] = useState(null);
  const [recherche, setRecherche] = useState("");
  const statut = STATUTS_CONTENEUR[c.status] || STATUTS_CONTENEUR.PREPARATION;
  const peutAgir = ["ADMIN", "TRACKER", "CHEF_CAISSE", "STAFF"].includes(currentUser?.role);

  useEffect(() => {
    let actif = true;
    fetch(`/api/shipments?containerId=${c.id}&limit=500`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => actif && setEnvois(d.data || []))
      .catch(() => actif && setEnvois([]));
    fetch(`/api/containers/${c.id}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => actif && setColis(d.container?.packages || d.packages || []))
      .catch(() => actif && setColis([]));
    return () => {
      actif = false;
    };
  }, [c.id]);

  const q = sansAccents(recherche).trim();
  const envoisFiltres = (envois || []).filter(
    (e) => !q || sansAccents(`${e.shipmentNumber} ${e.client?.firstName} ${e.client?.lastName} ${e.client?.phone} ${e.client?.recipientName}`).includes(q)
  );
  const colisFiltres = (colis || []).filter(
    (p) => !q || sansAccents(`${p.packageNumber} ${p.description} ${p.client?.firstName} ${p.client?.lastName}`).includes(q)
  );

  const total = (envois || []).reduce((s, e) => s + (e.totalAmount || 0), 0);
  const paye = (envois || []).reduce((s, e) => s + (e.paidAmount || 0), 0);
  const remis = (envois || []).filter((e) => e.deliveredAt).length;

  // Manifeste : quantités par type de colis
  const manifeste = useMemo(() => {
    const parType = new Map();
    for (const p of colis || []) {
      for (const t of typesDe(p)) {
        const cle = t.type || "OTHER";
        parType.set(cle, (parType.get(cle) || 0) + (t.quantity || 1));
      }
    }
    return [...parType.entries()].map(([type, quantite]) => ({ type, libelle: LIBELLE_TYPE[type] || type, quantite })).sort((a, b) => b.quantite - a.quantite);
  }, [colis]);
  const totalQuantite = manifeste.reduce((s, m) => s + m.quantite, 0);

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-4 text-[15px] text-ink">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/admin/containers" aria-label="Retour aux conteneurs" className="grid size-12 place-items-center rounded-xl border border-line-strong bg-white">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="chiffres text-2xl font-semibold tracking-tight">{c.containerNumber}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-medium", statut.classe)}>{statut.libelle}</span>
            {c.sealNumber && (
              <span className="flex items-center gap-1 text-sm text-ink-muted">
                <Lock className="size-4" aria-hidden="true" />
                Plomb <span className="chiffres">{c.sealNumber}</span>
              </span>
            )}
          </div>
          <p className="text-ink-muted">
            {c.origin || "France"} → {c.destination || "Burkina Faso"}
            {c.departureDate ? ` · départ ${new Date(c.actualDeparture || c.departureDate).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>
        {peutAgir && <BoutonActionConteneur conteneur={{ ...c, packagesCount: colis?.length ?? c.packagesCount }} onFait={(maj) => maj && setC((x) => ({ ...x, ...maj }))} />}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
        {[
          { libelle: "Envois", valeur: envois ? envois.length : "…" },
          { libelle: "Colis", valeur: colis ? `${colis.length}${c.capacity ? ` / ${c.capacity}` : ""}` : "…" },
          { libelle: "Encaissé", valeur: envois ? formatMontant(paye) : "…", detail: envois && total - paye > 0 ? `reste ${formatMontant(total - paye)}` : null },
          { libelle: "Remis", valeur: envois ? `${remis} / ${envois.length}` : "…" },
        ].map((x) => (
          <div key={x.libelle} className="rounded-2xl border border-line bg-white p-4">
            <dt className="text-sm text-ink-muted">{x.libelle}</dt>
            <dd className="chiffres mt-1 text-xl font-semibold">{x.valeur}</dd>
            {x.detail && <dd className="chiffres text-xs text-alerte">{x.detail}</dd>}
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div role="tablist" aria-label="Fiche du conteneur" className="flex gap-1 rounded-2xl bg-surface-muted p-1">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              type="button"
              role="tab"
              aria-selected={onglet === o.cle}
              onClick={() => setOnglet(o.cle)}
              className={cn("h-11 rounded-xl px-4", onglet === o.cle ? "bg-white font-semibold shadow-sm" : "font-medium text-ink-muted")}
            >
              {o.libelle}
            </button>
          ))}
        </div>
        {(onglet === "envois" || onglet === "colis") && (
          <label className="relative flex h-11 min-w-[220px] flex-1 items-center rounded-xl border border-line-strong bg-white">
            <span className="sr-only">Rechercher</span>
            <Search className="ml-3 size-4 text-ink-muted" aria-hidden="true" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={onglet === "envois" ? "Client, téléphone, n° d'envoi" : "N° de colis, client, description"}
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none"
            />
          </label>
        )}
        {onglet === "manifeste" && (
          <button type="button" onClick={() => window.print()} className="flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-white px-4 font-semibold">
            <Printer className="size-4" aria-hidden="true" />
            Imprimer
          </button>
        )}
      </div>

      {onglet === "envois" &&
        (envois === null ? (
          <Chargement />
        ) : envoisFiltres.length === 0 ? (
          <Vide texte="Aucun envoi dans ce conteneur." />
        ) : (
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {envoisFiltres.map((e) => {
              const sp = STATUT_PAIEMENT[e.paymentStatus] || STATUT_PAIEMENT.PENDING;
              const reste = Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0));
              return (
                <li key={e.id}>
                  <Link href={`/admin/shipments/${e.id}`} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 active:bg-surface-page">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{nomAffiche(e.client)}</div>
                        <div className="chiffres truncate text-[13px] text-ink-muted">
                          {affichageTelephone(e.client?.phone)} · {e.shipmentNumber}
                        </div>
                      </div>
                      {e.deliveredAt ? (
                        <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Remis
                        </span>
                      ) : (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", sp.classe)}>{sp.libelle}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-ink-muted">
                        {e.packagesCount} colis{e.client?.recipientName ? ` · pour ${e.client.recipientName}` : ""}
                        {e.client?.recipientCity ? ` (${e.client.recipientCity})` : ""}
                      </span>
                      <span className="chiffres font-semibold">
                        {formatMontant(e.totalAmount)}
                        {reste > 0 && <span className="ml-2 font-normal text-alerte">reste {formatMontant(reste)}</span>}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}

      {onglet === "colis" &&
        (colis === null ? (
          <Chargement />
        ) : colisFiltres.length === 0 ? (
          <Vide texte="Aucun colis dans ce conteneur." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {colisFiltres.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.description}</div>
                  <div className="chiffres truncate text-[13px] text-ink-muted">
                    {p.packageNumber} · {nomAffiche(p.client)}
                  </div>
                </div>
                <span className="chiffres text-sm text-ink-muted">× {p.totalQuantity}</span>
                <span className="chiffres w-24 text-right font-semibold">{formatMontant(p.totalAmount)}</span>
              </li>
            ))}
          </ul>
        ))}

      {onglet === "manifeste" &&
        (colis === null ? (
          <Chargement />
        ) : (
          <section aria-label="Manifeste" className="rounded-2xl border border-line bg-white p-5 print:border-0 print:p-0">
            <h2 className="text-lg font-semibold">Manifeste · {c.containerNumber}</h2>
            <p className="mb-4 text-sm text-ink-muted">
              {c.origin || "France"} → {c.destination || "Burkina Faso"} · {envois?.length ?? 0} envois · {totalQuantite} colis
              {c.sealNumber ? ` · plomb ${c.sealNumber}` : ""}
            </p>
            <table className="w-full text-left">
              <thead className="border-b border-line text-sm text-ink-muted">
                <tr>
                  <th className="py-2 font-medium">Type de colis</th>
                  <th className="py-2 text-right font-medium">Quantité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {manifeste.map((m) => (
                  <tr key={m.type}>
                    <td className="py-2">{m.libelle}</td>
                    <td className="chiffres py-2 text-right font-semibold">{m.quantite}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-ink">
                <tr>
                  <td className="py-2 font-semibold">Total</td>
                  <td className="chiffres py-2 text-right font-semibold">{totalQuantite}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        ))}

      {onglet === "suivi" && (
        <div className="font-sans">
          <ContainerDetailView container={c} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
}

function Chargement() {
  return (
    <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="h-[92px] animate-pulse rounded-2xl bg-white" />
      ))}
    </ul>
  );
}

function Vide({ texte }) {
  return <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">{texte}</p>;
}

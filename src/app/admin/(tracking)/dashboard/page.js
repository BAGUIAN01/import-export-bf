"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Bloc, EnTete, Etat, StatCard, StatGrid } from "@/components/epure";
import { STATUTS_CONTENEUR, trierConteneurs } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";

const TON = { PREPARATION: "ambre", LOADED: "bleu", IN_TRANSIT: "bleu", CUSTOMS: "violet", DELIVERED: "vert", CANCELLED: "rouge" };
const PAIEMENT = { PAID: ["Soldé", "vert"], PARTIAL: ["Acompte", "ambre"], PENDING: ["À payer", "ambre"] };

const lire = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

/** Gestion · Tableau de bord : la journée, les conteneurs, les derniers envois. */
export default function TableauDeBordPage() {
  const router = useRouter();
  const [jour, setJour] = useState(null);
  const [conteneurs, setConteneurs] = useState(null);
  const [envois, setEnvois] = useState(null);

  useEffect(() => {
    lire("/api/caisse/stats").then((d) => setJour(d?.stats || {}));
    lire("/api/containers/resume").then((d) => setConteneurs(d?.containers || []));
    lire("/api/shipments?limit=8").then((d) => setEnvois(d?.data || []));
  }, []);

  const liste = trierConteneurs(conteneurs || []).filter((c) => c.status !== "DELIVERED" || c.shipmentsCount > c.deliveredCount).slice(0, 6);
  const aEncaisser = (conteneurs || []).reduce((n, c) => n + Math.max(0, c.totalAmount - c.paidAmount), 0);
  const enRoute = (conteneurs || []).filter((c) => ["LOADED", "IN_TRANSIT", "CUSTOMS"].includes(c.status)).length;
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete chemin="Gestion / Tableau de bord" titre="Tableau de bord" sousTitre={<span className="first-letter:uppercase">{date}</span>} />

      <StatGrid>
        <StatCard variant="noire" label="Encaissé aujourd'hui" value={jour ? formatMontant(jour.totalRevenue || 0) : "…"} detail={jour ? `${jour.totalSales || 0} envois · ${jour.totalItems || 0} colis` : null} />
        <StatCard couleur="vert" label="Panier moyen" value={jour ? formatMontant(jour.averageTicket || 0) : "…"} />
        <StatCard couleur="bleu" label="Conteneurs en route" value={conteneurs ? enRoute : "…"} />
        <StatCard couleur="ambre" label="Reste à encaisser" value={conteneurs ? formatMontant(aEncaisser) : "…"} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bloc
          titre="Conteneurs"
          actions={
            <Link href="/admin/containers" className="flex items-center gap-1 text-sm font-semibold text-brand">
              Tous
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          }
        >
          {conteneurs === null ? (
            <p className="text-ink-muted">Chargement…</p>
          ) : liste.length === 0 ? (
            <p className="text-ink-muted">Aucun conteneur en cours.</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {liste.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => router.push(`/admin/containers/${c.id}`)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-surface-page">
                    <span className="chiffres min-w-0 flex-1 truncate font-semibold">{c.containerNumber}</span>
                    <Etat ton={TON[c.status]}>{STATUTS_CONTENEUR[c.status]?.libelle}</Etat>
                    <span className="chiffres w-24 text-right text-sm text-ink-muted">
                      {c.status === "DELIVERED" ? `${c.shipmentsCount - c.deliveredCount} à remettre` : `${c.packagesCount} colis`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        <Bloc
          titre="Derniers envois"
          actions={
            <Link href="/admin/shipments" className="flex items-center gap-1 text-sm font-semibold text-brand">
              Tous
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          }
        >
          {envois === null ? (
            <p className="text-ink-muted">Chargement…</p>
          ) : envois.length === 0 ? (
            <p className="text-ink-muted">Aucun envoi.</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {envois.map((e) => {
                const p = e.deliveredAt ? ["Remis", "vert"] : PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING;
                return (
                  <li key={e.id}>
                    <button type="button" onClick={() => router.push(`/admin/shipments/${e.id}`)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-surface-page">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{nomAffiche(e.client)}</span>
                        <span className="chiffres block text-[13px] text-ink-muted">{e.shipmentNumber}</span>
                      </span>
                      <Etat ton={p[1]}>{p[0]}</Etat>
                      <span className="chiffres w-24 text-right">{formatMontant(e.totalAmount)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Bloc>
      </div>
    </div>
  );
}

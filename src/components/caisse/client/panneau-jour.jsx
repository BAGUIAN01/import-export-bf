"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Container as IconeConteneur, Info } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { STATUTS_CONTENEUR } from "@/components/caisse/pastille-conteneur";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

/** Chiffres du jour (GET /api/caisse/stats) et prochain départ. */
export function useJournee() {
  const [stats, setStats] = useState(null);
  const [depart, setDepart] = useState(null);
  useEffect(() => {
    let actif = true;
    fetch("/api/caisse/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => actif && d && setStats(d))
      .catch(() => {});
    fetch("/api/next-departure")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => actif && d?.hasNextDeparture && setDepart(d.container))
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, []);
  return { stats, depart };
}

/** Trois chiffres en bandeau (tablette en portrait). */
export function BandeauJour({ stats }) {
  const s = stats?.stats;
  const cases = [
    { libelle: "Encaissé", valeur: s ? formatMontant(s.totalRevenue) : "…" },
    { libelle: "Envois", valeur: s ? String(s.totalSales) : "…" },
    { libelle: "Colis", valeur: s ? String(s.totalItems) : "…" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 lg:hidden">
      {cases.map((c) => (
        <div key={c.libelle} className="rounded-2xl border border-line bg-white px-3 py-2.5">
          <div className="text-xs text-ink-muted">{c.libelle} aujourd&apos;hui</div>
          <div className="chiffres truncate text-lg font-semibold">{c.valeur}</div>
        </div>
      ))}
    </div>
  );
}

/** Panneau droit en paysage : la journée, le conteneur, les infos utiles. */
export function PanneauJour({ stats, depart }) {
  const { selectedContainer: c } = useCaisse();
  const s = stats?.stats;
  const aSolder = (stats?.ordersByStatus || []).filter((o) => o.status === "PENDING").reduce((n, o) => n + o.count, 0);
  const modes = (stats?.paymentMethods || []).slice().sort((a, b) => b.count - a.count);
  const remplissage = c?.capacity ? Math.min(100, Math.round(((c.packagesCount || 0) / c.capacity) * 100)) : null;

  return (
    <aside aria-label="Aujourd'hui" className="hidden min-h-0 flex-col gap-3 overflow-y-auto border-l border-line bg-white p-5 lg:flex">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Aujourd&apos;hui</h2>

      <div className="rounded-[20px] bg-ink p-5 text-white">
        <div className="text-sm text-white/70">Encaissé aujourd&apos;hui</div>
        <div className="chiffres mt-1 text-[34px] font-semibold leading-none tracking-tight">{s ? formatMontant(s.totalRevenue) : "…"}</div>
        <div className="mt-3 text-sm text-white/70">
          {s ? `${s.totalSales} envoi${s.totalSales > 1 ? "s" : ""} · ${s.totalItems} colis` : "Chargement…"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line p-3">
          <div className="text-xs text-ink-muted">Panier moyen</div>
          <div className="chiffres text-lg font-semibold">{s ? formatMontant(s.averageTicket) : "…"}</div>
        </div>
        <div className="rounded-2xl border border-line p-3">
          <div className="text-xs text-ink-muted">Envois à solder</div>
          <div className={cn("chiffres text-lg font-semibold", aSolder > 0 && "text-alerte")}>{stats ? aSolder : "…"}</div>
        </div>
      </div>

      {c && (
        <section aria-label="Conteneur en chargement" className="rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl bg-[#FFEDD5] text-[#C2410C]">
              <IconeConteneur className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="chiffres font-semibold">{c.containerNumber}</div>
              <div className="text-sm text-ink-muted">
                {c.packagesCount ?? 0} colis{c.capacity ? ` sur ${c.capacity}` : ""}
              </div>
            </div>
            {STATUTS_CONTENEUR[c.status] && (
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUTS_CONTENEUR[c.status].classe)}>
                {STATUTS_CONTENEUR[c.status].libelle}
              </span>
            )}
          </div>
          {remplissage !== null && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-brand" style={{ width: `${remplissage}%` }} />
            </div>
          )}
          {c.departureDate && (
            <div className="mt-2 text-sm text-ink-muted">
              Départ prévu le {new Date(c.departureDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </div>
          )}
        </section>
      )}

      {modes.length > 0 && (
        <section aria-label="Modes de paiement du jour" className="rounded-2xl border border-line p-4">
          <h3 className="mb-2 text-sm font-semibold">Modes de paiement</h3>
          <ul className="flex flex-col gap-2">
            {modes.map((m) => (
              <li key={m.method} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-ink-muted">{m.method === "NON_SPECIFIE" ? "Non précisé" : m.method}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round(m.percentage)}%` }} />
                </span>
                <span className="chiffres w-8 text-right">{m.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Infos utiles" className="flex flex-col gap-2 rounded-2xl bg-surface-page p-4 text-sm">
        <h3 className="font-semibold">Infos utiles</h3>
        {depart && (
          <p className="flex gap-2 text-ink-muted">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>
              Prochain départ : <span className="chiffres font-medium text-ink">{depart.containerNumber}</span>
              {depart.departureDate ? ` le ${new Date(depart.departureDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : ""}.
            </span>
          </p>
        )}
        <p className="flex gap-2 text-ink-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>Un client qui revient dans le même conteneur garde le même envoi : ses nouveaux colis s&apos;y ajoutent.</span>
        </p>
      </section>
    </aside>
  );
}

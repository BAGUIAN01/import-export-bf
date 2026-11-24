import Link from "next/link";
import { ChevronRight, Container as IconeConteneur, Lock } from "lucide-react";
import { STATUTS_CONTENEUR, joursAvant } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { BoutonActionConteneur } from "@/components/gestion/conteneurs/action-conteneur";
import { cn } from "@/lib/utils";

const jourMois = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null);

/** Carte d'un conteneur dans la liste de la gestion. */
export function CarteConteneur({ conteneur: c, onMaj, peutAgir }) {
  const statut = STATUTS_CONTENEUR[c.status] || STATUTS_CONTENEUR.PREPARATION;
  const reste = Math.max(0, (c.totalAmount || 0) - (c.paidAmount || 0));
  const remplissage = c.capacity ? Math.min(100, Math.round(((c.packagesCount || 0) / c.capacity) * 100)) : null;
  const jours = c.status === "PREPARATION" ? joursAvant(c.departureDate) : null;
  const arrive = c.status === "DELIVERED";
  const aRetirer = Math.max(0, (c.shipmentsCount || 0) - (c.deliveredCount || 0));

  return (
    <article className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,20,.04)]">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#FFEDD5] text-[#C2410C]">
          <IconeConteneur className="size-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="chiffres text-lg font-semibold">{c.containerNumber}</h3>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statut.classe)}>{statut.libelle}</span>
            {c.sealNumber && (
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <Lock className="size-3.5" aria-hidden="true" />
                <span className="chiffres">{c.sealNumber}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted">
            {c.origin || "France"} → {c.destination || "Burkina Faso"}
            {c.departureDate ? ` · départ ${c.actualDeparture ? "le" : "prévu le"} ${jourMois(c.actualDeparture || c.departureDate)}` : ""}
            {c.actualArrival ? ` · arrivé le ${jourMois(c.actualArrival)}` : c.arrivalDate ? ` · arrivée prévue le ${jourMois(c.arrivalDate)}` : ""}
          </p>
        </div>
        {jours !== null && jours >= 0 && jours <= 7 && (
          <span className="shrink-0 rounded-full bg-alerte-soft px-2.5 py-0.5 text-xs font-medium text-alerte">
            {jours === 0 ? "part aujourd'hui" : `part dans ${jours} j`}
          </span>
        )}
      </div>

      {remplissage !== null && !arrive && (
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink-muted">Remplissage</span>
            <span className="chiffres font-medium">
              {c.packagesCount} / {c.capacity} colis
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-brand" style={{ width: `${remplissage}%` }} />
          </div>
        </div>
      )}

      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-page px-3 py-2">
          <dt className="text-xs text-ink-muted">{arrive ? "Envois remis" : "Envois"}</dt>
          <dd className="chiffres text-base font-semibold">{arrive ? `${c.deliveredCount} / ${c.shipmentsCount}` : c.shipmentsCount}</dd>
        </div>
        <div className="rounded-xl bg-surface-page px-3 py-2">
          <dt className="text-xs text-ink-muted">Montant</dt>
          <dd className="chiffres truncate text-base font-semibold">{formatMontant(c.totalAmount)}</dd>
        </div>
        <div className={cn("rounded-xl px-3 py-2", reste > 0 ? "bg-alerte-soft" : "bg-brand-soft")}>
          <dt className={cn("text-xs", reste > 0 ? "text-alerte" : "text-brand-strong")}>{reste > 0 ? "À encaisser" : "Encaissé"}</dt>
          <dd className={cn("chiffres truncate text-base font-semibold", reste > 0 ? "text-alerte" : "text-brand-strong")}>{formatMontant(reste > 0 ? reste : c.paidAmount)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/containers/${c.id}`} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-line-strong bg-white px-4 font-semibold">
          {arrive && aRetirer > 0 ? `${aRetirer} envoi${aRetirer > 1 ? "s" : ""} à remettre` : "Ouvrir"}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
        {peutAgir && <BoutonActionConteneur conteneur={c} onFait={onMaj} className="flex-1" />}
      </div>
    </article>
  );
}

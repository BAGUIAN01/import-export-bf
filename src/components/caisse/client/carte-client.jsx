import { ChevronRight, Star } from "lucide-react";
import { formatMontant, initiales } from "@/lib/caisse/montants";
import { nomAffiche, resteDu, telephoneAffiche } from "@/lib/caisse/clients";
import { cn } from "@/lib/utils";

/** Carte d'un client dans la liste : toucher = choisir et passer aux colis. */
export function CarteClient({ client, onChoisir, choisi }) {
  const nom = nomAffiche(client);
  const reste = resteDu(client);
  const destinataire = [client.recipientName, client.recipientCity].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={() => onChoisir(client)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,20,.04)] active:bg-surface-page",
        choisi ? "border-2 border-brand bg-brand-soft/40" : "border-line"
      )}
    >
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-ink-muted">
        {initiales(nom)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-semibold">{nom}</span>
          {client.isVip && <Star className="size-4 shrink-0 fill-[#F5B014] text-[#F5B014]" aria-label="Client VIP" />}
        </span>
        <span className="chiffres truncate text-[13px] text-ink-muted">
          {telephoneAffiche(client.phone)}
          {client.clientCode ? ` · ${client.clientCode}` : ""}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {reste > 0 && (
            <span className="rounded-full bg-alerte-soft px-2 py-0.5 text-xs font-medium text-alerte">
              Reste {formatMontant(reste)}
            </span>
          )}
          {destinataire && <span className="truncate text-xs text-ink-subtle">Pour {destinataire}</span>}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-brand" aria-hidden="true" />
    </button>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen, X } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche, telephoneAffiche } from "@/lib/caisse/clients";
import { cn } from "@/lib/utils";

/**
 * Ticket de l'envoi : client, lignes (quantité modifiable au toucher), total
 * et bouton Payer. Paysage : colonne de droite. Portrait : bas de l'écran.
 */
export function Ticket({ onQuantite, className }) {
  const { selectedClient: c, orderItems, removeItem, orderSubtotal, remiseMontant, orderTotal } = useCaisse();
  const nbArticles = orderItems.reduce((s, i) => s + i.quantity, 0);
  const destinataire = [c?.recipientName, c?.recipientCity].filter(Boolean).join(" · ");

  return (
    <section aria-label="Ticket" className={cn("flex min-h-0 flex-col bg-white", className)}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold">{nomAffiche(c)}</div>
          <div className="truncate text-[13px] text-ink-muted">
            <span className="chiffres">{telephoneAffiche(c?.phone)}</span>
            {destinataire ? ` · pour ${destinataire}` : ""}
          </div>
        </div>
        <Link href="/admin/caisse/client" className="flex h-11 items-center rounded-xl border border-line-strong px-3 text-sm font-semibold">
          Changer
        </Link>
      </header>

      {orderItems.length === 0 ? (
        <div className="flex min-h-[96px] flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-ink-muted">
          <PackageOpen className="size-9 text-line-strong" aria-hidden="true" />
          <p>Touchez un article pour l&apos;ajouter.</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain">
          {orderItems.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <VignetteArticle code={l.type} taille="size-11" icone="size-5" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.name}</div>
                <div className="chiffres truncate text-[13px] text-ink-muted">
                  {formatMontant(l.price)}
                  {l.description ? ` · ${l.description}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onQuantite(l)}
                aria-label={`Quantité : ${l.quantity}. Modifier`}
                className="chiffres h-11 min-w-14 rounded-xl border border-line-strong bg-surface-page px-3 text-base font-semibold"
              >
                × {l.quantity}
              </button>
              <div className="chiffres w-[92px] text-right font-semibold">{formatMontant(l.total)}</div>
              <button
                type="button"
                onClick={() => removeItem(l.id)}
                aria-label={`Retirer ${l.name}`}
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-ink-subtle hover:bg-danger-soft hover:text-danger"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="flex flex-col gap-2 border-t border-line px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        {remiseMontant > 0 && (
          <div className="chiffres flex justify-between text-sm text-ink-muted">
            <span className="font-caisse">Sous-total</span>
            <span>{formatMontant(orderSubtotal)}</span>
          </div>
        )}
        {remiseMontant > 0 && (
          <div className="chiffres flex justify-between text-sm text-brand-strong">
            <span className="font-caisse">Remise</span>
            <span>− {formatMontant(remiseMontant)}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-ink-muted">
              Net à payer · {nbArticles} article{nbArticles > 1 ? "s" : ""}
            </div>
            <div className="chiffres text-[28px] font-semibold leading-tight tracking-tight">{formatMontant(orderTotal)}</div>
          </div>
          {orderItems.length > 0 ? (
            <Link
              href="/admin/caisse/encaissement"
              className="flex h-14 items-center gap-2 rounded-2xl bg-brand px-6 text-lg font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
            >
              Payer
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          ) : (
            <span aria-disabled="true" className="flex h-14 items-center gap-2 rounded-2xl bg-line px-6 text-lg font-semibold text-white">
              Payer
            </span>
          )}
        </div>
      </footer>
    </section>
  );
}

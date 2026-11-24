"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import { pdf } from "@react-pdf/renderer";
import { CheckCircle2, Download, Loader2, Printer, UserPlus } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { BordereauPDF } from "@/components/modules/caisse/bordereau-pdf";
import { formatMontant } from "@/lib/caisse/montants";
import { libelleMode } from "@/lib/caisse/paiement";
import { nomAffiche } from "@/lib/caisse/clients";

/** Image publique → data URL (react-pdf n'accepte pas toutes les URL relatives). */
async function versDataUrl(chemin) {
  const res = await fetch(chemin);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onloadend = () => resolve(lecteur.result);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(blob);
  });
}

/**
 * Caisse · fin de l'envoi
 * L'envoi est enregistré (POST /api/caisse/orders depuis l'étape Paiement) :
 * récapitulatif, bordereau à imprimer ou télécharger, client suivant.
 */
export default function CaisseFinPage() {
  const router = useRouter();
  const { restaure, lastOrder, selectedClient, selectedContainer, orderItems, orderSubtotal, orderTotal, orderOptions, paymentInfo, clearSession } = useCaisse();
  const [generation, setGeneration] = useState(null);

  if (!restaure) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="size-8 animate-spin text-ink-muted" aria-label="Chargement" />
      </div>
    );
  }

  if (!lastOrder) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-8 text-center">
          <CheckCircle2 className="size-12 text-line-strong" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">Aucun envoi en cours</h1>
            <p className="mt-1 text-ink-muted">Le dernier envoi est terminé. Passez au client suivant.</p>
          </div>
          <Link href="/admin/caisse/client" className="flex h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white">
            Client suivant
          </Link>
        </div>
      </div>
    );
  }

  const paye = paymentInfo?.montantRecu || 0;
  const reste = Math.max(0, orderTotal - paye);
  const nbColis = orderItems.reduce((s, i) => s + i.quantity, 0);
  const numero = lastOrder.shipment?.shipmentNumber || "—";
  const conteneur = lastOrder.container?.containerNumber || "—";

  async function fabriquerPdf() {
    const lien = `${window.location.origin}/tracking?q=${encodeURIComponent(numero)}`;
    const [qrCodeDataUrl, logoDataUrl] = await Promise.all([
      QRCodeLib.toDataURL(lien, { margin: 1, width: 200 }).catch(() => null),
      versDataUrl("/logo.jpeg").catch(() => null),
    ]);
    const date = new Date(lastOrder.enregistreLe || Date.now());
    return pdf(
      <BordereauPDF
        selectedClient={selectedClient}
        orderItems={orderItems}
        orderSubtotal={orderSubtotal}
        orderTotal={orderTotal}
        orderOptions={orderOptions}
        paymentInfo={paymentInfo ? { ...paymentInfo, modePaiement: libelleMode(paymentInfo.aLArrivee ? "ARRIVEE" : paymentInfo.modePaiement) } : null}
        bordereauNum={`BRD-${numero}`}
        shipmentInfo={lastOrder.shipment}
        // La réponse de l'API n'a que le numéro : on complète avec le conteneur choisi (date de départ)
        lastContainer={selectedContainer?.id === lastOrder.container?.id ? { ...selectedContainer, ...lastOrder.container } : lastOrder.container}
        dateEdition={date.toLocaleDateString("fr-FR")}
        qrCodeDataUrl={qrCodeDataUrl}
        logoDataUrl={logoDataUrl}
      />
    ).toBlob();
  }

  async function imprimer() {
    setGeneration("impression");
    try {
      const url = URL.createObjectURL(await fabriquerPdf());
      const fenetre = window.open(url, "_blank");
      if (fenetre) {
        fenetre.addEventListener("load", () => {
          fenetre.print();
          fenetre.addEventListener("afterprint", () => URL.revokeObjectURL(url));
        });
      } else {
        toast.error("Le navigateur a bloqué la fenêtre d'impression. Utilisez « Télécharger ».");
      }
    } catch {
      toast.error("Le bordereau n'a pas pu être préparé.");
    } finally {
      setGeneration(null);
    }
  }

  async function telecharger() {
    setGeneration("telechargement");
    try {
      const url = URL.createObjectURL(await fabriquerPdf());
      const a = document.createElement("a");
      a.href = url;
      a.download = `bordereau-${numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Le bordereau n'a pas pu être préparé.");
    } finally {
      setGeneration(null);
    }
  }

  function clientSuivant() {
    clearSession();
    router.push("/admin/caisse/client");
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex max-w-xl flex-col gap-4 lg:mt-6">
        <section className="flex flex-col items-center gap-3 rounded-[22px] border border-line bg-white p-6 text-center sm:p-8">
          <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
            <CheckCircle2 className="size-9" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Colis enregistrés</h1>
            <p className="mt-1 text-ink-muted">
              {nomAffiche(selectedClient)} · {nbColis} colis
              {lastOrder.isExistingShipment ? " · ajoutés à son envoi en cours" : ""}
            </p>
          </div>

          <dl className="mt-2 grid w-full grid-cols-2 gap-2 text-left">
            <div className="rounded-2xl bg-surface-page p-3">
              <dt className="text-xs text-ink-muted">N° de suivi</dt>
              <dd className="chiffres truncate text-lg font-semibold">{numero}</dd>
            </div>
            <div className="rounded-2xl bg-surface-page p-3">
              <dt className="text-xs text-ink-muted">Conteneur</dt>
              <dd className="chiffres truncate text-lg font-semibold">{conteneur}</dd>
            </div>
            <div className="rounded-2xl bg-surface-page p-3">
              <dt className="text-xs text-ink-muted">{paymentInfo?.aLArrivee ? "Paiement" : `Payé · ${libelleMode(paymentInfo?.modePaiement)}`}</dt>
              <dd className="chiffres text-lg font-semibold">{paymentInfo?.aLArrivee ? "À l'arrivée" : formatMontant(paye)}</dd>
            </div>
            <div className={reste > 0 ? "rounded-2xl bg-alerte-soft p-3" : "rounded-2xl bg-brand-soft p-3"}>
              <dt className={reste > 0 ? "text-xs text-alerte" : "text-xs text-brand-strong"}>{reste > 0 ? "Reste à payer" : "Soldé"}</dt>
              <dd className={reste > 0 ? "chiffres text-lg font-semibold text-alerte" : "chiffres text-lg font-semibold text-brand-strong"}>
                {formatMontant(reste)}
              </dd>
            </div>
          </dl>
          {paymentInfo?.monnaieRendue > 0 && (
            <p className="chiffres w-full rounded-2xl bg-brand-soft px-4 py-3 text-left text-brand-strong">
              <span className="font-caisse">Monnaie rendue : </span>
              <span className="font-semibold">{formatMontant(paymentInfo.monnaieRendue)}</span>
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={imprimer}
            disabled={!!generation}
            className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-semibold text-white disabled:opacity-60"
          >
            {generation === "impression" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Printer className="size-5" aria-hidden="true" />}
            Imprimer
          </button>
          <button
            type="button"
            onClick={telecharger}
            disabled={!!generation}
            className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white text-lg font-semibold disabled:opacity-60"
          >
            {generation === "telechargement" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Download className="size-5" aria-hidden="true" />}
            Télécharger
          </button>
        </div>
        <button
          type="button"
          onClick={clientSuivant}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-semibold text-white shadow-[0_2px_8px_rgba(14,122,85,.3)]"
        >
          <UserPlus className="size-5" aria-hidden="true" />
          Client suivant
        </button>
      </div>
    </div>
  );
}

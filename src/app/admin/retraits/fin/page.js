"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, Download, Loader2, Printer, UserRoundSearch } from "lucide-react";
import { useRetraits } from "@/contexts/retraits-context";
import { devise, formatDevise } from "@/lib/devises";
import { formatNombre } from "@/lib/caisse/montants";
import { libelleMode } from "@/lib/caisse/paiement";
import { nomAffiche } from "@/lib/caisse/clients";
import { resteEnvoi } from "@/lib/retraits";

async function versDataUrl(chemin) {
  const blob = await (await fetch(chemin)).blob();
  return await new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onloadend = () => resolve(lecteur.result);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(blob);
  });
}

/**
 * Retraits · fin
 * Comme la fin de la caisse : les colis sont remis ; bon de remise à
 * imprimer ou télécharger, puis destinataire suivant.
 * Ouvert aussi depuis la liste pour un envoi déjà retiré (réimpression).
 */
export default function RetraitsFinPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { restaure, donnees, envoi: choisi, resultat, agence, conteneur, choisir } = useRetraits();
  const [generation, setGeneration] = useState(null);

  if (!restaure || !donnees) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="size-8 animate-spin text-ink-muted" aria-label="Chargement" />
      </div>
    );
  }

  // Remise qui vient d'avoir lieu, sinon envoi déjà retiré choisi dans la liste
  const envoi = resultat?.envoi || (choisi?.deliveredAt ? choisi : null);

  if (!envoi) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-8 text-center">
          <CheckCircle2 className="size-12 text-line-strong" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">Aucune remise en cours</h1>
            <p className="mt-1 text-ink-muted">Choisissez un destinataire pour remettre ses colis.</p>
          </div>
          <Link href="/admin/retraits" className="flex h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white">
            Destinataires
          </Link>
        </div>
      </div>
    );
  }

  const d = devise(agence?.devise);
  const colis = envoi.packages || [];
  const nbColis = colis.reduce((s, c) => s + (c.totalQuantity || 1), 0);
  const montantDevise = resultat?.envoi?.id === envoi.id ? resultat.montantDevise : 0;
  const mode = resultat?.envoi?.id === envoi.id ? resultat.mode : null;
  const reste = resteEnvoi(envoi);
  const quand = new Date(envoi.deliveredAt).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  async function fabriquerPdf() {
    // react-pdf n'est chargé qu'au moment d'imprimer
    const [{ pdf }, { BonRemisePDF }, logoDataUrl] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/retraits/bon-remise-pdf"),
      versDataUrl("/logo.jpeg").catch(() => null),
    ]);
    return pdf(
      <BonRemisePDF envoi={envoi} agence={agence} conteneur={conteneur} montantDevise={montantDevise} mode={mode} agent={session?.user?.name} logoDataUrl={logoDataUrl} />
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
      toast.error("Le bon de remise n'a pas pu être préparé.");
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
      a.download = `remise-${envoi.shipmentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Le bon de remise n'a pas pu être préparé.");
    } finally {
      setGeneration(null);
    }
  }

  function suivant() {
    choisir(null);
    router.push("/admin/retraits");
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex max-w-xl flex-col gap-4 lg:mt-6">
        <section className="flex flex-col items-center gap-3 rounded-[22px] border border-line bg-white p-6 text-center sm:p-8">
          <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
            <CheckCircle2 className="size-9" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Colis remis</h1>
            <p className="mt-1 text-ink-muted">
              {nbColis} colis · le {quand}
            </p>
          </div>

          <dl className="mt-2 grid w-full grid-cols-2 gap-2 text-left">
            <div className="rounded-2xl bg-surface-page p-3">
              <dt className="text-xs text-ink-muted">Remis à</dt>
              <dd className="truncate text-lg font-semibold">{envoi.receivedBy}</dd>
            </div>
            <div className="rounded-2xl bg-surface-page p-3">
              <dt className="text-xs text-ink-muted">Pièce</dt>
              <dd className="chiffres truncate text-lg font-semibold">{envoi.receivedIdNumber || "—"}</dd>
            </div>
            <div className="rounded-2xl bg-surface-page p-3">
              <dt className="text-xs text-ink-muted">{montantDevise > 0 ? `Encaissé · ${libelleMode(mode)}` : "Encaissé au retrait"}</dt>
              <dd className="chiffres text-lg font-semibold">{montantDevise > 0 ? `${formatNombre(montantDevise, d.decimales)} ${d.symbole}` : "—"}</dd>
            </div>
            <div className={reste > 0.009 ? "rounded-2xl bg-alerte-soft p-3" : "rounded-2xl bg-brand-soft p-3"}>
              <dt className={reste > 0.009 ? "text-xs text-alerte" : "text-xs text-brand-strong"}>{reste > 0.009 ? "Reste dû" : "Soldé"}</dt>
              <dd className={reste > 0.009 ? "chiffres text-lg font-semibold text-alerte" : "chiffres text-lg font-semibold text-brand-strong"}>
                {formatDevise(reste, agence)}
              </dd>
            </div>
          </dl>
          <p className="chiffres w-full truncate text-left text-[13px] text-ink-muted">
            {envoi.shipmentNumber} · de {nomAffiche(envoi.client)}
            {conteneur ? ` · ${conteneur.containerNumber}` : ""}
          </p>
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
          onClick={suivant}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-semibold text-white shadow-[0_2px_8px_rgba(14,122,85,.3)]"
        >
          <UserRoundSearch className="size-5" aria-hidden="true" />
          Destinataire suivant
        </button>
      </div>
    </div>
  );
}

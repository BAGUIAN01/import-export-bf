"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "swr";
import { toast } from "sonner";
import { ArrowLeft, Banknote, CreditCard, Landmark, Loader2, Percent, Printer, Smartphone, Truck } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { GardeClient } from "@/components/caisse/sans-client";
import { useProfilCaisse } from "@/components/caisse/barre-caisse";
import { Clavier, Afficheur } from "@/components/caisse/clavier";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { FeuilleRemise } from "@/components/caisse/paiement/feuille-remise";
import { formatMontant, formatNombre, montantsRapides, repartirPaiement, saisieVersNombre, toucheClavier, DEVISE } from "@/lib/caisse/montants";
import { MODES_PAIEMENT, noteEnvoi } from "@/lib/caisse/paiement";
import { nomAffiche } from "@/lib/caisse/clients";
import { cn } from "@/lib/utils";

const ICONES = { ESPECES: Banknote, CARTE: CreditCard, MOBILE: Smartphone, VIREMENT: Landmark, ARRIVEE: Truck };

/**
 * Caisse · 3. Paiement
 * Modes en grandes tuiles, montant au clavier à l'écran, remise en un
 * toucher (chef de caisse), puis « Enregistrer et imprimer ».
 */
export default function CaissePaiementPage() {
  return (
    <GardeClient exigeArticles>
      <Paiement />
    </GardeClient>
  );
}

function Paiement() {
  const router = useRouter();
  const {
    selectedClient,
    selectedContainer,
    orderItems,
    orderSubtotal,
    orderTotal,
    orderOptions,
    remise,
    setRemise,
    remiseMontant,
    setPaymentInfo,
    setLastOrder,
    setSelectedContainer,
  } = useCaisse();
  const { estChef } = useProfilCaisse();
  const id = useId();

  const [mode, setMode] = useState("ESPECES");
  const [saisie, setSaisie] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState(orderOptions.notes || "");
  const [feuilleRemise, setFeuilleRemise] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const modeInfo = MODES_PAIEMENT.find((m) => m.valeur === mode);
  const recu = saisieVersNombre(saisie);
  const { paye, monnaie, reste } = repartirPaiement(orderTotal, recu, mode);
  const nbArticles = orderItems.reduce((s, i) => s + i.quantity, 0);
  const peutEnregistrer = !envoi && (mode === "ARRIVEE" || paye > 0) && !!selectedContainer;

  function choisirMode(valeur) {
    setMode(valeur);
    // Carte, mobile money, virement : le plus souvent le montant exact
    if (valeur === "ESPECES") setSaisie("");
    else if (valeur !== "ARRIVEE") setSaisie(formatNombre(orderTotal).replace(/ /g, ""));
  }

  async function enregistrer() {
    if (!peutEnregistrer) return;
    setEnvoi(true);
    const paymentInfo = {
      modePaiement: mode === "ARRIVEE" ? null : mode,
      montantRecu: paye,
      monnaieRendue: monnaie,
      resteAPayer: reste,
      reference: reference.trim() || null,
      aLArrivee: mode === "ARRIVEE",
      paidAt: paye > 0 ? new Date().toISOString() : null,
    };
    const options = { ...orderOptions, notes: noteEnvoi({ note, reference: modeInfo?.reference ? reference : "", mode, remise }) };
    try {
      const res = await fetch("/api/caisse/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          orderItems: orderItems.map((i) => ({
            type: i.type || "OTHER",
            productId: i.productId,
            name: i.name,
            description: i.description,
            quantity: i.quantity,
            price: i.price,
            total: i.total,
          })),
          orderTotal,
          orderSubtotal,
          orderOptions: options,
          paymentInfo,
          containerId: selectedContainer?.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'envoi n'a pas pu être enregistré.");

      setPaymentInfo(paymentInfo);
      setLastOrder({ ...data, enregistreLe: new Date().toISOString() });
      // La pastille du conteneur compte les colis ajoutés
      setSelectedContainer((c) => (c ? { ...c, packagesCount: (c.packagesCount || 0) + (data.packages?.length || 0) } : c));
      // Les listes de la gestion se rafraîchissent à leur prochain affichage
      mutate(
        (k) => typeof k === "string" && ["/api/shipments", "/api/containers", "/api/packages", "/api/dashboard"].some((p) => k.startsWith(p)),
        undefined,
        { revalidate: true }
      );
      router.push("/admin/caisse/impression");
    } catch (e) {
      toast.error(e.message);
      setEnvoi(false);
    }
  }

  const libelleBouton =
    mode === "ARRIVEE"
      ? `Enregistrer · ${formatMontant(orderTotal)} à l'arrivée`
      : paye > 0
        ? `Enregistrer et imprimer · ${formatMontant(paye)}`
        : "Tapez le montant reçu";

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(440px,500px)]">
      {/* Récapitulatif (paysage) */}
      <section aria-label="Récapitulatif" className="hidden min-h-0 flex-col lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Link href="/admin/caisse/commande" aria-label="Retour aux colis" className="grid size-12 place-items-center rounded-xl border border-line-strong bg-white">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Récapitulatif</h1>
            <p className="truncate text-ink-muted">
              {nomAffiche(selectedClient)} · {nbArticles} article{nbArticles > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-5">
          {orderItems.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-3">
              <VignetteArticle vignette={l.vignette} code={l.type} taille="size-11" icone="size-5" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.name}</div>
                <div className="chiffres text-[13px] text-ink-muted">
                  {l.quantity} × {formatMontant(l.price)}
                </div>
              </div>
              <div className="chiffres font-semibold">{formatMontant(l.total)}</div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 border-t border-line bg-white px-5 py-4">
          <FloatingLabelInput id={`${id}-note`} label="Note sur l'envoi (facultatif)" className="text-base" value={note} onChange={(e) => setNote(e.target.value)} />
          <Totaux sousTotal={orderSubtotal} remiseMontant={remiseMontant} remise={remise} net={orderTotal} />
          {estChef && <BoutonRemise remise={remise} onClick={() => setFeuilleRemise(true)} />}
        </div>
      </section>

      {/* Payer */}
      <section aria-label="Paiement" className="flex min-h-0 flex-col border-line bg-white lg:border-l">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {/* Résumé compact (portrait) */}
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <Link href="/admin/caisse/commande" aria-label="Retour aux colis" className="grid size-12 shrink-0 place-items-center rounded-xl border border-line-strong bg-white">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{nomAffiche(selectedClient)}</div>
              <div className="text-sm text-ink-muted">
                {nbArticles} article{nbArticles > 1 ? "s" : ""}
                {remiseMontant > 0 ? ` · remise − ${formatMontant(remiseMontant)}` : ""}
              </div>
            </div>
            {estChef && (
              <button
                type="button"
                onClick={() => setFeuilleRemise(true)}
                className={cn(
                  "flex h-12 items-center gap-2 rounded-xl px-3 font-semibold",
                  remise ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line-strong"
                )}
              >
                <Percent className="size-4" aria-hidden="true" />
                Remise
              </button>
            )}
          </div>

          <div className="mb-4 flex items-baseline justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-white lg:hidden">
            <span className="text-white/75">Net à payer</span>
            <span className="chiffres text-[32px] font-semibold leading-none tracking-tight">{formatMontant(orderTotal)}</span>
          </div>

          <div role="radiogroup" aria-label="Mode de paiement" className="grid grid-cols-3 gap-2">
            {MODES_PAIEMENT.map((m) => {
              const Icone = ICONES[m.valeur];
              const actif = mode === m.valeur;
              return (
                <button
                  key={m.valeur}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => choisirMode(m.valeur)}
                  className={cn(
                    "flex h-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[15px] lg:h-14 lg:flex-row lg:gap-2 min-[1180px]:h-[60px]",
                    m.valeur === "ARRIVEE" && "col-span-2 flex-row gap-3",
                    actif ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white font-medium"
                  )}
                >
                  <Icone className="size-6" aria-hidden="true" />
                  {m.libelle}
                </button>
              );
            })}
          </div>

          {mode === "ARRIVEE" ? (
            <p className="mt-4 rounded-2xl bg-info-soft p-4 text-info">
              Rien n&apos;est encaissé maintenant. Le destinataire paiera{" "}
              <span className="chiffres font-semibold">{formatMontant(orderTotal)}</span> au retrait des colis.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <Afficheur libelle={mode === "ESPECES" ? "Montant reçu" : "Montant payé"} valeur={saisie} unite={DEVISE.symbole} vide="0,00" />
              <div aria-live="polite" className="chiffres flex min-h-6 justify-between px-1 text-[15px]">
                {recu <= 0 ? (
                  <span className="font-caisse text-ink-muted">Tapez le montant ou touchez une proposition.</span>
                ) : monnaie > 0 ? (
                  <>
                    <span className="font-caisse font-medium text-brand-strong">Monnaie à rendre</span>
                    <span className="font-semibold text-brand-strong">{formatMontant(monnaie)}</span>
                  </>
                ) : reste > 0 ? (
                  <>
                    <span className="font-caisse font-medium text-alerte">Acompte : reste à payer</span>
                    <span className="font-semibold text-alerte">{formatMontant(reste)}</span>
                  </>
                ) : (
                  <span className="font-caisse font-medium text-brand-strong">Compte juste</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {montantsRapides(orderTotal).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSaisie(formatNombre(v).replace(/ /g, ""))}
                    className="chiffres h-12 rounded-xl border border-line-strong bg-surface-page text-[15px] font-semibold"
                  >
                    {formatNombre(v, v % 1 === 0 ? 0 : DEVISE.decimales)}
                  </button>
                ))}
              </div>
              <Clavier onTouche={(t) => setSaisie((s) => toucheClavier(s, t))} hauteur="h-[68px] lg:h-[52px] min-[1180px]:h-14" />
              {modeInfo?.reference && (
                <FloatingLabelInput
                  id={`${id}-reference`}
                  label={mode === "CARTE" ? "N° du ticket carte (facultatif)" : mode === "MOBILE" ? "ID de la transaction (facultatif)" : "Référence du virement (facultatif)"}
                  className="text-base"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              )}
            </div>
          )}
        </div>

        <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          {!selectedContainer && (
            <p className="mb-2 rounded-xl bg-alerte-soft px-3 py-2 text-sm text-alerte">Choisissez le conteneur (pastille en haut à droite) avant d&apos;enregistrer.</p>
          )}
          <button
            type="button"
            disabled={!peutEnregistrer}
            onClick={enregistrer}
            className="chiffres flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand text-lg font-semibold text-white shadow-[0_2px_8px_rgba(14,122,85,.3)] disabled:bg-line-strong disabled:shadow-none"
          >
            {envoi ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Printer className="size-6" aria-hidden="true" />}
            <span className="font-caisse">{envoi ? "Enregistrement…" : libelleBouton}</span>
          </button>
        </div>
      </section>

      {feuilleRemise && (
        <FeuilleRemise
          sousTotal={orderSubtotal}
          remise={remise}
          onFermer={() => setFeuilleRemise(false)}
          onAppliquer={(r) => {
            setRemise(r);
            setFeuilleRemise(false);
            if (mode !== "ESPECES" && mode !== "ARRIVEE") setSaisie("");
          }}
        />
      )}
    </div>
  );
}

function Totaux({ sousTotal, remiseMontant, remise, net }) {
  return (
    <dl className="chiffres flex flex-col gap-1">
      {remiseMontant > 0 && (
        <>
          <div className="flex justify-between text-ink-muted">
            <dt className="font-caisse">Sous-total</dt>
            <dd>{formatMontant(sousTotal)}</dd>
          </div>
          <div className="flex justify-between text-brand-strong">
            <dt className="font-caisse">Remise{remise?.motif ? ` · ${remise.motif}` : ""}</dt>
            <dd>− {formatMontant(remiseMontant)}</dd>
          </div>
        </>
      )}
      <div className="flex items-baseline justify-between">
        <dt className="font-caisse text-lg font-semibold">Net à payer</dt>
        <dd className="text-2xl font-semibold">{formatMontant(net)}</dd>
      </div>
    </dl>
  );
}

function BoutonRemise({ remise, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-xl font-semibold",
        remise ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line-strong bg-white"
      )}
    >
      <Percent className="size-4" aria-hidden="true" />
      {remise ? "Modifier la remise" : "Accorder une remise"}
    </button>
  );
}

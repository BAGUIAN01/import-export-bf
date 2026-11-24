"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, Landmark, Loader2, PackageCheck, Smartphone } from "lucide-react";
import { useRetraits } from "@/contexts/retraits-context";
import { GardeRetrait } from "@/components/retraits/garde-retrait";
import { Clavier, Afficheur } from "@/components/caisse/clavier";
import { devise, formatDevise, versDevise } from "@/lib/devises";
import { arrondi, formatMontant, formatNombre, saisieVersNombre, toucheClavier } from "@/lib/caisse/montants";
import { libelleMode } from "@/lib/caisse/paiement";
import { nomAffiche } from "@/lib/caisse/clients";
import { resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

const ICONES = { ESPECES: Banknote, CARTE: CreditCard, MOBILE: Smartphone, VIREMENT: Landmark };
// Coupures proposées en un toucher, selon la devise
const PALIERS = { XOF: [1000, 5000, 10000, 25000, 50000], EUR: [5, 10, 20, 50, 100], USD: [5, 10, 20, 50, 100] };

function rapides(montant, code) {
  const liste = [montant];
  for (const p of PALIERS[code] || PALIERS.EUR) {
    const v = Math.ceil(montant / p) * p;
    if (v > montant && !liste.includes(v)) liste.push(v);
    if (liste.length >= 4) break;
  }
  return liste;
}

/**
 * Retraits · 3. Paiement
 * Comme l'encaissement de la caisse : le reste dû dans la devise de
 * l'agence (FCFA à Ouagadougou), les modes en grandes tuiles, le pavé
 * numérique, la monnaie à rendre, puis « Encaisser et remettre ».
 */
export default function RetraitsPaiementPage() {
  return (
    <GardeRetrait>
      <Paiement />
    </GardeRetrait>
  );
}

function Paiement() {
  const router = useRouter();
  const { envoi, agence, nom, verifies, remettre } = useRetraits();
  const d = devise(agence?.devise);
  const modes = (agence?.modesPaiement || ["ESPECES"]).filter((m) => m !== "ARRIVEE");
  const reste = resteEnvoi(envoi);
  const du = versDevise(reste, agence);
  const [mode, setMode] = useState(modes[0] || "ESPECES");
  const [saisie, setSaisie] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const recu = saisieVersNombre(saisie);
  const manque = arrondi(Math.max(0, du - recu), d.decimales);
  const monnaie = mode === "ESPECES" ? arrondi(Math.max(0, recu - du), d.decimales) : 0;
  const colis = envoi.packages || [];
  const nbColis = colis.reduce((s, c) => s + (c.totalQuantity || 1), 0);
  const pret = recu > 0 && manque <= 0 && verifies.length === colis.length && nom.trim();

  function choisirMode(m) {
    setMode(m);
    if (m !== "ESPECES") setSaisie(formatNombre(du, d.decimales).replace(/\u202F/g, ""));
  }

  async function encaisser() {
    setEnvoiEnCours(true);
    // On encaisse le dû ; la monnaie rendue n'est pas enregistrée
    const ok = await remettre({ montantDevise: Math.min(recu, du), mode });
    setEnvoiEnCours(false);
    if (ok) router.push("/admin/retraits/fin");
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(440px,500px)]">
      {/* Récapitulatif (paysage) */}
      <section aria-label="Récapitulatif" className="hidden min-h-0 flex-col lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Link href="/admin/retraits/colis" aria-label="Retour aux colis" className="grid size-12 place-items-center rounded-xl border border-line-strong bg-white">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Récapitulatif</h1>
            <p className="truncate text-ink-muted">
              {nom || envoi.client?.recipientName} · {nbColis} colis · de {nomAffiche(envoi.client)}
            </p>
          </div>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-5">
          {colis.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1 truncate font-medium">{c.description}</span>
              <span className="chiffres text-[13px] text-ink-muted">
                {c.packageNumber} · × {c.totalQuantity}
              </span>
            </li>
          ))}
        </ul>
        <dl className="chiffres flex flex-col gap-1 border-t border-line bg-white px-5 py-4">
          <div className="flex justify-between text-ink-muted">
            <dt className="font-caisse">Montant de l&apos;envoi</dt>
            <dd>{formatDevise(envoi.totalAmount, agence)}</dd>
          </div>
          <div className="flex justify-between text-ink-muted">
            <dt className="font-caisse">Déjà payé au départ</dt>
            <dd>{formatDevise(envoi.paidAmount, agence)}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-caisse text-lg font-semibold">Reste à payer</dt>
            <dd className="text-2xl font-semibold">{formatDevise(reste, agence)}</dd>
          </div>
          {agence?.devise !== "EUR" && <dd className="text-right text-[13px] text-ink-muted">soit {formatMontant(reste)}</dd>}
        </dl>
      </section>

      {/* Payer */}
      <section aria-label="Paiement" className="flex min-h-0 flex-col border-line bg-white lg:border-l">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <Link href="/admin/retraits/colis" aria-label="Retour aux colis" className="grid size-12 shrink-0 place-items-center rounded-xl border border-line-strong bg-white">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{nom || envoi.client?.recipientName}</div>
              <div className="text-sm text-ink-muted">{nbColis} colis</div>
            </div>
          </div>

          <div className="mb-4 flex items-baseline justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
            <span className="text-white/75">Reste à payer</span>
            <span className="chiffres text-[32px] font-semibold leading-none tracking-tight">{formatDevise(reste, agence)}</span>
          </div>

          <div role="radiogroup" aria-label="Mode de paiement" className={cn("grid gap-2", modes.length > 2 ? "grid-cols-3" : "grid-cols-2")}>
            {modes.map((m) => {
              const Icone = ICONES[m] || Banknote;
              const actif = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => choisirMode(m)}
                  className={cn(
                    "flex h-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[15px] lg:h-14 lg:flex-row lg:gap-2",
                    actif ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white font-medium"
                  )}
                >
                  <Icone className="size-6" aria-hidden="true" />
                  {libelleMode(m)}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <Afficheur libelle={mode === "ESPECES" ? "Montant reçu" : "Montant payé"} valeur={saisie} unite={d.symbole} vide="0" />
            <div aria-live="polite" className="chiffres flex min-h-6 justify-between px-1 text-[15px]">
              {recu <= 0 ? (
                <span className="font-caisse text-ink-muted">Tapez le montant ou touchez une proposition.</span>
              ) : manque > 0 ? (
                <>
                  <span className="font-caisse font-medium text-alerte">Il manque</span>
                  <span className="font-semibold text-alerte">{formatNombre(manque, d.decimales)} {d.symbole}</span>
                </>
              ) : monnaie > 0 ? (
                <>
                  <span className="font-caisse font-medium text-brand-strong">Monnaie à rendre</span>
                  <span className="font-semibold text-brand-strong">{formatNombre(monnaie, d.decimales)} {d.symbole}</span>
                </>
              ) : (
                <span className="font-caisse font-medium text-brand-strong">Compte juste</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {rapides(du, d.code).map((v) => (
                <button key={v} type="button" onClick={() => setSaisie(String(v).replace(".", ","))} className="chiffres h-12 rounded-xl border border-line-strong bg-surface-page text-[15px] font-semibold">
                  {formatNombre(v, v % 1 === 0 ? 0 : d.decimales)}
                </button>
              ))}
            </div>
            <Clavier decimales={d.decimales} onTouche={(t) => setSaisie((s) => toucheClavier(s, t, { decimales: d.decimales }))} hauteur="h-[68px] lg:h-[52px] min-[1180px]:h-14" />
          </div>
        </div>

        <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          <button
            type="button"
            disabled={!pret || envoiEnCours}
            onClick={encaisser}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand text-lg font-semibold text-white shadow-[0_2px_8px_rgba(14,122,85,.3)] disabled:bg-line-strong disabled:shadow-none"
          >
            {envoiEnCours ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <PackageCheck className="size-6" aria-hidden="true" />}
            <span>
              Encaisser et remettre <span className="chiffres">· {formatDevise(reste, agence)}</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

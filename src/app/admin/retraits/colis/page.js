"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, PackageCheck } from "lucide-react";
import { useRetraits } from "@/contexts/retraits-context";
import { GardeRetrait } from "@/components/retraits/garde-retrait";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { formatDevise } from "@/lib/devises";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";
import { resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

function codeType(colis) {
  try {
    const t = typeof colis.types === "string" ? JSON.parse(colis.types) : colis.types;
    return Array.isArray(t) ? t[0]?.type : null;
  } catch {
    return null;
  }
}

/**
 * Retraits · 2. Colis
 * Comme l'écran Colis de la caisse : les colis de l'envoi en tuiles, un
 * toucher = vérifié ; à droite la personne qui retire et la suite
 * (Payer s'il reste un montant, sinon Remettre).
 */
export default function RetraitsColisPage() {
  return (
    <GardeRetrait>
      <Colis />
    </GardeRetrait>
  );
}

function Colis() {
  const id = useId();
  const router = useRouter();
  const { envoi, agence, verifies, setVerifies, nom, setNom, piece, setPiece, remettre } = useRetraits();
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const colis = envoi.packages || [];
  const tous = colis.length > 0 && verifies.length === colis.length;
  const reste = resteEnvoi(envoi);
  const nbColis = colis.reduce((s, c) => s + (c.totalQuantity || 1), 0);
  const destinataire = envoi.client?.recipientName || nomAffiche(envoi.client);
  const pret = tous && nom.trim();

  const basculer = (c) => setVerifies((v) => (v.includes(c.id) ? v.filter((x) => x !== c.id) : [...v, c.id]));

  async function suite() {
    if (reste > 0.009) return router.push("/admin/retraits/paiement");
    setEnvoiEnCours(true);
    const ok = await remettre(null);
    setEnvoiEnCours(false);
    if (ok) router.push("/admin/retraits/fin");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4 lg:flex-row-reverse lg:gap-4">
      {/* Colis à vérifier */}
      <section aria-label="Colis à vérifier" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,20,.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Colis à remettre</h1>
            <p className="text-[13px] text-ink-muted">Touchez chaque colis présenté au guichet.</p>
          </div>
          {!tous && (
            <button type="button" onClick={() => setVerifies(colis.map((c) => c.id))} className="h-11 rounded-xl border border-line-strong px-4 font-semibold">
              Tout cocher
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
            {colis.map((c) => {
              const ok = verifies.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={ok}
                    onClick={() => basculer(c)}
                    className={cn(
                      "relative flex h-full w-full flex-col overflow-hidden rounded-[14px] text-left active:scale-[.98]",
                      ok ? "border-2 border-brand bg-[#F3FAF6]" : "border border-line bg-white hover:border-line-strong"
                    )}
                  >
                    <span className="grid h-20 place-items-center bg-surface-page">
                      <VignetteArticle code={codeType(c)} taille="size-14" icone="size-8" />
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn("absolute top-2.5 right-2.5 grid size-[30px] place-items-center rounded-full shadow-sm", ok ? "bg-brand text-white" : "border-2 border-line-strong bg-white")}
                    >
                      {ok && <Check className="size-4" strokeWidth={3} />}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5 p-3">
                      <span className="line-clamp-2 text-[15px] font-medium leading-5">{c.description}</span>
                      <span className="chiffres text-xs text-ink-subtle">{c.packageNumber}</span>
                      <span className="chiffres mt-auto pt-1 text-base font-semibold">× {c.totalQuantity}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Fiche du retrait : à gauche en paysage, en bas en portrait */}
      <section
        aria-label="Retrait"
        className="flex max-h-[48dvh] shrink-0 flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(15,23,20,.04)] lg:h-full lg:max-h-none lg:w-[420px] xl:w-[460px]"
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold">{destinataire}</div>
            <div className="truncate text-[13px] text-ink-muted">
              <span className="chiffres">{affichageTelephone(envoi.client?.recipientPhone) || "—"}</span> · de {nomAffiche(envoi.client)}
            </div>
          </div>
          <Link href="/admin/retraits" className="flex h-11 items-center rounded-xl border border-line-strong px-3 text-sm font-semibold">
            Changer
          </Link>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">Personne qui retire</h2>
          <div className="flex flex-col gap-4">
            <FloatingLabelInput id={`${id}-nom`} label="Nom *" className="text-base" value={nom} onChange={(e) => setNom(e.target.value)} />
            <FloatingLabelInput id={`${id}-piece`} label="N° CNIB ou passeport" className="chiffres text-base" value={piece} onChange={(e) => setPiece(e.target.value)} />
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-line px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-ink-muted">
                {verifies.length} / {colis.length} colis vérifiés · {reste > 0.009 ? "à payer" : "soldé"}
              </div>
              <div className="chiffres text-[26px] font-semibold leading-tight tracking-tight">{reste > 0.009 ? formatDevise(reste, agence) : "0"}</div>
            </div>
            <button
              type="button"
              disabled={!pret || envoiEnCours}
              onClick={suite}
              className="flex h-14 items-center gap-2 rounded-2xl bg-brand px-5 text-lg font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)] disabled:bg-line-strong disabled:shadow-none"
            >
              {envoiEnCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : reste > 0.009 ? null : <PackageCheck className="size-5" aria-hidden="true" />}
              {reste > 0.009 ? "Payer" : `Remettre ${nbColis} colis`}
              {reste > 0.009 && <ArrowRight className="size-5" aria-hidden="true" />}
            </button>
          </div>
          {!pret && <p className="text-[13px] text-ink-muted">{!tous ? "Cochez tous les colis." : "Indiquez le nom de la personne."}</p>}
        </footer>
      </section>
    </div>
  );
}

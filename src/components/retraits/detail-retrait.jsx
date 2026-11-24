"use client";

import { useId, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Loader2, PackageCheck, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Clavier, Afficheur } from "@/components/caisse/clavier";
import { VignetteArticle } from "@/components/caisse/vignette-article";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { devise, formatDevise, versDevise } from "@/lib/devises";
import { formatMontant, formatNombre, saisieVersNombre, toucheClavier } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";
import { libelleMode } from "@/lib/caisse/paiement";
import { paiementEnEuros, remisePossible, resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

function codeType(colis) {
  try {
    const t = typeof colis.types === "string" ? JSON.parse(colis.types) : colis.types;
    return Array.isArray(t) ? t[0]?.type : null;
  } catch {
    return null;
  }
}

function Etape({ numero, titre, fait, droite, children }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3">
        <span className={cn("chiffres grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold", fait ? "bg-brand text-white" : "bg-surface-muted text-ink-muted")}>
          {fait ? <Check className="size-4" aria-label="fait" /> : numero}
        </span>
        <h3 className="flex-1 text-base font-semibold">{titre}</h3>
        {droite}
      </div>
      {children}
    </section>
  );
}

/**
 * Remise d'un envoi : 1. vérifier chaque colis, 2. encaisser le reste dans
 * la devise de l'agence, 3. noter qui retire (pièce), puis remettre.
 */
export function DetailRetrait({ envoi, agence, onRetour, onRemis }) {
  const id = useId();
  const d = devise(agence?.devise);
  const modes = (agence?.modesPaiement || ["ESPECES"]).filter((m) => m !== "ARRIVEE");
  const reste = resteEnvoi(envoi);
  const resteDevise = versDevise(reste, agence);

  const [verifies, setVerifies] = useState([]);
  const [mode, setMode] = useState(modes[0] || "ESPECES");
  const [saisie, setSaisie] = useState(reste > 0 ? String(resteDevise).replace(".", ",") : "");
  const [reference, setReference] = useState("");
  const [nom, setNom] = useState(envoi.client?.recipientName || "");
  const [piece, setPiece] = useState("");
  const [note, setNote] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const montant = saisieVersNombre(saisie);
  const payeEuros = reste > 0 ? paiementEnEuros(montant, envoi, agence) : 0;
  const resteApres = Math.max(0, reste - payeEuros);
  const colis = envoi.packages || [];
  const nbColis = colis.reduce((s, c) => s + (c.totalQuantity || 1), 0);
  const possible = remisePossible({ colis, verifies, reste: resteApres, nom });
  const manque = [
    verifies.length < colis.length ? `${colis.length - verifies.length} colis à vérifier` : null,
    resteApres > 0.009 ? `${formatDevise(resteApres, agence)} à encaisser` : null,
    !nom.trim() ? "le nom de la personne" : null,
  ].filter(Boolean);
  const destinataire = envoi.client?.recipientName || nomAffiche(envoi.client);

  async function remettre() {
    setEnvoiEnCours(true);
    try {
      const res = await fetch(`/api/retraits/${envoi.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paiement: reste > 0 ? { montantDevise: montant, mode, reference } : null,
          receivedBy: nom,
          receivedIdNumber: piece,
          note,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "La remise n'a pas pu être enregistrée.");
      toast.success(`${nbColis} colis remis à ${nom}.`);
      onRemis({ ...envoi, deliveredAt: data.deliveredAt, paidAmount: data.paidAmount, receivedBy: nom, receivedIdNumber: piece || null });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <button type="button" onClick={onRetour} aria-label="Retour à la liste" className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong lg:hidden">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="hidden size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-ink-muted sm:grid">
          {destinataire.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{destinataire}</h2>
          <p className="truncate text-[13px] text-ink-muted">
            <span className="chiffres">{affichageTelephone(envoi.client?.recipientPhone) || "Pas de téléphone"}</span> · envoyé par {nomAffiche(envoi.client)}
          </p>
        </div>
        <span className="chiffres hidden text-sm text-ink-muted sm:block">{envoi.shipmentNumber}</span>
      </header>

      {envoi.deliveredAt ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
            <CheckCircle2 className="size-9" />
          </span>
          <h3 className="text-xl font-semibold">Colis remis</h3>
          <p className="text-ink-muted">
            Le {new Date(envoi.deliveredAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à {envoi.receivedBy}
            {envoi.receivedIdNumber ? ` (pièce ${envoi.receivedIdNumber})` : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <Etape
              numero={1}
              titre="Vérifier les colis"
              fait={colis.length > 0 && verifies.length === colis.length}
              droite={
                <span className="chiffres text-sm text-ink-muted">
                  {verifies.length} / {colis.length}
                </span>
              }
            >
              <ul className="flex flex-col gap-2">
                {colis.map((c) => {
                  const ok = verifies.includes(c.id);
                  return (
                    <li key={c.id} className="flex items-center gap-3">
                      <VignetteArticle code={codeType(c)} taille="size-12" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{c.description}</div>
                        <div className="chiffres truncate text-[13px] text-ink-muted">
                          {c.packageNumber} · × {c.totalQuantity}
                          {c.weight ? ` · ${c.weight} kg` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-pressed={ok}
                        onClick={() => setVerifies((v) => (ok ? v.filter((x) => x !== c.id) : [...v, c.id]))}
                        className={cn("flex h-12 min-w-[124px] items-center justify-center gap-2 rounded-xl px-3 font-semibold", ok ? "bg-brand-soft text-brand-strong" : "border border-line-strong bg-white")}
                      >
                        {ok ? <Check className="size-5" aria-hidden="true" /> : <ScanLine className="size-5" aria-hidden="true" />}
                        {ok ? "Vérifié" : "Vérifier"}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {verifies.length < colis.length && (
                <button type="button" onClick={() => setVerifies(colis.map((c) => c.id))} className="h-11 self-start rounded-xl px-2 font-semibold text-brand">
                  Tout est là : tout vérifier
                </button>
              )}
            </Etape>

            <Etape numero={2} titre="Paiement" fait={resteApres <= 0.009}>
              {reste <= 0.009 ? (
                <p className="rounded-2xl bg-brand-soft p-4 font-medium text-brand-strong">Soldé à l&apos;envoi : rien à encaisser.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl bg-alerte-soft p-4 text-alerte">
                    <span className="font-medium">À payer au retrait</span>
                    <span className="flex items-baseline gap-2">
                      <span className="chiffres text-[28px] font-semibold leading-none">{formatDevise(reste, agence)}</span>
                      {agence?.devise !== "EUR" && <span className="chiffres text-[13px]">soit {formatMontant(reste)}</span>}
                    </span>
                  </div>
                  <div role="radiogroup" aria-label="Mode de paiement" className="flex flex-wrap gap-2">
                    {modes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={mode === m}
                        onClick={() => setMode(m)}
                        className={cn("h-12 rounded-xl px-4", mode === m ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white")}
                      >
                        {libelleMode(m)}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="flex flex-col gap-2">
                      <Afficheur libelle="Montant reçu" valeur={saisie} unite={d.symbole} vide="0" />
                      <p aria-live="polite" className={cn("chiffres px-1 text-sm", resteApres > 0.009 ? "text-alerte" : "text-brand-strong")}>
                        <span className="font-caisse">{resteApres > 0.009 ? "Reste après ce paiement : " : "Le compte est bon."}</span>
                        {resteApres > 0.009 ? formatDevise(resteApres, agence) : ""}
                      </p>
                      <button type="button" onClick={() => setSaisie(formatNombre(resteDevise, d.decimales).replace(/ /g, ""))} className="chiffres h-11 self-start rounded-xl border border-line-strong bg-surface-page px-4 font-semibold">
                        <span className="font-caisse">Montant exact : </span>
                        {formatDevise(reste, agence)}
                      </button>
                      {mode !== "ESPECES" && (
                        <FloatingLabelInput id={`${id}-ref`} label="Référence de la transaction (facultatif)" className="text-base" value={reference} onChange={(e) => setReference(e.target.value)} />
                      )}
                    </div>
                    <Clavier decimales={d.decimales} hauteur="h-14" onTouche={(t) => setSaisie((s) => toucheClavier(s, t, { decimales: d.decimales }))} />
                  </div>
                </div>
              )}
            </Etape>

            <Etape numero={3} titre="Pièce de la personne qui retire" fait={!!nom.trim()}>
              <div className="grid grid-cols-1 gap-x-3 gap-y-5 pt-1 sm:grid-cols-2">
                <FloatingLabelInput id={`${id}-nom`} label="Nom de la personne *" className="text-base" value={nom} onChange={(e) => setNom(e.target.value)} />
                <FloatingLabelInput id={`${id}-piece`} label="N° de CNIB ou passeport" className="chiffres text-base" value={piece} onChange={(e) => setPiece(e.target.value)} />
                <div className="sm:col-span-2">
                  <FloatingLabelInput id={`${id}-note`} label="Remarque (facultatif)" className="text-base" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
            </Etape>
          </div>

          <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-white px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <button
              type="button"
              disabled={!possible || envoiEnCours}
              onClick={remettre}
              className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-brand text-lg font-semibold text-white shadow-[0_2px_8px_rgba(14,122,85,.3)] disabled:bg-line-strong disabled:shadow-none"
            >
              {envoiEnCours ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <PackageCheck className="size-6" aria-hidden="true" />}
              Remettre les {nbColis} colis
            </button>
            {manque.length > 0 && <p className="text-center text-sm text-ink-muted">Reste : {manque.join(", ")}.</p>}
          </footer>
        </>
      )}
    </div>
  );
}

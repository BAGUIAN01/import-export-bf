"use client";

import { useId, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Etat } from "@/components/epure";
import { devise, formatDevise, versDevise } from "@/lib/devises";
import { formatMontant, saisieVersNombre } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";
import { libelleMode } from "@/lib/caisse/paiement";
import { paiementEnEuros, remisePossible, resteEnvoi } from "@/lib/retraits";
import { cn } from "@/lib/utils";

function Partie({ titre, droite, children }) {
  return (
    <section className="flex flex-col gap-3 px-4 py-4 sm:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">{titre}</h3>
        {droite}
      </div>
      {children}
    </section>
  );
}

/**
 * Remise d'un envoi, épurée : cocher les colis, encaisser le reste (montant
 * exact déjà saisi, dans la devise de l'agence), nom et pièce, remettre.
 */
export function DetailRetrait({ envoi, agence, onRetour, onRemis }) {
  const id = useId();
  const d = devise(agence?.devise);
  const modes = (agence?.modesPaiement || ["ESPECES"]).filter((m) => m !== "ARRIVEE");
  const reste = resteEnvoi(envoi);
  const resteDevise = versDevise(reste, agence);
  const colis = envoi.packages || [];
  const nbColis = colis.reduce((s, c) => s + (c.totalQuantity || 1), 0);
  const destinataire = envoi.client?.recipientName || nomAffiche(envoi.client);

  const [verifies, setVerifies] = useState([]);
  const [mode, setMode] = useState(modes[0] || "ESPECES");
  const [saisie, setSaisie] = useState(reste > 0 ? String(resteDevise).replace(".", ",") : "");
  const [nom, setNom] = useState(envoi.client?.recipientName || "");
  const [piece, setPiece] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const montant = saisieVersNombre(saisie);
  const resteApres = reste > 0 ? Math.max(0, reste - paiementEnEuros(montant, envoi, agence)) : 0;
  const possible = remisePossible({ colis, verifies, reste: resteApres, nom });
  const manque = [
    verifies.length < colis.length ? `${colis.length - verifies.length} colis à cocher` : null,
    resteApres > 0.009 ? `${formatDevise(resteApres, agence)} à encaisser` : null,
    !nom.trim() ? "le nom" : null,
  ].filter(Boolean);

  async function remettre() {
    setEnvoiEnCours(true);
    try {
      const res = await fetch(`/api/retraits/${envoi.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paiement: reste > 0 ? { montantDevise: montant, mode } : null, receivedBy: nom, receivedIdNumber: piece }),
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
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{destinataire}</h2>
          <p className="truncate text-[13px] text-ink-muted">
            <span className="chiffres">{affichageTelephone(envoi.client?.recipientPhone) || "—"}</span> · de {nomAffiche(envoi.client)} ·{" "}
            <span className="chiffres">{envoi.shipmentNumber}</span>
          </p>
        </div>
        {envoi.deliveredAt ? (
          <Etat ton="vert">Remis</Etat>
        ) : reste > 0.009 ? (
          <Etat ton="ambre">Reste {formatDevise(reste, agence)}</Etat>
        ) : (
          <Etat ton="vert">Soldé</Etat>
        )}
      </header>

      {envoi.deliveredAt ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <CheckCircle2 className="size-12 text-brand" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Colis remis</h3>
          <p className="text-ink-muted">
            Le {new Date(envoi.deliveredAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à {envoi.receivedBy}
            {envoi.receivedIdNumber ? ` (pièce ${envoi.receivedIdNumber})` : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain">
            <Partie
              titre={`Colis · ${verifies.length} / ${colis.length} vérifiés`}
              droite={
                verifies.length < colis.length && (
                  <button type="button" onClick={() => setVerifies(colis.map((c) => c.id))} className="text-sm font-semibold text-brand">
                    Tout cocher
                  </button>
                )
              }
            >
              <ul className="flex flex-col">
                {colis.map((c) => {
                  const ok = verifies.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={ok}
                        onClick={() => setVerifies((v) => (ok ? v.filter((x) => x !== c.id) : [...v, c.id]))}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left hover:bg-surface-page"
                      >
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-md border-2", ok ? "border-brand bg-brand text-white" : "border-line-strong")}>
                          {ok && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{c.description}</span>
                        <span className="chiffres shrink-0 text-[13px] text-ink-muted">
                          {c.packageNumber} · × {c.totalQuantity}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Partie>

            {reste > 0.009 && (
              <Partie
                titre="Paiement"
                droite={
                  agence?.devise !== "EUR" && <span className="chiffres text-[13px] text-ink-muted">soit {formatMontant(reste)}</span>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {modes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      onClick={() => setMode(m)}
                      className={cn("h-11 rounded-full border px-4 text-sm font-medium", mode === m ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}
                    >
                      {libelleMode(m)}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <FloatingLabelInput
                      id={`${id}-montant`}
                      label={`Montant reçu (${d.symbole})`}
                      inputMode="decimal"
                      className="chiffres text-lg"
                      value={saisie}
                      onChange={(e) => setSaisie(e.target.value.replace(/[^0-9.,]/g, ""))}
                    />
                  </div>
                  <span className={cn("chiffres pb-4 text-sm", resteApres > 0.009 ? "text-alerte" : "text-brand-strong")}>
                    {resteApres > 0.009 ? `reste ${formatDevise(resteApres, agence)}` : "compte juste"}
                  </span>
                </div>
              </Partie>
            )}

            <Partie titre="Personne qui retire">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FloatingLabelInput id={`${id}-nom`} label="Nom *" className="text-base" value={nom} onChange={(e) => setNom(e.target.value)} />
                <FloatingLabelInput id={`${id}-piece`} label="N° CNIB ou passeport" className="chiffres text-base" value={piece} onChange={(e) => setPiece(e.target.value)} />
              </div>
            </Partie>
          </div>

          <footer className="flex flex-col gap-1.5 border-t border-line bg-white px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <button
              type="button"
              disabled={!possible || envoiEnCours}
              onClick={remettre}
              className="flex h-14 items-center justify-center gap-2 rounded-xl bg-brand text-base font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)] disabled:bg-line-strong disabled:shadow-none"
            >
              {envoiEnCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <PackageCheck className="size-5" aria-hidden="true" />}
              Remettre les {nbColis} colis
            </button>
            {manque.length > 0 && <p className="text-center text-[13px] text-ink-muted">Reste : {manque.join(", ")}.</p>}
          </footer>
        </>
      )}
    </div>
  );
}

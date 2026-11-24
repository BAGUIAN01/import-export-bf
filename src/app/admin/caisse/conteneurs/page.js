"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { Container as IconeConteneur, FileText, Loader2, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCaisse } from "@/contexts/caisse-context";
import { useProfilCaisse } from "@/components/caisse/barre-caisse";
import { Feuille } from "@/components/caisse/feuille";
import { BoutonActionConteneur } from "@/components/gestion/conteneurs/action-conteneur";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-date-picker";
import { STATUTS_CONTENEUR, joursAvant } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

const jourMois = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : null);

/**
 * Caisse · Conteneurs (chef de caisse)
 * Le conteneur en chargement tient lieu de session : on le suit, on le
 * ferme avec le n° du plomb, on en ouvre un nouveau. Les autres conteneurs
 * avancent d'un toucher (parti, douane, arrivé).
 */
export default function CaisseConteneursPage() {
  const { estChef } = useProfilCaisse();
  const { setSelectedContainer } = useCaisse();
  const [conteneurs, setConteneurs] = useState(null);
  const [nouveau, setNouveau] = useState(false);

  const charger = useCallback(() => {
    fetch("/api/containers/resume")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Les conteneurs n'ont pas pu être chargés."))))
      .then((d) => setConteneurs(d.containers || []))
      .catch((e) => {
        toast.error(e.message);
        setConteneurs([]);
      });
  }, []);
  useEffect(charger, [charger]);

  if (!estChef) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-[22px] border border-line bg-white p-8 text-center">
          <Lock className="size-10 text-line-strong" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Réservé au chef de caisse</h1>
          <p className="text-ink-muted">Le conteneur en chargement est choisi dans la pastille en haut à droite.</p>
        </div>
      </div>
    );
  }

  const enCours = (conteneurs || []).filter((c) => c.status === "PREPARATION");
  const autres = (conteneurs || []).filter((c) => ["LOADED", "IN_TRANSIT", "CUSTOMS"].includes(c.status)).slice(0, 8);

  return (
    <div className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13px] text-ink-muted">Caisse / Conteneurs</p>
            <h1 className="text-2xl font-semibold tracking-tight">Conteneurs</h1>
            <p className="text-ink-muted">Le conteneur en chargement reçoit les colis enregistrés à la caisse.</p>
          </div>
          <button type="button" onClick={() => setNouveau(true)} className="flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-white px-4 font-semibold">
            <Plus className="size-5" aria-hidden="true" />
            Ouvrir un conteneur
          </button>
        </div>

        {conteneurs === null ? (
          <div className="h-[280px] animate-pulse rounded-[22px] bg-white" aria-hidden="true" />
        ) : enCours.length === 0 ? (
          <section className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-alerte/40 bg-alerte-soft p-8 text-center text-alerte">
            <IconeConteneur className="size-10" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Aucun conteneur en chargement</h2>
            <p>La caisse ne peut pas enregistrer de colis tant qu&apos;aucun conteneur n&apos;est ouvert.</p>
            <button type="button" onClick={() => setNouveau(true)} className="flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white">
              <Plus className="size-5" aria-hidden="true" />
              Ouvrir un conteneur
            </button>
          </section>
        ) : (
          enCours.map((c) => {
            const jours = joursAvant(c.departureDate);
            const remplissage = c.capacity ? Math.min(100, Math.round((c.packagesCount / c.capacity) * 100)) : null;
            return (
              <section key={c.id} aria-label={`Conteneur ${c.containerNumber}`} className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#FFEDD5] text-[#C2410C]">
                    <IconeConteneur className="size-7" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="chiffres text-2xl font-semibold">{c.containerNumber}</h2>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-medium", STATUTS_CONTENEUR.PREPARATION.classe)}>En chargement</span>
                    </div>
                    <p className="text-ink-muted">
                      {c.departureDate ? `Départ prévu le ${jourMois(c.departureDate)}` : "Date de départ à fixer"}
                      {jours !== null && jours >= 0 ? ` · dans ${jours} jour${jours > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-3">
                  {[
                    { libelle: "Colis", valeur: `${c.packagesCount}${c.capacity ? ` / ${c.capacity}` : ""}` },
                    { libelle: "Envois", valeur: c.shipmentsCount },
                    { libelle: "Encaissé", valeur: formatMontant(c.paidAmount), detail: c.totalAmount - c.paidAmount > 0 ? `reste ${formatMontant(c.totalAmount - c.paidAmount)}` : null },
                  ].map((x) => (
                    <div key={x.libelle} className="rounded-2xl bg-surface-page p-3 sm:p-4">
                      <dt className="text-sm text-ink-muted">{x.libelle}</dt>
                      <dd className="chiffres text-xl font-semibold sm:text-2xl">{x.valeur}</dd>
                      {x.detail && <dd className="chiffres text-xs text-alerte">{x.detail}</dd>}
                    </div>
                  ))}
                </dl>
                {remplissage !== null && (
                  <div className="h-3 overflow-hidden rounded-full bg-surface-muted" aria-label={`Rempli à ${remplissage} %`}>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${remplissage}%` }} />
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <BoutonActionConteneur conteneur={c} onFait={charger} className="h-14 flex-1 text-lg" />
                  <Link href={`/admin/containers/${c.id}`} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white text-lg font-semibold">
                    <FileText className="size-5" aria-hidden="true" />
                    Manifeste et envois
                  </Link>
                </div>
              </section>
            );
          })
        )}

        {autres.length > 0 && (
          <section aria-label="Les autres conteneurs" className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Les autres conteneurs</h2>
            <ul className="flex flex-col gap-2">
              {autres.map((c) => {
                const statut = STATUTS_CONTENEUR[c.status];
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chiffres font-semibold">{c.containerNumber}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statut.classe)}>{statut.libelle}</span>
                      </div>
                      <div className="text-sm text-ink-muted">
                        {c.packagesCount} colis · {c.shipmentsCount} envois
                        {c.actualDeparture ? ` · parti le ${jourMois(c.actualDeparture)}` : ""}
                      </div>
                    </div>
                    <BoutonActionConteneur conteneur={c} onFait={charger} variante="contour" />
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {nouveau && (
        <FeuilleNouveauConteneur
          onFermer={() => setNouveau(false)}
          onCree={(c) => {
            setNouveau(false);
            setSelectedContainer({ ...c, packagesCount: 0 });
            charger();
          }}
        />
      )}
    </div>
  );
}

function FeuilleNouveauConteneur({ onFermer, onCree }) {
  const id = useId();
  const [depart, setDepart] = useState("");
  const [capacite, setCapacite] = useState("100");
  const [envoi, setEnvoi] = useState(false);

  async function creer() {
    setEnvoi(true);
    try {
      const date = depart ? new Date(depart) : null;
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Chargement ${date ? `du ${date.toLocaleDateString("fr-FR")}` : new Date().toLocaleDateString("fr-FR")}`,
          departureDate: date ? date.toISOString() : null,
          capacity: parseInt(capacite, 10) || 100,
          status: "PREPARATION",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Le conteneur n'a pas pu être ouvert.");
      const c = data.container || data;
      toast.success(`${c.containerNumber} est ouvert : la caisse y enregistre les colis.`);
      onCree(c);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre="Ouvrir un conteneur"
      sousTitre="Il devient le conteneur en chargement de la caisse."
      largeur="max-w-md"
      pied={
        <button type="button" onClick={creer} disabled={envoi} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50">
          {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          Ouvrir le conteneur
        </button>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <FloatingLabelDatePicker id={`${id}-depart`} label="Départ prévu" value={depart} onChange={(v) => setDepart(v?.target ? v.target.value : v)} />
        <FloatingLabelInput id={`${id}-capacite`} label="Capacité (colis)" inputMode="numeric" className="chiffres text-base" value={capacite} onChange={(e) => setCapacite(e.target.value.replace(/\D/g, ""))} />
      </div>
    </Feuille>
  );
}

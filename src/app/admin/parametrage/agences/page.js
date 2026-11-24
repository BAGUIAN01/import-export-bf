"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { FicheAgence, ROLES_AGENCE } from "@/components/parametrage/fiche-agence";
import { devise, libelleTaux } from "@/lib/devises";
import { libelleMode } from "@/lib/caisse/paiement";
import { cn } from "@/lib/utils";

const STYLE_ROLE = {
  DEPART: "bg-[#FFEDD5] text-[#9A3412]",
  ARRIVEE: "bg-info-soft text-info",
  DEUX: "bg-[#EEE8F6] text-[#5B3E8C]",
};

/**
 * Paramétrage · Agences et devises
 * Chaque agence a sa devise : Paris encaisse en euros, Ouagadougou en FCFA
 * (1 € = 655,957 FCFA). Les tarifs restent en euros, devise de référence.
 */
export default function AgencesPage() {
  const [agences, setAgences] = useState(null);
  const [fiche, setFiche] = useState(null);

  const charger = useCallback(() => {
    fetch("/api/agences")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setAgences(d.agences || []);
      })
      .catch((e) => {
        toast.error(e.message);
        setAgences([]);
      });
  }, []);
  useEffect(charger, [charger]);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-muted">Paramétrage / Agences et devises</p>
            <h1 className="text-2xl font-semibold tracking-tight">Agences et devises</h1>
          <p className="text-ink-muted">Chaque agence a sa devise, ses modes de paiement et son reçu.</p>
        </div>
        <button
          type="button"
          onClick={() => setFiche("nouvelle")}
          className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
        >
          <Plus className="size-5" aria-hidden="true" />
          Nouvelle agence
        </button>
      </div>

      <section aria-label="Devise de référence" className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <span aria-hidden="true" className="chiffres grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-xl font-semibold text-white">
          €
        </span>
        <span className="flex min-w-[240px] flex-1 flex-col leading-snug">
          <span className="text-base font-semibold">Devise de référence : l&apos;euro</span>
          <span className="text-sm text-ink-muted">
            Les tarifs et les montants enregistrés sont en euros. Une agence dans une autre devise affiche et encaisse dans sa devise, au taux fixé pour elle.
          </span>
        </span>
      </section>

      {agences === null ? (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[240px] animate-pulse rounded-2xl bg-white" />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {agences.map((a) => {
            const d = devise(a.devise);
            const role = ROLES_AGENCE.find((r) => r.valeur === a.role);
            return (
              <li key={a.id}>
                <button type="button" onClick={() => setFiche(a)} className={cn("flex h-full w-full flex-col gap-3 rounded-2xl border border-line bg-white p-4 text-left", !a.isActive && "opacity-60")}>
                  <span className="flex w-full items-start gap-3">
                    <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-xl", a.devise === "EUR" ? "bg-info-soft text-info" : "bg-brand-soft text-brand-strong")}>
                      <MapPin className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold">{a.nom}</span>
                      <span className="block text-[13px] text-ink-muted">
                        {a.ville} · {a.pays}
                      </span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STYLE_ROLE[a.role])}>{role?.libelle}</span>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="chiffres text-[30px] font-medium leading-none tracking-tight">{d.symbole}</span>
                    <span className="text-sm text-ink-muted">{d.libelle}</span>
                  </span>
                  <span className="chiffres text-[13px] text-ink-muted">
                    {libelleTaux(a)}
                    {a.devise !== "EUR" && a.pariteFixe ? " · parité fixe" : ""}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {a.modesPaiement.map((m) => (
                      <span key={m} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted">
                        {libelleMode(m)}
                      </span>
                    ))}
                  </span>
                  <span className="mt-auto flex w-full items-center justify-between gap-2 border-t border-line pt-3 text-[13px] text-ink-muted">
                    <span>
                      {a.utilisateurs ? `${a.utilisateurs} utilisateur${a.utilisateurs > 1 ? "s" : ""}` : "Pas encore d'utilisateur"} · reçus{" "}
                      <span className="chiffres">{a.prefixeRecu}…</span>
                      {!a.isActive ? " · inactive" : ""}
                    </span>
                    <ChevronRight className="size-5 text-brand" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {fiche && (
        <FicheAgence
          agence={fiche === "nouvelle" ? null : fiche}
          onFermer={() => setFiche(null)}
          onEnregistre={() => {
            setFiche(null);
            charger();
          }}
        />
      )}
    </div>
  );
}

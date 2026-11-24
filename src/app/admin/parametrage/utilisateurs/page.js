"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { FicheUtilisateur } from "@/components/parametrage/fiche-utilisateur";
import { initiales } from "@/lib/caisse/montants";
import { affichageTelephone } from "@/lib/telephone";
import { libelleRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const COULEURS_ROLES = {
  ADMIN: "bg-ink text-white",
  CHEF_CAISSE: "bg-brand-soft text-brand-strong",
  STAFF: "bg-[#E8EFFD] text-info",
  AGENT: "bg-[#FFEDD5] text-[#9A3412]",
  TRACKER: "bg-[#EEE8F6] text-[#5B3E8C]",
};

/** Paramétrage · Utilisateurs : comptes du personnel, profil, agence, activation. */
export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState(null);
  const [agences, setAgences] = useState([]);
  const [filtre, setFiltre] = useState("tous");
  const [fiche, setFiche] = useState(null); // null, "nouveau" ou un compte

  const charger = useCallback(() => {
    Promise.all([fetch("/api/utilisateurs").then((r) => r.json()), fetch("/api/agences").then((r) => r.json())])
      .then(([u, a]) => {
        if (u.error) throw new Error(u.error);
        setUtilisateurs(u.utilisateurs || []);
        setAgences(a.agences || []);
      })
      .catch((e) => {
        toast.error(e.message || "Les comptes n'ont pas pu être chargés.");
        setUtilisateurs([]);
      });
  }, []);
  useEffect(charger, [charger]);

  const filtres = [
    { cle: "tous", libelle: "Tous", test: (u) => u.isActive },
    ...agences.map((a) => ({ cle: a.id, libelle: a.ville || a.nom, test: (u) => u.isActive && u.agenceId === a.id })),
    { cle: "inactifs", libelle: "Désactivés", test: (u) => !u.isActive },
  ];
  const test = filtres.find((x) => x.cle === filtre)?.test || (() => true);
  const liste = (utilisateurs || []).filter(test);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-muted">Paramétrage / Utilisateurs</p>
            <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="text-ink-muted">Les comptes du personnel : profil, agence, accès.</p>
        </div>
        <button
          type="button"
          onClick={() => setFiche("nouveau")}
          className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
        >
          <Plus className="size-5" aria-hidden="true" />
          Nouvel utilisateur
        </button>
      </div>

      <div role="tablist" aria-label="Filtrer les comptes" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {filtres.map((x) => (
          <button
            key={x.cle}
            type="button"
            role="tab"
            aria-selected={filtre === x.cle}
            onClick={() => setFiltre(x.cle)}
            className={cn("flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4", filtre === x.cle ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white font-medium")}
          >
            {x.libelle}
            <span className={cn("chiffres rounded-full px-1.5 text-xs", filtre === x.cle ? "bg-white/20" : "bg-surface-muted text-ink-muted")}>
              {(utilisateurs || []).filter(x.test).length}
            </span>
          </button>
        ))}
      </div>

      {utilisateurs === null ? (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-[92px] animate-pulse rounded-2xl bg-white" />
          ))}
        </ul>
      ) : liste.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">Aucun compte dans cette liste.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {liste.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => setFiche(u)} className={cn("flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left", !u.isActive && "opacity-60")}>
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-ink-muted">
                  {initiales(u.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{u.name || "Sans nom"}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", COULEURS_ROLES[u.role] || "bg-surface-muted")}>{libelleRole(u.role)}</span>
                    {!u.isActive && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">Désactivé</span>}
                  </span>
                  <span className="chiffres block truncate text-[13px] text-ink-muted">{affichageTelephone(u.phone)}</span>
                  <span className="block truncate text-[13px] text-ink-subtle">
                    {u.agence?.nom || "Toutes les agences"}
                    {u.lastLoginAt ? ` · vu le ${new Date(u.lastLoginAt).toLocaleDateString("fr-FR")}` : " · jamais connecté"}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-brand" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {fiche && (
        <FicheUtilisateur
          utilisateur={fiche === "nouveau" ? null : fiche}
          agences={agences}
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

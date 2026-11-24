"use client";

import { Check, Minus } from "lucide-react";
import { canAccess } from "@/lib/rbac";
import { DROITS_ACTIONS, PROFILS, libelleRole } from "@/lib/roles";

const MODULES = [
  { libelle: "Caisse", href: "/admin/caisse" },
  { libelle: "Retraits à l'arrivée", href: "/admin/retraits" },
  { libelle: "Clients", href: "/admin/clients" },
  { libelle: "Conteneurs", href: "/admin/containers" },
  { libelle: "Colis", href: "/admin/packages" },
  { libelle: "Tarifs", href: "/admin/tarifs" },
  { libelle: "Encaissements", href: "/admin/shipments" },
  { libelle: "Tableau de bord", href: "/admin/dashboard" },
  { libelle: "Paramétrage", href: "/admin/parametrage" },
];

function Case({ oui, libelle }) {
  return oui ? (
    <span className="mx-auto grid size-8 place-items-center rounded-full bg-brand-soft text-brand-strong" aria-label={`${libelle} : oui`}>
      <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
    </span>
  ) : (
    <span className="mx-auto grid size-8 place-items-center text-line-strong" aria-label={`${libelle} : non`}>
      <Minus className="size-4" aria-hidden="true" />
    </span>
  );
}

/**
 * Paramétrage · Profils et droits
 * Ce que chaque profil ouvre et peut faire. Les droits suivent le profil
 * choisi pour chaque compte (Utilisateurs) ; ils s'appliquent à la connexion.
 */
export default function ProfilsPage() {
  const roles = PROFILS.map((p) => p.role);
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <div>
        <p className="text-[13px] text-ink-muted">Paramétrage / Profils et droits</p>
            <h1 className="text-2xl font-semibold tracking-tight">Profils et droits</h1>
        <p className="text-ink-muted">Chaque compte a un profil. Il ne voit que les modules cochés, sur l&apos;accueil comme dans les barres.</p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PROFILS.map((p) => (
          <li key={p.role} className="rounded-2xl border border-line bg-white p-4">
            <div className="font-semibold">{libelleRole(p.role)}</div>
            <p className="text-sm text-ink-muted">{p.aide}</p>
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left">
          <caption className="sr-only">Modules et actions autorisés par profil</caption>
          <thead className="border-b border-line bg-surface-page text-sm">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Module ou action</th>
              {roles.map((r) => (
                <th key={r} scope="col" className="px-2 py-3 text-center font-semibold">
                  {libelleRole(r)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {MODULES.map((m) => (
              <tr key={m.href}>
                <th scope="row" className="px-4 py-2.5 font-medium">
                  {m.libelle}
                </th>
                {roles.map((r) => (
                  <td key={r} className="px-2 py-2.5 text-center">
                    <Case oui={canAccess(r, m.href)} libelle={`${libelleRole(r)}, ${m.libelle}`} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-surface-page">
              <th scope="rowgroup" colSpan={roles.length + 1} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Actions
              </th>
            </tr>
            {DROITS_ACTIONS.map((d) => (
              <tr key={d.libelle}>
                <th scope="row" className="px-4 py-2.5 font-medium">
                  {d.libelle}
                </th>
                {roles.map((r) => (
                  <td key={r} className="px-2 py-2.5 text-center">
                    <Case oui={d.roles.includes(r)} libelle={`${libelleRole(r)}, ${d.libelle}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-ink-muted">Un changement de profil s&apos;applique à la prochaine connexion de la personne.</p>
    </div>
  );
}

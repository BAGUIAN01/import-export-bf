"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Container as IconeConteneur, Settings2 } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";
import { Feuille } from "@/components/caisse/feuille";
import { cn } from "@/lib/utils";
import { STATUTS_CONTENEUR } from "@/lib/conteneurs";

export { STATUTS_CONTENEUR };

// Seuls ces conteneurs reçoivent encore des colis.
const OUVERTS = ["PREPARATION"]; // « Fermé » (LOADED) : plombé, plus de colis

function dateCourte(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** Charge les conteneurs ouverts et présélectionne le plus récent. */
export function useConteneursOuverts() {
  const { selectedContainer, setSelectedContainer, restaure } = useCaisse();
  const [conteneurs, setConteneurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!restaure) return;
    let actif = true;
    setChargement(true);
    fetch("/api/containers?limit=50")
      .then((r) => (r.ok ? r.json() : { containers: [] }))
      .then((d) => {
        if (!actif) return;
        const liste = (d.containers || []).filter((c) => OUVERTS.includes(c.status));
        setConteneurs(liste);
        const choisi = selectedContainer && liste.find((c) => c.id === selectedContainer.id);
        if (choisi) setSelectedContainer(choisi);
        else if (liste.length) setSelectedContainer(liste[0]);
        else setSelectedContainer(null);
      })
      .catch(() => {})
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaure, version]);

  return { conteneurs, chargement, recharger: () => setVersion((v) => v + 1) };
}

/** Pastille de la barre : conteneur qui reçoit les colis, touchée → choix. */
export function PastilleConteneur({ peutGerer }) {
  const { selectedContainer, setSelectedContainer } = useCaisse();
  const { conteneurs, chargement } = useConteneursOuverts();
  const [ouvert, setOuvert] = useState(false);
  const c = selectedContainer;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={cn(
          "flex h-12 items-center gap-2.5 rounded-2xl border-2 px-3 text-left",
          c ? "border-brand bg-brand-soft/60" : "border-alerte/40 bg-alerte-soft"
        )}
      >
        <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", c ? "bg-brand" : "bg-alerte")} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="hidden text-[11px] font-medium text-brand-strong min-[1180px]:block">
            {c ? STATUTS_CONTENEUR[c.status]?.libelle || "Conteneur" : "Aucun conteneur"}
          </span>
          <span className="chiffres max-w-[150px] truncate text-sm font-semibold text-ink">
            {chargement && !c ? "…" : c ? c.containerNumber : "Choisir"}
            {c && <span className="hidden font-normal text-ink-muted sm:inline"> · {c.packagesCount ?? 0}</span>}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      </button>

      <Feuille
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Conteneur en chargement"
        sousTitre="Les colis enregistrés partent dans ce conteneur."
        pied={
          peutGerer ? (
            <Link
              href="/admin/containers"
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong font-semibold text-ink"
            >
              <Settings2 className="size-5" aria-hidden="true" />
              Gérer les conteneurs
            </Link>
          ) : null
        }
      >
        {conteneurs.length === 0 && !chargement && (
          <p className="rounded-2xl bg-alerte-soft p-4 text-alerte">
            Aucun conteneur ouvert. {peutGerer ? "Créez-en un dans la gestion des conteneurs." : "Prévenez le chef de caisse."}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {conteneurs.map((x) => {
            const choisi = c?.id === x.id;
            const statut = STATUTS_CONTENEUR[x.status];
            const remplissage = x.capacity ? Math.min(100, Math.round(((x.packagesCount || 0) / x.capacity) * 100)) : null;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  aria-pressed={choisi}
                  onClick={() => {
                    setSelectedContainer(x);
                    setOuvert(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left",
                    choisi ? "border-2 border-brand bg-brand-soft/50" : "border-line bg-white"
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#FFEDD5] text-[#C2410C]" aria-hidden="true">
                    <IconeConteneur className="size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="chiffres font-semibold">{x.containerNumber}</span>
                      {statut && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statut.classe)}>{statut.libelle}</span>}
                    </span>
                    <span className="text-sm text-ink-muted">
                      {x.packagesCount ?? 0} colis
                      {x.departureDate ? ` · départ le ${dateCourte(x.departureDate)}` : ""}
                      {x.destination ? ` · ${x.destination}` : ""}
                    </span>
                    {remplissage !== null && (
                      <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${remplissage}%` }} />
                      </span>
                    )}
                  </span>
                  {choisi && <Check className="size-6 shrink-0 text-brand" aria-label="Choisi" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Feuille>
    </>
  );
}

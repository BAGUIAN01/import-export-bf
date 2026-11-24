"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { CarteConteneur } from "@/components/gestion/conteneurs/carte-conteneur";
import { ContainerDialog } from "@/components/modules/admin/containers/container-dialog";
import { useContainerMutations } from "@/hooks/use-containers";
import { ETAPES_CONTENEUR, STATUTS_CONTENEUR, joursAvant, trierConteneurs } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { cn } from "@/lib/utils";

const FILTRES = [
  { cle: "tous", libelle: "Tous", statuts: null },
  { cle: "chargement", libelle: "En chargement", statuts: ["PREPARATION"] },
  { cle: "route", libelle: "En route", statuts: ["LOADED", "IN_TRANSIT", "CUSTOMS"] },
  { cle: "arrives", libelle: "Arrivés", statuts: ["DELIVERED"] },
];

/**
 * Gestion · Conteneurs
 * Le conteneur tient lieu de session : il se remplit à la caisse, on le
 * ferme (plomb) au départ, puis on suit la route jusqu'à l'arrivée.
 */
export default function ConteneursPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const peutAgir = ["ADMIN", "TRACKER", "CHEF_CAISSE", "STAFF"].includes(role);
  const peutCreer = role === "ADMIN";
  const { createContainer, isLoading: creation } = useContainerMutations();

  const [conteneurs, setConteneurs] = useState(null);
  const [filtre, setFiltre] = useState("tous");
  const [nouveau, setNouveau] = useState(false);

  const charger = useCallback(() => {
    fetch("/api/containers/resume")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Erreur ${r.status}`))))
      .then((d) => setConteneurs(d.containers || []))
      .catch(() => {
        toast.error("Impossible de charger les conteneurs.");
        setConteneurs([]);
      });
  }, []);
  useEffect(charger, [charger]);

  const liste = useMemo(() => trierConteneurs(conteneurs || []), [conteneurs]);
  const parStatut = (statuts) => liste.filter((c) => statuts.includes(c.status));
  const filtreActif = FILTRES.find((f) => f.cle === filtre);
  const affiches = filtreActif?.statuts ? liste.filter((c) => filtreActif.statuts.includes(c.status)) : liste;

  const enChargement = parStatut(["PREPARATION"]);
  const enRoute = parStatut(["LOADED", "IN_TRANSIT", "CUSTOMS"]);
  const arrives = parStatut(["DELIVERED"]);
  const aRemettre = arrives.reduce((n, c) => n + Math.max(0, c.shipmentsCount - c.deliveredCount), 0);
  const aEncaisser = liste.reduce((n, c) => n + Math.max(0, c.totalAmount - c.paidAmount), 0);

  // Points d'attention : départ proche avec de l'argent à encaisser, arrivés pas encore remis
  const attention = [
    ...enChargement
      .filter((c) => {
        const j = joursAvant(c.departureDate);
        return j !== null && j >= 0 && j <= 3 && c.totalAmount - c.paidAmount > 0;
      })
      .map((c) => ({
        id: `${c.id}-depart`,
        texte: `${c.containerNumber} part dans ${joursAvant(c.departureDate)} jour(s) : ${formatMontant(c.totalAmount - c.paidAmount)} restent à encaisser.`,
      })),
    ...arrives
      .filter((c) => c.shipmentsCount - c.deliveredCount > 0)
      .map((c) => ({
        id: `${c.id}-remise`,
        texte: `${c.containerNumber} est arrivé : ${c.shipmentsCount - c.deliveredCount} envoi(s) attendent leur destinataire.`,
      })),
  ];

  const chiffres = [
    { libelle: "En chargement", valeur: enChargement.length, detail: `${enChargement.reduce((n, c) => n + c.packagesCount, 0)} colis` },
    { libelle: "En route", valeur: enRoute.length, detail: "fermés, en mer ou en douane" },
    { libelle: "À remettre", valeur: aRemettre, detail: "envois arrivés", alerte: aRemettre > 0 },
    { libelle: "À encaisser", valeur: formatMontant(aEncaisser), detail: "tous conteneurs", alerte: aEncaisser > 0 },
  ];

  function majConteneur(c) {
    if (!c) return;
    setConteneurs((l) => l.map((x) => (x.id === c.id ? { ...x, ...c, packagesCount: x.packagesCount } : x)));
    charger();
  }

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conteneurs</h1>
          <p className="text-ink-muted">Un conteneur par chargement, une à deux fois par mois.</p>
        </div>
        {peutCreer && (
          <button
            type="button"
            onClick={() => setNouveau(true)}
            className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white shadow-[0_2px_6px_rgba(14,122,85,.25)]"
          >
            <Plus className="size-5" aria-hidden="true" />
            Nouveau conteneur
          </button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {chiffres.map((c) => (
          <div key={c.libelle} className="rounded-2xl border border-line bg-white p-4">
            <dt className="text-sm text-ink-muted">{c.libelle}</dt>
            <dd className={cn("chiffres mt-1 text-2xl font-semibold tracking-tight", c.alerte && "text-alerte")}>{conteneurs ? c.valeur : "…"}</dd>
            <dd className="text-xs text-ink-subtle">{c.detail}</dd>
          </div>
        ))}
      </dl>

      {/* Étapes d'un conteneur */}
      <ol aria-label="Étapes d'un conteneur" className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-2 [scrollbar-width:none]">
        {ETAPES_CONTENEUR.map((s, i) => {
          const n = liste.filter((c) => c.status === s).length;
          return (
            <li key={s} className="flex min-w-[120px] flex-1 items-center gap-2 rounded-xl px-3 py-2">
              <span className={cn("chiffres grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold", n ? "bg-brand text-white" : "bg-surface-muted text-ink-muted")}>
                {i + 1}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{STATUTS_CONTENEUR[s].libelle}</span>
                <span className="chiffres text-xs text-ink-muted">{n}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {attention.length > 0 && (
        <section aria-label="Points d'attention" className="flex flex-col gap-2 rounded-2xl bg-alerte-soft p-4 text-alerte">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5" aria-hidden="true" />
            Points d&apos;attention
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-6 text-sm">
            {attention.map((a) => (
              <li key={a.id}>{a.texte}</li>
            ))}
          </ul>
        </section>
      )}

      <div role="tablist" aria-label="Filtrer les conteneurs" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {FILTRES.map((f) => {
          const n = f.statuts ? liste.filter((c) => f.statuts.includes(c.status)).length : liste.length;
          return (
            <button
              key={f.cle}
              type="button"
              role="tab"
              aria-selected={filtre === f.cle}
              onClick={() => setFiltre(f.cle)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4",
                filtre === f.cle ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white font-medium"
              )}
            >
              {f.libelle}
              <span className={cn("chiffres rounded-full px-1.5 text-xs", filtre === f.cle ? "bg-white/20" : "bg-surface-muted text-ink-muted")}>{n}</span>
            </button>
          );
        })}
      </div>

      {!conteneurs ? (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-[260px] animate-pulse rounded-[20px] bg-white" />
          ))}
        </ul>
      ) : affiches.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">Aucun conteneur dans cette liste.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {affiches.map((c) => (
            <li key={c.id}>
              <CarteConteneur conteneur={c} onMaj={majConteneur} peutAgir={peutAgir} />
            </li>
          ))}
        </ul>
      )}

      {peutCreer && (
        <ContainerDialog
          isOpen={nouveau}
          onClose={() => setNouveau(false)}
          loading={creation}
          onSave={async (donnees) => {
            // Le hook affiche lui-même le message de réussite ou d'erreur
            const r = await createContainer(donnees);
            if (r.success) {
              setNouveau(false);
              charger();
            }
          }}
        />
      )}
    </div>
  );
}

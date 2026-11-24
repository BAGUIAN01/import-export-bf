"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EnTete, Etat, PRINCIPAL, Pastilles, Recherche, StatCard, StatGrid, Tableau } from "@/components/epure";
import { BoutonActionConteneur } from "@/components/gestion/conteneurs/action-conteneur";
import { ContainerDialog } from "@/components/modules/admin/containers/container-dialog";
import { useContainerMutations } from "@/hooks/use-containers";
import { STATUTS_CONTENEUR, trierConteneurs } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { sansAccents } from "@/lib/caisse/familles";

const TON = { PREPARATION: "ambre", LOADED: "bleu", IN_TRANSIT: "bleu", CUSTOMS: "violet", DELIVERED: "vert", CANCELLED: "rouge" };
const FILTRES = [
  { id: "tous", label: "Tous", statuts: null },
  { id: "chargement", label: "En chargement", statuts: ["PREPARATION"] },
  { id: "route", label: "En route", statuts: ["LOADED", "IN_TRANSIT", "CUSTOMS"] },
  { id: "arrives", label: "Arrivés", statuts: ["DELIVERED"] },
];
const date = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—");

/** Gestion · Conteneurs : un conteneur par chargement, une à deux fois par mois. */
export default function ConteneursPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const peutAgir = ["ADMIN", "TRACKER", "CHEF_CAISSE", "STAFF"].includes(role);
  const peutCreer = ["ADMIN", "TRACKER", "CHEF_CAISSE"].includes(role);
  const { createContainer, isLoading: creation } = useContainerMutations();

  const [conteneurs, setConteneurs] = useState(null);
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [nouveau, setNouveau] = useState(false);

  const charger = useCallback(() => {
    fetch("/api/containers/resume")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Impossible de charger les conteneurs."))))
      .then((d) => setConteneurs(d.containers || []))
      .catch((e) => {
        toast.error(e.message);
        setConteneurs([]);
      });
  }, []);
  useEffect(charger, [charger]);

  const liste = useMemo(() => trierConteneurs(conteneurs || []), [conteneurs]);
  const de = (statuts) => liste.filter((c) => statuts.includes(c.status));
  const actif = FILTRES.find((f) => f.id === filtre);
  const q = sansAccents(recherche).trim();
  const lignes = liste.filter((c) => (!actif.statuts || actif.statuts.includes(c.status)) && (!q || sansAccents(`${c.containerNumber} ${c.name || ""}`).includes(q)));

  const enCharge = de(["PREPARATION"]);
  const aRemettre = de(["DELIVERED"]).reduce((n, c) => n + Math.max(0, c.shipmentsCount - c.deliveredCount), 0);
  const aEncaisser = liste.reduce((n, c) => n + Math.max(0, c.totalAmount - c.paidAmount), 0);

  const colonnes = [
    {
      id: "numero",
      titre: "Conteneur",
      mobile: "titre",
      rendu: (c) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="chiffres font-semibold">{c.containerNumber}</span>
          <Etat ton={TON[c.status]}>{STATUTS_CONTENEUR[c.status]?.libelle}</Etat>
        </span>
      ),
    },
    { id: "depart", titre: "Départ", rendu: (c) => date(c.actualDeparture || c.departureDate) },
    { id: "colis", titre: "Colis", rendu: (c) => <span className="chiffres">{c.capacity ? `${c.packagesCount} / ${c.capacity}` : c.packagesCount}</span> },
    {
      id: "envois",
      titre: "Envois",
      rendu: (c) => <span className="chiffres">{c.status === "DELIVERED" ? `${c.deliveredCount} / ${c.shipmentsCount} remis` : c.shipmentsCount}</span>,
    },
    {
      id: "reste",
      titre: "À encaisser",
      aDroite: true,
      rendu: (c) => {
        const r = Math.max(0, c.totalAmount - c.paidAmount);
        return <span className={r > 0 ? "chiffres text-alerte" : "chiffres text-ink-subtle"}>{r > 0 ? formatMontant(r) : "—"}</span>;
      },
    },
  ];

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete
        chemin="Gestion / Conteneurs"
        titre="Conteneurs"
        actions={
          peutCreer && (
            <button type="button" onClick={() => setNouveau(true)} className={PRINCIPAL}>
              <Plus className="size-5" aria-hidden="true" />
              Nouveau conteneur
            </button>
          )
        }
      />

      <StatGrid>
        <StatCard variant="noire" label="En chargement" value={conteneurs ? enCharge.length : "…"} detail={`${enCharge.reduce((n, c) => n + c.packagesCount, 0)} colis`} />
        <StatCard couleur="bleu" label="En route" value={conteneurs ? de(["LOADED", "IN_TRANSIT", "CUSTOMS"]).length : "…"} detail="fermés, en mer, en douane" />
        <StatCard couleur="vert" label="Envois à remettre" value={conteneurs ? aRemettre : "…"} detail="conteneurs arrivés" />
        <StatCard couleur="ambre" label="À encaisser" value={conteneurs ? formatMontant(aEncaisser) : "…"} />
      </StatGrid>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Pastilles
          options={FILTRES.map((f) => ({ id: f.id, label: f.label, compte: f.statuts ? de(f.statuts).length : liste.length }))}
          valeur={filtre}
          onChange={setFiltre}
          libelle="Filtrer les conteneurs"
        />
        <Recherche valeur={recherche} onChange={setRecherche} placeholder="N° de conteneur" className="md:ml-auto md:w-72" />
      </div>

      <Tableau
        libelle="Conteneurs"
        colonnes={colonnes}
        lignes={lignes}
        chargement={!conteneurs}
        vide="Aucun conteneur dans cette liste."
        onLigne={(c) => router.push(`/admin/containers/${c.id}`)}
        actions={peutAgir ? (c) => <BoutonActionConteneur conteneur={c} onFait={charger} variante="contour" className="h-10 text-sm" /> : undefined}
      />

      {peutCreer && (
        <ContainerDialog
          isOpen={nouveau}
          onClose={() => setNouveau(false)}
          loading={creation}
          onSave={async (donnees) => {
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

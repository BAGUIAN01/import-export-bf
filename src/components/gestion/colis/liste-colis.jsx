"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { BoutonFlottant, EnTete, Etat, PRINCIPAL, Pastilles, Recherche, StatCard, StatGrid, Tableau } from "@/components/epure";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { usePackages } from "@/hooks/use-packages";
import { ouvrirCaisse } from "@/lib/caisse/ouvrir";
import { canAccess } from "@/lib/rbac";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { sansAccents } from "@/lib/caisse/familles";
import { useEtatSession } from "@/hooks/use-etat-session";
import { selectionColis } from "@/components/gestion/actions-groupees";

export const ETATS_COLIS = {
  REGISTERED: ["Enregistré", "gris"],
  COLLECTED: ["Collecté", "gris"],
  IN_CONTAINER: ["En conteneur", "ambre"],
  IN_TRANSIT: ["En route", "bleu"],
  CUSTOMS: ["En douane", "violet"],
  DELIVERED: ["Remis", "vert"],
  RETURNED: ["Retourné", "rouge"],
  CANCELLED: ["Annulé", "rouge"],
};

const FILTRES = [
  { id: "tous", label: "Tous", statuts: null },
  { id: "depart", label: "Au départ", statuts: ["REGISTERED", "COLLECTED", "IN_CONTAINER"] },
  { id: "route", label: "En route", statuts: ["IN_TRANSIT", "CUSTOMS"] },
  { id: "remis", label: "Remis", statuts: ["DELIVERED"] },
];

/** Gestion · Colis : tous les colis, leur conteneur et leur état. */
export function ListeColis({ clients, containers }) {
  const router = useRouter();
  const { packages, isLoading, mutate } = usePackages({ limit: 500 });
  const [filtre, setFiltre] = useEtatSession("colis:filtre", "tous");
  const [recherche, setRecherche] = useEtatSession("colis:recherche", "");
  const [nouveau, setNouveau] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  // Nouvel envoi : à la caisse (sans accès à la caisse, l'ancien formulaire)
  const { data: session } = useSession();
  const caisse = canAccess(session?.user?.role, "/admin/caisse");

  const liste = useMemo(() => packages || [], [packages]);
  const de = (statuts) => liste.filter((p) => statuts.includes(p.status));
  const actif = FILTRES.find((f) => f.id === filtre);
  const q = sansAccents(recherche).trim();
  const lignes = liste.filter(
    (p) =>
      (!actif.statuts || actif.statuts.includes(p.status)) &&
      (!q || sansAccents(`${p.packageNumber} ${p.description} ${p.client?.firstName} ${p.client?.lastName} ${p.container?.containerNumber || ""}`).includes(q))
  );

  async function creer(form) {
    setEnvoi(true);
    try {
      const res = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Les colis n'ont pas pu être enregistrés.");
      toast.success(data.message || "Colis enregistrés.");
      setNouveau(false);
      mutate();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete
        chemin="Gestion / Colis"
        titre="Colis"
        actions={
          <span className="hidden md:contents">
            <button type="button" onClick={() => (caisse ? ouvrirCaisse(router) : setNouveau(true))} className={PRINCIPAL}>
              <Plus className="size-5" aria-hidden="true" />
              {caisse ? "Nouvel envoi" : "Nouvelle expédition"}
            </button>
          </span>
        }
      />

      <StatGrid>
        <StatCard variant="noire" label="Colis" value={isLoading ? "…" : liste.length} detail="les 500 derniers" />
        <StatCard couleur="ambre" label="Au départ" value={isLoading ? "…" : de(FILTRES[1].statuts).length} />
        <StatCard couleur="bleu" label="En route" value={isLoading ? "…" : de(FILTRES[2].statuts).length} />
        <StatCard couleur="vert" label="Remis" value={isLoading ? "…" : de(FILTRES[3].statuts).length} />
      </StatGrid>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Pastilles
          options={FILTRES.map((f) => ({ id: f.id, label: f.label, compte: f.statuts ? de(f.statuts).length : liste.length }))}
          valeur={filtre}
          onChange={setFiltre}
          libelle="Filtrer les colis"
        />
        <Recherche valeur={recherche} onChange={setRecherche} placeholder="N° de colis, client, conteneur" className="md:ml-auto md:w-80" />
      </div>

      <Tableau
        selection={session?.user?.role === "ADMIN" ? selectionColis(() => mutate()) : undefined}
        libelle="Colis"
        chargement={isLoading}
        lignes={lignes}
        vide="Aucun colis dans cette liste."
        onLigne={(p) => p.shipment?.id && router.push(`/admin/shipments/${p.shipment.id}`)}
        colonnes={[
          { id: "description", titre: "Colis", mobile: "titre", rendu: (p) => p.description },
          { id: "numero", titre: "N°", rendu: (p) => <span className="chiffres">{p.packageNumber}</span> },
          { id: "client", titre: "Client", rendu: (p) => nomAffiche(p.client) },
          { id: "conteneur", titre: "Conteneur", rendu: (p) => <span className="chiffres">{p.container?.containerNumber || "—"}</span>, mobileRendu: (p) => p.container?.containerNumber || null },
          { id: "etat", titre: "État", mobile: "etat", rendu: (p) => <Etat ton={(ETATS_COLIS[p.status] || ETATS_COLIS.REGISTERED)[1]}>{(ETATS_COLIS[p.status] || ETATS_COLIS.REGISTERED)[0]}</Etat> },
          { id: "montant", titre: "Montant", aDroite: true, mobile: "droite", rendu: (p) => <span className="chiffres">{formatMontant(p.totalAmount)}</span> },
        ]}
      />

      <BoutonFlottant libelle={caisse ? "Nouvel envoi" : "Nouvelle expédition"} onClick={() => (caisse ? ouvrirCaisse(router) : setNouveau(true))} />
      <PackageDialog isOpen={nouveau} onClose={() => setNouveau(false)} package={null} clients={clients} containers={containers} onSave={creer} loading={envoi} />
    </div>
  );
}

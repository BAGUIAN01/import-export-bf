"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EnTete, Etat, Pastilles, Recherche, StatCard, StatGrid, Tableau } from "@/components/epure";
import { ShipmentEditDialog } from "@/components/modules/admin/shipments/shipment-edit-dialog";
import { useShipmentMutations } from "@/hooks/use-shipments";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { sansAccents } from "@/lib/caisse/familles";

const ETATS_PAIEMENT = {
  PAID: ["Soldé", "vert"],
  PARTIAL: ["Acompte", "ambre"],
  PENDING: ["À payer", "ambre"],
  CANCELLED: ["Annulé", "gris"],
  REFUNDED: ["Remboursé", "gris"],
};

const FILTRES = [
  { id: "tous", label: "Tous", test: () => true },
  { id: "payer", label: "À payer", test: (e) => e.paymentStatus === "PENDING" },
  { id: "acompte", label: "Acompte", test: (e) => e.paymentStatus === "PARTIAL" },
  { id: "soldes", label: "Soldés", test: (e) => e.paymentStatus === "PAID" },
];

const reste = (e) => Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0));

/** Gestion · Encaissements : chaque envoi, ce qui est payé et ce qui reste. */
export default function EncaissementsPage() {
  const router = useRouter();
  const { updateShipment, isLoading: enregistrement } = useShipmentMutations();
  const [envois, setEnvois] = useState(null);
  const [filtre, setFiltre] = useState("tous");
  const [conteneur, setConteneur] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [encaisser, setEncaisser] = useState(null);

  const charger = useCallback(() => {
    fetch("/api/shipments?limit=1000")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Les envois n'ont pas pu être chargés."))))
      .then((d) => setEnvois(d.data || []))
      .catch((e) => {
        toast.error(e.message);
        setEnvois([]);
      });
  }, []);
  useEffect(charger, [charger]);

  const liste = useMemo(() => envois || [], [envois]);
  const conteneurs = useMemo(() => {
    const m = new Map();
    for (const e of liste) if (e.container) m.set(e.container.id, e.container.containerNumber);
    return [...m.entries()];
  }, [liste]);
  const dansConteneur = liste.filter((e) => conteneur === "tous" || e.container?.id === conteneur);
  const actif = FILTRES.find((f) => f.id === filtre);
  const q = sansAccents(recherche).trim();
  const lignes = dansConteneur.filter(
    (e) => actif.test(e) && (!q || sansAccents(`${e.shipmentNumber} ${e.client?.firstName} ${e.client?.lastName} ${e.client?.phone}`).includes(q))
  );

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete chemin="Gestion / Encaissements" titre="Encaissements" />

      <StatGrid>
        <StatCard variant="noire" label="Encaissé" value={envois ? formatMontant(dansConteneur.reduce((s, e) => s + (e.paidAmount || 0), 0)) : "…"} detail={`${dansConteneur.length} envois`} />
        <StatCard couleur="ambre" label="Reste à encaisser" value={envois ? formatMontant(dansConteneur.reduce((s, e) => s + reste(e), 0)) : "…"} />
        <StatCard couleur="vert" label="Envois soldés" value={envois ? dansConteneur.filter((e) => e.paymentStatus === "PAID").length : "…"} />
        <StatCard couleur="bleu" label="Remis au destinataire" value={envois ? dansConteneur.filter((e) => e.deliveredAt).length : "…"} />
      </StatGrid>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Pastilles options={FILTRES.map((f) => ({ id: f.id, label: f.label, compte: dansConteneur.filter(f.test).length }))} valeur={filtre} onChange={setFiltre} libelle="Filtrer par paiement" />
        <div className="flex gap-2 lg:ml-auto">
          <label className="sr-only" htmlFor="filtre-conteneur">
            Conteneur
          </label>
          <select
            id="filtre-conteneur"
            value={conteneur}
            onChange={(e) => setConteneur(e.target.value)}
            className="chiffres h-12 rounded-xl border border-line-strong bg-white px-3 text-[15px]"
          >
            <option value="tous">Tous les conteneurs</option>
            {conteneurs.map(([id, numero]) => (
              <option key={id} value={id}>
                {numero}
              </option>
            ))}
          </select>
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="Client, n° de suivi" className="flex-1 lg:w-72" />
        </div>
      </div>

      <Tableau
        libelle="Envois"
        chargement={!envois}
        lignes={lignes}
        vide="Aucun envoi dans cette liste."
        onLigne={(e) => router.push(`/admin/shipments/${e.id}`)}
        colonnes={[
          { id: "client", titre: "Client", mobile: "titre", rendu: (e) => nomAffiche(e.client) },
          { id: "suivi", titre: "N° de suivi", rendu: (e) => <span className="chiffres">{e.shipmentNumber}</span> },
          { id: "conteneur", titre: "Conteneur", rendu: (e) => <span className="chiffres">{e.container?.containerNumber || "—"}</span> },
          { id: "montant", titre: "Montant", aDroite: true, rendu: (e) => <span className="chiffres">{formatMontant(e.totalAmount)}</span> },
          { id: "reste", titre: "Reste", aDroite: true, rendu: (e) => (reste(e) > 0 ? <span className="chiffres text-alerte">{formatMontant(reste(e))}</span> : <span className="text-ink-subtle">—</span>) },
          {
            id: "etat",
            titre: "État",
            rendu: (e) => (e.deliveredAt ? <Etat ton="vert">Remis</Etat> : <Etat ton={(ETATS_PAIEMENT[e.paymentStatus] || ETATS_PAIEMENT.PENDING)[1]}>{(ETATS_PAIEMENT[e.paymentStatus] || ETATS_PAIEMENT.PENDING)[0]}</Etat>),
          },
        ]}
        actions={(e) =>
          reste(e) > 0 ? (
            <button type="button" onClick={() => setEncaisser(e)} className="h-10 rounded-xl border border-line-strong bg-white px-3 text-sm font-semibold hover:bg-surface-muted">
              Encaisser
            </button>
          ) : null
        }
      />

      <ShipmentEditDialog
        shipment={encaisser}
        isOpen={!!encaisser}
        loading={enregistrement}
        onClose={() => setEncaisser(null)}
        onSave={async (donnees) => {
          const r = await updateShipment(encaisser.id, donnees);
          if (r?.success) {
            setEncaisser(null);
            charger();
          }
        }}
      />
    </div>
  );
}

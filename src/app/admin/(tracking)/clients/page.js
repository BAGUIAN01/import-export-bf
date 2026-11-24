"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { EnTete, Etat, PRINCIPAL, Pastilles, Recherche, StatCard, StatGrid, Tableau } from "@/components/epure";
import { NouveauClient } from "@/components/caisse/client/nouveau-client";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche, resteDu } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";
import { sansAccents } from "@/lib/caisse/familles";
import { useActualisation } from "@/components/gestion/actualisation";

const FILTRES = [
  { id: "tous", label: "Tous", test: () => true },
  { id: "solder", label: "À solder", test: (c) => resteDu(c) > 0 },
  { id: "vip", label: "VIP", test: (c) => c.isVip },
  { id: "sans", label: "Sans envoi", test: (c) => !c.shipmentsCount },
];

/** Gestion · Clients : expéditeurs, leur destinataire habituel, leurs envois. */
export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState(null);
  const [stats, setStats] = useState(null);
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [nouveau, setNouveau] = useState(false);

  const charger = useCallback(() => {
    fetch("/api/clients?limit=1000&includeStats=true")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Les clients n'ont pas pu être chargés."))))
      .then((d) => {
        setClients(d.data || []);
        setStats(d.stats || null);
      })
      .catch((e) => {
        toast.error(e.message);
        setClients([]);
      });
  }, []);
  // Tirer pour actualiser, retour dans l'application : on recharge
  const { version } = useActualisation();
  useEffect(charger, [charger, version]);

  const liste = useMemo(() => clients || [], [clients]);
  const actif = FILTRES.find((f) => f.id === filtre);
  const q = sansAccents(recherche).trim();
  const lignes = liste.filter(
    (c) => actif.test(c) && (!q || sansAccents(`${c.firstName} ${c.lastName} ${c.phone} ${c.clientCode} ${c.recipientName || ""}`).includes(q))
  );
  const aSolder = liste.filter((c) => resteDu(c) > 0);

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete
        chemin="Gestion / Clients"
        titre="Clients"
        actions={
          <button type="button" onClick={() => setNouveau(true)} className={PRINCIPAL}>
            <UserPlus className="size-5" aria-hidden="true" />
            Nouveau client
          </button>
        }
      />

      <StatGrid>
        <StatCard variant="noire" label="Clients" value={stats ? stats.total : "…"} detail={stats ? `${stats.newThisMonth} nouveaux en 30 jours` : null} />
        <StatCard couleur="vert" label="Avec des envois" value={stats ? stats.withOrders : "…"} />
        <StatCard couleur="ambre" label="À solder" value={clients ? aSolder.length : "…"} detail={clients ? formatMontant(aSolder.reduce((s, c) => s + resteDu(c), 0)) : null} />
        <StatCard couleur="bleu" label="Encaissé au total" value={stats ? formatMontant(stats.totalPaid) : "…"} />
      </StatGrid>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Pastilles options={FILTRES.map((f) => ({ id: f.id, label: f.label, compte: liste.filter(f.test).length }))} valeur={filtre} onChange={setFiltre} libelle="Filtrer les clients" />
        <Recherche valeur={recherche} onChange={setRecherche} placeholder="Nom, téléphone, code client" className="md:ml-auto md:w-80" />
      </div>

      <Tableau
        libelle="Clients"
        chargement={!clients}
        lignes={lignes}
        vide="Aucun client dans cette liste."
        onLigne={(c) => router.push(`/admin/clients/${c.id}`)}
        colonnes={[
          {
            id: "nom",
            titre: "Client",
            mobile: "titre",
            rendu: (c) => (
              <span className="flex items-center gap-1.5">
                {nomAffiche(c)}
                {c.isVip && <Star className="size-4 shrink-0 fill-[#F5B014] text-[#F5B014]" aria-label="VIP" />}
              </span>
            ),
          },
          { id: "tel", titre: "Téléphone", rendu: (c) => <span className="chiffres">{affichageTelephone(c.phone)}</span> },
          { id: "dest", titre: "Destinataire", rendu: (c) => [c.recipientName, c.recipientCity].filter(Boolean).join(" · ") || "—" },
          { id: "envois", titre: "Envois", rendu: (c) => <span className="chiffres">{c.shipmentsCount || 0}</span> },
          {
            id: "reste",
            titre: "Reste à payer",
            aDroite: true,
            rendu: (c) => (resteDu(c) > 0 ? <Etat ton="ambre">{formatMontant(resteDu(c))}</Etat> : <span className="text-ink-subtle">—</span>),
          },
        ]}
      />

      {nouveau && (
        <NouveauClient
          onFermer={() => setNouveau(false)}
          onCree={(c) => {
            setNouveau(false);
            toast.success(`${nomAffiche(c)} est enregistré.`);
            charger();
          }}
        />
      )}
    </div>
  );
}

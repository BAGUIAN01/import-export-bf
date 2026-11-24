"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, FileText, Package, Pencil, Printer, Route } from "lucide-react";
import { BoutonActionConteneur } from "@/components/gestion/conteneurs/action-conteneur";
import { SuiviConteneur } from "@/components/gestion/conteneurs/suivi-conteneur";
import { EtapesConteneur } from "@/components/gestion/conteneurs/etapes-conteneur";
import { ContainerDialog } from "@/components/modules/admin/containers/container-dialog";
import { useContainerMutations } from "@/hooks/use-containers";
import { Bloc, EnTete, Etat, Onglets, Recherche, SECONDAIRE, StatCard, StatGrid, Tableau } from "@/components/epure";
import { STATUTS_CONTENEUR } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { PACKAGE_TYPES } from "@/lib/data/packages";
import { sansAccents } from "@/lib/caisse/familles";

const TON = { PREPARATION: "ambre", LOADED: "bleu", IN_TRANSIT: "bleu", CUSTOMS: "violet", DELIVERED: "vert", CANCELLED: "rouge" };
const PAIEMENT = { PAID: ["Soldé", "vert"], PARTIAL: ["Acompte", "ambre"], PENDING: ["À payer", "ambre"], CANCELLED: ["Annulé", "gris"], REFUNDED: ["Remboursé", "gris"] };
const LIBELLE_TYPE = Object.fromEntries(PACKAGE_TYPES.map((t) => [t.value, t.label]));

function typesDe(colis) {
  try {
    const t = typeof colis.types === "string" ? JSON.parse(colis.types) : colis.types;
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}

/** Fiche d'un conteneur : chiffres, puis Envois · Colis · Manifeste · Suivi. */
export function FicheConteneur({ container: initial, currentUser }) {
  const router = useRouter();
  const [c, setC] = useState(initial);
  const [onglet, setOnglet] = useState("envois");
  const [envois, setEnvois] = useState(null);
  const [colis, setColis] = useState(null);
  const [recherche, setRecherche] = useState("");
  const peutAgir = ["ADMIN", "TRACKER", "CHEF_CAISSE", "STAFF"].includes(currentUser?.role);
  const [modifier, setModifier] = useState(false);
  const { updateContainer, isLoading: enregistrement } = useContainerMutations();
  // Données du serveur rafraîchies (étape ajoutée, conteneur modifié)
  useEffect(() => setC(initial), [initial]);

  useEffect(() => {
    let actif = true;
    fetch(`/api/shipments?containerId=${c.id}&limit=500`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => actif && setEnvois(d.data || []))
      .catch(() => actif && setEnvois([]));
    fetch(`/api/containers/${c.id}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => actif && setColis(d.container?.packages || []))
      .catch(() => actif && setColis([]));
    return () => {
      actif = false;
    };
  }, [c.id]);

  const q = sansAccents(recherche).trim();
  const envoisFiltres = (envois || []).filter(
    (e) => !q || sansAccents(`${e.shipmentNumber} ${e.client?.firstName} ${e.client?.lastName} ${e.client?.phone} ${e.client?.recipientName}`).includes(q)
  );
  const colisFiltres = (colis || []).filter((p) => !q || sansAccents(`${p.packageNumber} ${p.description} ${p.client?.firstName} ${p.client?.lastName}`).includes(q));

  const total = (envois || []).reduce((s, e) => s + (e.totalAmount || 0), 0);
  const paye = (envois || []).reduce((s, e) => s + (e.paidAmount || 0), 0);
  const remis = (envois || []).filter((e) => e.deliveredAt).length;

  const manifeste = useMemo(() => {
    const parType = new Map();
    for (const p of colis || []) for (const t of typesDe(p)) parType.set(t.type || "OTHER", (parType.get(t.type || "OTHER") || 0) + (t.quantity || 1));
    return [...parType.entries()].map(([type, quantite]) => ({ type, libelle: LIBELLE_TYPE[type] || type, quantite })).sort((a, b) => b.quantite - a.quantite);
  }, [colis]);
  const totalQuantite = manifeste.reduce((s, m) => s + m.quantite, 0);

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <div className="print:hidden">
        <EnTete
          chemin={
            <>
              <Link href="/admin/containers" className="hover:text-ink">
                Gestion / Conteneurs
              </Link>
              {" / "}
              {c.containerNumber}
            </>
          }
          titre={<span className="chiffres">{c.containerNumber}</span>}
          sousTitre={`${c.origin || "France"} → ${c.destination || "Burkina Faso"}${c.sealNumber ? ` · plomb ${c.sealNumber}` : ""}`}
          actions={
            peutAgir && (
              <>
                <button type="button" onClick={() => setModifier(true)} className={SECONDAIRE}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Modifier
                </button>
                <BoutonActionConteneur conteneur={{ ...c, packagesCount: colis?.length ?? c.packagesCount }} onFait={(m) => {
                    if (m) setC((x) => ({ ...x, ...m }));
                    router.refresh();
                  }} />
              </>
            )
          }
        >
          <Etat ton={TON[c.status]} className="text-sm">
            {STATUTS_CONTENEUR[c.status]?.libelle}
          </Etat>
        </EnTete>
      </div>

      {peutAgir && (
        <div className="print:hidden">
          <EtapesConteneur conteneur={c} onFait={() => router.refresh()} />
        </div>
      )}

      <StatGrid className="print:hidden">
        <StatCard variant="noire" label="Envois" value={envois ? envois.length : "…"} detail={envois ? `${remis} remis` : null} />
        <StatCard couleur="bleu" label="Colis" value={colis ? colis.length : "…"} detail={c.capacity ? `sur ${c.capacity}` : null} />
        <StatCard couleur="vert" label="Encaissé" value={envois ? formatMontant(paye) : "…"} />
        <StatCard couleur="ambre" label="À encaisser" value={envois ? formatMontant(Math.max(0, total - paye)) : "…"} />
      </StatGrid>

      <Onglets
        className="print:hidden"
        valeur={onglet}
        onChange={setOnglet}
        libelle="Fiche du conteneur"
        options={[
          { id: "envois", label: "Envois", icon: ClipboardList, compte: envois?.length },
          { id: "colis", label: "Colis", icon: Package, compte: colis?.length },
          { id: "manifeste", label: "Manifeste", icon: FileText },
          { id: "suivi", label: "Suivi", icon: Route },
        ]}
      />

      {(onglet === "envois" || onglet === "colis") && (
        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder={onglet === "envois" ? "Client, téléphone, n° de suivi" : "N° de colis, client, description"}
          className="md:w-96"
        />
      )}

      {onglet === "envois" && (
        <Tableau
          libelle="Envois du conteneur"
          chargement={envois === null}
          lignes={envoisFiltres}
          vide="Aucun envoi dans ce conteneur."
          onLigne={(e) => router.push(`/admin/shipments/${e.id}`)}
          colonnes={[
            { id: "client", titre: "Client", mobile: "titre", rendu: (e) => nomAffiche(e.client) },
            { id: "suivi", titre: "N° de suivi", rendu: (e) => <span className="chiffres">{e.shipmentNumber}</span> },
            { id: "pour", titre: "Destinataire", rendu: (e) => [e.client?.recipientName, e.client?.recipientCity].filter(Boolean).join(" · ") || "—" },
            { id: "colis", titre: "Colis", rendu: (e) => <span className="chiffres">{e.packagesCount}</span> },
            { id: "montant", titre: "Montant", aDroite: true, rendu: (e) => <span className="chiffres">{formatMontant(e.totalAmount)}</span> },
            {
              id: "etat",
              titre: "État",
              rendu: (e) => (e.deliveredAt ? <Etat ton="vert">Remis</Etat> : <Etat ton={(PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING)[1]}>{(PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING)[0]}</Etat>),
            },
          ]}
        />
      )}

      {onglet === "colis" && (
        <Tableau
          libelle="Colis du conteneur"
          chargement={colis === null}
          lignes={colisFiltres}
          vide="Aucun colis dans ce conteneur."
          colonnes={[
            { id: "description", titre: "Colis", mobile: "titre", rendu: (p) => p.description },
            { id: "numero", titre: "N°", rendu: (p) => <span className="chiffres">{p.packageNumber}</span> },
            { id: "client", titre: "Client", rendu: (p) => nomAffiche(p.client) },
            { id: "qte", titre: "Qté", rendu: (p) => <span className="chiffres">{p.totalQuantity}</span> },
            { id: "montant", titre: "Montant", aDroite: true, rendu: (p) => <span className="chiffres">{formatMontant(p.totalAmount)}</span> },
          ]}
        />
      )}

      {onglet === "manifeste" && (
        <Bloc
          titre={`Manifeste · ${c.containerNumber}`}
          actions={
            <button type="button" onClick={() => window.print()} className={`${SECONDAIRE} print:hidden`}>
              <Printer className="size-4" aria-hidden="true" />
              Imprimer
            </button>
          }
          className="print:border-0 print:p-0"
        >
          <p className="text-sm text-ink-muted">
            {c.origin || "France"} → {c.destination || "Burkina Faso"} · {envois?.length ?? 0} envois · {totalQuantite} colis
            {c.sealNumber ? ` · plomb ${c.sealNumber}` : ""}
          </p>
          <table className="w-full text-left">
            <thead className="border-b border-line text-[13px] text-ink-muted">
              <tr>
                <th className="py-2 font-medium">Type de colis</th>
                <th className="py-2 text-right font-medium">Quantité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {manifeste.map((m) => (
                <tr key={m.type}>
                  <td className="py-2">{m.libelle}</td>
                  <td className="chiffres py-2 text-right">{m.quantite}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-ink">
              <tr>
                <td className="py-2 font-semibold">Total</td>
                <td className="chiffres py-2 text-right font-semibold">{totalQuantite}</td>
              </tr>
            </tfoot>
          </table>
        </Bloc>
      )}

      {onglet === "suivi" && <SuiviConteneur conteneur={c} onAjoute={() => router.refresh()} />}

      {peutAgir && (
        <ContainerDialog
          isOpen={modifier}
          onClose={() => setModifier(false)}
          container={c}
          loading={enregistrement}
          onSave={async (donnees) => {
            const r = await updateContainer(c.id, donnees);
            if (r?.success) {
              setModifier(false);
              router.refresh();
            }
          }}
        />
      )}
    </div>
  );
}

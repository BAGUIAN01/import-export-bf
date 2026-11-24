"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, IdCard, Star } from "lucide-react";
import { Bloc, EnTete, Etat, Infos, Onglets, StatCard, StatGrid, Tableau } from "@/components/epure";
import ClientDetail from "@/components/modules/admin/clients/client-details";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";

const PAIEMENT = { PAID: ["Soldé", "vert"], PARTIAL: ["Acompte", "ambre"], PENDING: ["À payer", "ambre"], CANCELLED: ["Annulé", "gris"], REFUNDED: ["Remboursé", "gris"] };

/**
 * Fiche d'un client, épurée : chiffres, coordonnées, destinataire, envois.
 * La fiche complète existante (modifier, bordereau, activité) est dans
 * l'onglet « Fiche complète ».
 */
export function FicheClient({ client, stats, containers, activity, userRole, userId }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState("resume");
  const envois = client.shipments || [];
  const total = envois.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const paye = envois.reduce((s, e) => s + (e.paidAmount || 0), 0);

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete
        chemin={
          <>
            <Link href="/admin/clients" className="hover:text-ink">
              Gestion / Clients
            </Link>{" "}
            / {nomAffiche(client)}
          </>
        }
        titre={nomAffiche(client)}
        sousTitre={<span className="chiffres">{client.clientCode}</span>}
      >
        {client.isVip && <Star className="size-5 fill-[#F5B014] text-[#F5B014]" aria-label="Client VIP" />}
        {!client.isActive && <Etat ton="rouge">Inactif</Etat>}
      </EnTete>

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        libelle="Fiche du client"
        options={[
          { id: "resume", label: "Résumé", icon: ClipboardList },
          { id: "complete", label: "Fiche complète", icon: IdCard },
        ]}
      />

      {onglet === "resume" ? (
        <>
          <StatGrid>
            <StatCard variant="noire" label="Envois" value={envois.length} detail={`${envois.reduce((s, e) => s + (e.packagesCount || 0), 0)} colis`} />
            <StatCard couleur="bleu" label="Montant total" value={formatMontant(total)} />
            <StatCard couleur="vert" label="Payé" value={formatMontant(paye)} />
            <StatCard couleur="ambre" label="Reste à payer" value={formatMontant(Math.max(0, total - paye))} />
          </StatGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Bloc titre="Expéditeur">
              <Infos
                lignes={[
                  ["Téléphone", <span key="t" className="chiffres">{affichageTelephone(client.phone)}</span>],
                  ["E-mail", client.email],
                  ["Adresse", [client.address, client.postalCode, client.city].filter(Boolean).join(", ")],
                  ["Pays", client.country],
                ]}
              />
            </Bloc>
            <Bloc titre="Destinataire habituel">
              {client.recipientName || client.recipientPhone ? (
                <Infos
                  lignes={[
                    ["Nom", client.recipientName],
                    ["Téléphone", client.recipientPhone ? <span key="t" className="chiffres">{affichageTelephone(client.recipientPhone)}</span> : null],
                    ["Ville", client.recipientCity],
                    ["Adresse", client.recipientAddress],
                    ["Lien", client.recipientRelation],
                  ]}
                />
              ) : (
                <p className="text-ink-muted">Pas de destinataire enregistré.</p>
              )}
            </Bloc>
          </div>

          <Tableau
            libelle="Envois du client"
            lignes={envois}
            vide="Aucun envoi pour ce client."
            onLigne={(e) => router.push(`/admin/shipments/${e.id}`)}
            colonnes={[
              { id: "suivi", titre: "N° de suivi", mobile: "titre", rendu: (e) => <span className="chiffres">{e.shipmentNumber}</span> },
              { id: "date", titre: "Date", rendu: (e) => new Date(e.createdAt).toLocaleDateString("fr-FR") },
              { id: "colis", titre: "Colis", rendu: (e) => <span className="chiffres">{e.packagesCount}</span> },
              { id: "montant", titre: "Montant", aDroite: true, rendu: (e) => <span className="chiffres">{formatMontant(e.totalAmount)}</span> },
              { id: "etat", titre: "État", rendu: (e) => <Etat ton={(PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING)[1]}>{(PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING)[0]}</Etat> },
            ]}
          />
        </>
      ) : (
        <div className="font-sans">
          <ClientDetail initialClient={client} initialStats={stats} initialContainers={containers} initialActivity={activity} userRole={userRole} userId={userId} />
        </div>
      )}
    </div>
  );
}

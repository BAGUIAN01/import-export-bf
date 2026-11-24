"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackagePlus, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Bloc, EnTete, Etat, Infos, PRINCIPAL, SECONDAIRE, StatCard, StatGrid, Tableau } from "@/components/epure";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { NouveauClient } from "@/components/caisse/client/nouveau-client";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";

const PAIEMENT = {
  PAID: ["Soldé", "vert"],
  PARTIAL: ["Acompte", "ambre"],
  PENDING: ["À payer", "ambre"],
  CANCELLED: ["Annulé", "gris"],
  REFUNDED: ["Remboursé", "gris"],
};

/**
 * Fiche d'un client, épurée : chiffres, coordonnées, destinataire, envois ;
 * Modifier, Nouvelle expédition, Supprimer (administrateur).
 */
export function FicheClient({ client, containers, userRole }) {
  const router = useRouter();
  const [modifier, setModifier] = useState(false);
  const [expedition, setExpedition] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const peutModifier = ["ADMIN", "STAFF", "CHEF_CAISSE", "TRACKER"].includes(userRole);
  const peutSupprimer = userRole === "ADMIN";

  async function creerExpedition(form) {
    setEnvoi(true);
    try {
      const res = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "L'expédition n'a pas pu être créée.");
      toast.success("Expédition créée.");
      setExpedition(false);
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer ${nomAffiche(client)} ? S'il a des envois, il sera seulement désactivé.`)) return;
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Le client n'a pas pu être supprimé.");
    toast.success(data.message || "Client supprimé.");
    router.push("/admin/clients");
  }
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
        actions={
          peutModifier && (
            <>
              <button type="button" onClick={() => setModifier(true)} className={SECONDAIRE}>
                <Pencil className="size-4" aria-hidden="true" />
                Modifier
              </button>
              <button type="button" onClick={() => setExpedition(true)} className={PRINCIPAL}>
                <PackagePlus className="size-5" aria-hidden="true" />
                Nouvelle expédition
              </button>
            </>
          )
        }
      >
        {client.isVip && <Star className="size-5 fill-[#F5B014] text-[#F5B014]" aria-label="Client VIP" />}
        {!client.isActive && <Etat ton="rouge">Inactif</Etat>}
      </EnTete>

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
              [
                "Téléphone",
                <span key="t" className="chiffres">
                  {affichageTelephone(client.phone)}
                </span>,
              ],
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
                [
                  "Téléphone",
                  client.recipientPhone ? (
                    <span key="t" className="chiffres">
                      {affichageTelephone(client.recipientPhone)}
                    </span>
                  ) : null,
                ],
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
          {
            id: "etat",
            titre: "État",
            rendu: (e) => <Etat ton={(PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING)[1]}>{(PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING)[0]}</Etat>,
          },
        ]}
      />

      {peutSupprimer && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={supprimer}
            className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Supprimer le client
          </button>
        </div>
      )}

      {modifier && (
        <NouveauClient
          client={client}
          onFermer={() => setModifier(false)}
          onCree={() => {
            setModifier(false);
            toast.success("Client enregistré.");
            router.refresh();
          }}
        />
      )}
      <PackageDialog
        isOpen={expedition}
        onClose={() => setExpedition(false)}
        clients={[client]}
        containers={containers}
        onSave={creerExpedition}
        loading={envoi}
      />
    </div>
  );
}

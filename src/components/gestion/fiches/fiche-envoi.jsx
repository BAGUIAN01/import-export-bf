"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, PackageCheck, Pencil, Printer, Wallet } from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import { pdf } from "@react-pdf/renderer";
import { Bloc, EnTete, Etat, Infos, Onglets, SECONDAIRE, StatCard, StatGrid, Tableau } from "@/components/epure";
import ShipmentDetail from "@/components/modules/admin/shipments/shipment-detail";
import { ShipmentEditDialog } from "@/components/modules/admin/shipments/shipment-edit-dialog";
import { ShipmentRemitDialog } from "@/components/modules/admin/shipments/shipment-remit-dialog";
import { ReceiptPDF } from "@/components/modules/admin/shipments/receipt-pdf";
import { useShipmentMutations } from "@/hooks/use-shipments";
import { ETATS_COLIS } from "@/components/gestion/colis/liste-colis";
import { STATUTS_CONTENEUR } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";

const PAIEMENT = { PAID: ["Soldé", "vert"], PARTIAL: ["Acompte", "ambre"], PENDING: ["À payer", "ambre"], CANCELLED: ["Annulé", "gris"], REFUNDED: ["Remboursé", "gris"] };
const MODES = { CASH: "Espèces", CARD: "Carte", MOBILE_MONEY: "Mobile money", TRANSFER: "Virement", CHEQUE: "Chèque" };
const jour = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);

async function versDataUrl(chemin) {
  const blob = await (await fetch(chemin)).blob();
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onloadend = () => ok(r.result);
    r.onerror = ko;
    r.readAsDataURL(blob);
  });
}

/**
 * Fiche d'un envoi, épurée : chiffres, expéditeur, destinataire, colis ;
 * Encaisser, Remettre, Reçu. L'écran complet (modifier les colis) reste
 * dans l'onglet « Modifier ».
 */
export function FicheEnvoi({ shipment: initial, containers, clients }) {
  const router = useRouter();
  const [e, setE] = useState(initial);
  const [onglet, setOnglet] = useState("resume");
  const [encaisser, setEncaisser] = useState(false);
  const [remettre, setRemettre] = useState(false);
  const [impression, setImpression] = useState(false);
  const { updateShipment, isLoading } = useShipmentMutations();

  const reste = Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0));
  const etat = e.deliveredAt ? ["Remis", "vert"] : PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING;
  const nbColis = (e.packages || []).reduce((s, p) => s + (p.totalQuantity || 1), 0);

  async function enregistrer(donnees, fermer) {
    const r = await updateShipment(e.id, donnees);
    if (r?.success) {
      setE((x) => ({ ...x, ...donnees, ...(r.data?.shipment || {}) }));
      fermer();
      router.refresh();
    }
  }

  async function imprimer() {
    setImpression(true);
    try {
      const lien = `${window.location.origin}/tracking?q=${encodeURIComponent(e.shipmentNumber)}`;
      const [qr, logo] = await Promise.all([QRCodeLib.toDataURL(lien, { margin: 1, width: 200 }).catch(() => null), versDataUrl("/logo.jpeg").catch(() => null)]);
      const blob = await pdf(<ReceiptPDF shipment={e} logoDataUrl={logo} qrCodeDataUrl={qr} dateEdition={new Date().toLocaleDateString("fr-FR")} />).toBlob();
      const url = URL.createObjectURL(blob);
      const f = window.open(url, "_blank");
      if (f) f.addEventListener("load", () => f.print());
      else toast.error("Le navigateur a bloqué la fenêtre d'impression.");
    } catch {
      toast.error("Le reçu n'a pas pu être préparé.");
    } finally {
      setImpression(false);
    }
  }

  return (
    <div className="caisse mx-auto flex max-w-[1200px] flex-col gap-5 text-[15px] text-ink">
      <EnTete
        chemin={
          <>
            <Link href="/admin/shipments" className="hover:text-ink">
              Gestion / Encaissements
            </Link>{" "}
            / {e.shipmentNumber}
          </>
        }
        titre={nomAffiche(e.client)}
        sousTitre={<span className="chiffres">{e.shipmentNumber}</span>}
        actions={
          <>
            <button type="button" onClick={imprimer} disabled={impression} className={SECONDAIRE}>
              {impression ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Printer className="size-4" aria-hidden="true" />}
              Reçu
            </button>
            {!e.deliveredAt && (
              <button type="button" onClick={() => setRemettre(true)} className={SECONDAIRE}>
                <PackageCheck className="size-4" aria-hidden="true" />
                Remettre
              </button>
            )}
            {reste > 0 && (
              <button type="button" onClick={() => setEncaisser(true)} className="flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white">
                <Wallet className="size-4" aria-hidden="true" />
                Encaisser
              </button>
            )}
          </>
        }
      >
        <Etat ton={etat[1]} className="text-sm">
          {etat[0]}
        </Etat>
      </EnTete>

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        libelle="Fiche de l'envoi"
        options={[
          { id: "resume", label: "Résumé", icon: ClipboardList },
          { id: "modifier", label: "Modifier", icon: Pencil },
        ]}
      />

      {onglet === "resume" ? (
        <>
          <StatGrid>
            <StatCard variant="noire" label="Montant" value={formatMontant(e.totalAmount)} detail={e.discountTotal > 0 ? `remise ${formatMontant(e.discountTotal)}` : null} />
            <StatCard couleur="vert" label="Payé" value={formatMontant(e.paidAmount)} detail={e.paymentMethod ? MODES[e.paymentMethod] || e.paymentMethod : null} />
            <StatCard couleur="ambre" label="Reste" value={formatMontant(reste)} />
            <StatCard couleur="bleu" label="Colis" value={nbColis} detail={`${(e.packages || []).length} ligne(s)`} />
          </StatGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Bloc titre="Expéditeur">
              <Infos
                lignes={[
                  ["Nom", nomAffiche(e.client)],
                  ["Téléphone", <span key="t" className="chiffres">{affichageTelephone(e.client?.phone)}</span>],
                  ["Ville", [e.client?.city, e.client?.country].filter(Boolean).join(", ")],
                  ["Code", e.client?.clientCode],
                ]}
              />
            </Bloc>
            <Bloc titre="Destinataire">
              <Infos
                lignes={[
                  ["Nom", e.client?.recipientName || "—"],
                  ["Téléphone", e.client?.recipientPhone ? <span key="t" className="chiffres">{affichageTelephone(e.client.recipientPhone)}</span> : null],
                  ["Ville", e.client?.recipientCity],
                  ["Remis le", e.deliveredAt ? jour(e.deliveredAt) : null],
                  ["À", e.receivedBy],
                  ["Pièce", e.receivedIdNumber],
                ]}
              />
            </Bloc>
            <Bloc titre="Conteneur">
              {e.container ? (
                <Infos
                  lignes={[
                    ["N°", <Link key="c" href={`/admin/containers/${e.container.id}`} className="chiffres text-brand underline-offset-2 hover:underline">{e.container.containerNumber}</Link>],
                    ["État", STATUTS_CONTENEUR[e.container.status]?.libelle],
                    ["Départ", jour(e.container.departureDate)],
                  ]}
                />
              ) : (
                <p className="text-ink-muted">Pas encore dans un conteneur.</p>
              )}
            </Bloc>
          </div>

          <Tableau
            libelle="Colis de l'envoi"
            lignes={e.packages || []}
            vide="Aucun colis."
            colonnes={[
              { id: "description", titre: "Colis", mobile: "titre", rendu: (p) => p.description },
              { id: "numero", titre: "N°", rendu: (p) => <span className="chiffres">{p.packageNumber}</span> },
              { id: "qte", titre: "Qté", rendu: (p) => <span className="chiffres">{p.totalQuantity}</span> },
              { id: "etat", titre: "État", rendu: (p) => <Etat ton={(ETATS_COLIS[p.status] || ETATS_COLIS.REGISTERED)[1]}>{(ETATS_COLIS[p.status] || ETATS_COLIS.REGISTERED)[0]}</Etat> },
              { id: "montant", titre: "Montant", aDroite: true, rendu: (p) => <span className="chiffres">{formatMontant(p.totalAmount)}</span> },
            ]}
          />
        </>
      ) : (
        <div className="font-sans">
          <ShipmentDetail initialShipment={initial} initialContainers={containers} initialClients={clients} />
        </div>
      )}

      <ShipmentEditDialog shipment={encaisser ? e : null} isOpen={encaisser} loading={isLoading} onClose={() => setEncaisser(false)} onSave={(d) => enregistrer(d, () => setEncaisser(false))} />
      <ShipmentRemitDialog shipment={remettre ? e : null} isOpen={remettre} loading={isLoading} onClose={() => setRemettre(false)} onSubmit={(d) => enregistrer(d, () => setRemettre(false))} />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, MoreHorizontal, PackageCheck, Pencil, Plus, Printer, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Bloc, EnTete, Etat, Infos, SECONDAIRE, StatCard, StatGrid, Tableau } from "@/components/epure";
import PackageDialog from "@/components/modules/admin/packages/package-dialog";
import { FeuilleEncaissement } from "@/components/gestion/fiches/feuille-encaissement";
import { BarreActions, FeuilleActions } from "@/components/gestion/barre-actions";
import { ouvrirCaisse } from "@/lib/caisse/ouvrir";
import { DEPOT_RETRAITS } from "@/lib/recherche";
import { canAccess } from "@/lib/rbac";
import { ShipmentRemitDialog } from "@/components/modules/admin/shipments/shipment-remit-dialog";
import { useShipmentDetails, useShipmentMutations } from "@/hooks/use-shipments";
import { ETATS_COLIS } from "@/components/gestion/colis/liste-colis";
import { STATUTS_CONTENEUR } from "@/lib/conteneurs";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { affichageTelephone } from "@/lib/telephone";

const PAIEMENT = { PAID: ["Soldé", "vert"], PARTIAL: ["Acompte", "ambre"], PENDING: ["À payer", "ambre"], CANCELLED: ["Annulé", "gris"], REFUNDED: ["Remboursé", "gris"] };
const MODES = { CASH: "Espèces", CARD: "Carte", MOBILE_MONEY: "Mobile money", TRANSFER: "Virement", CHEQUE: "Chèque" };
const jour = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);
const PETIT = "grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-surface-muted";

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
 * Fiche d'un envoi, épurée : chiffres, expéditeur, destinataire, conteneur,
 * colis (ajouter, modifier, supprimer) ; Reçu, Remettre, Encaisser.
 */
export function FicheEnvoi({ shipment: initial, containers, clients }) {
  const router = useRouter();
  const { data: session } = useSession();
  const caisse = canAccess(session?.user?.role, "/admin/caisse");
  const { shipment: frais, packages: colisFrais, refresh } = useShipmentDetails(initial.id);
  const { updateShipment, deleteShipment, isLoading } = useShipmentMutations();
  const e = { ...initial, ...(frais || {}), packages: frais ? colisFrais : initial.packages };

  const [encaisser, setEncaisser] = useState(false);
  const [remettre, setRemettre] = useState(false);
  const [impression, setImpression] = useState(false);
  const [colisOuvert, setColisOuvert] = useState(null); // null, "nouveau" ou le colis
  const [envoiColis, setEnvoiColis] = useState(false);
  const [menuColis, setMenuColis] = useState(null); // téléphone : actions d'un colis

  const reste = Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0));
  const etat = e.deliveredAt ? ["Remis", "vert"] : PAIEMENT[e.paymentStatus] || PAIEMENT.PENDING;
  const nbColis = (e.packages || []).reduce((s, p) => s + (p.totalQuantity || 1), 0);

  async function enregistrer(donnees, fermer) {
    const r = await updateShipment(e.id, donnees);
    if (r?.success) {
      fermer();
      refresh();
    }
  }

  async function enregistrerColis(payload) {
    setEnvoiColis(true);
    try {
      const nouveau = colisOuvert === "nouveau";
      const corps = nouveau
        ? (payload.packages || []).map((p) => ({
            ...p,
            clientId: e.client.id,
            containerId: payload.containerId || e.containerId || null,
            deliveryAddress: payload.sharedData?.deliveryAddress || e.deliveryAddress || null,
            specialInstructions: payload.sharedData?.specialInstructions || e.specialInstructions || null,
            shipmentId: e.id,
          }))
        : payload;
      const res = await fetch(nouveau ? "/api/packages" : `/api/packages/${colisOuvert.id}`, {
        method: nouveau ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Le colis n'a pas pu être enregistré.");
      toast.success(nouveau ? "Colis ajoutés à l'envoi." : "Colis modifié.");
      setColisOuvert(null);
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnvoiColis(false);
    }
  }

  // `confirme` : déjà confirmé dans la feuille d'actions (téléphone)
  async function supprimerColis(p, confirme = false) {
    if (!confirme && !window.confirm(`Supprimer le colis « ${p.description} » (${p.packageNumber}) ?`)) return;
    const res = await fetch(`/api/packages/${p.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "Le colis n'a pas pu être supprimé.");
    toast.success("Colis supprimé.");
    refresh();
  }

  async function supprimerEnvoi(confirme = false) {
    if (!confirme && !window.confirm(`Supprimer l'envoi ${e.shipmentNumber} et ses colis ? Cette action est définitive.`)) return;
    const r = await deleteShipment(e.id);
    if (r?.success !== false) router.push("/admin/shipments");
  }

  // Remettre : par le module Retraits (vérification des colis, paiement du reste)
  // quand le conteneur est arrivé ; sinon l'ancienne fenêtre
  const arrive = ["DELIVERED", "CUSTOMS"].includes(e.container?.status);
  function remettreEnvoi() {
    if (!(arrive && canAccess(session?.user?.role, "/admin/retraits"))) return setRemettre(true);
    try {
      window.sessionStorage.setItem(DEPOT_RETRAITS, JSON.stringify({ envoiId: e.id, conteneurId: e.container.id, nom: e.client?.recipientName || "" }));
    } catch {
      /* stockage indisponible */
    }
    window.dispatchEvent(new CustomEvent("recherche:depot", { detail: DEPOT_RETRAITS }));
    router.push("/admin/retraits/colis");
  }

  // Ajouter des colis : à la caisse (même client, même conteneur = même envoi)
  const ajouterColis = () => (caisse ? ouvrirCaisse(router, e.client) : setColisOuvert("nouveau"));

  async function imprimer() {
    setImpression(true);
    try {
      const lien = `${window.location.origin}/tracking?q=${encodeURIComponent(e.shipmentNumber)}`;
      // Générateur de PDF et QR code chargés au moment d'imprimer (fiche plus légère)
      const [{ pdf }, { ReceiptPDF }, { default: QRCodeLib }, logo] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/modules/admin/shipments/receipt-pdf"),
        import("qrcode"),
        versDataUrl("/logo.jpeg").catch(() => null),
      ]);
      const qr = await QRCodeLib.toDataURL(lien, { margin: 2, width: 512, errorCorrectionLevel: "M" }).catch(() => null);
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
          <span className="hidden flex-wrap gap-2 md:flex">
            <button type="button" onClick={imprimer} disabled={impression} className={SECONDAIRE}>
              {impression ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Printer className="size-4" aria-hidden="true" />}
              Reçu
            </button>
            {!e.deliveredAt && (
              <button type="button" onClick={remettreEnvoi} className={SECONDAIRE}>
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
          </span>
        }
      >
        <Etat ton={etat[1]} className="text-sm">
          {etat[0]}
        </Etat>
      </EnTete>

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
              ["Nom", <Link key="n" href={`/admin/clients/${e.client?.id}`} className="text-brand underline-offset-2 hover:underline">{nomAffiche(e.client)}</Link>],
              ["Téléphone", <span key="t" className="chiffres">{affichageTelephone(e.client?.phone)}</span>],
              ["Ville", [e.client?.city, e.client?.country].filter(Boolean).join(", ")],
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

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Colis</h2>
        <button type="button" onClick={ajouterColis} className={SECONDAIRE}>
          <Plus className="size-4" aria-hidden="true" />
          Ajouter des colis
        </button>
      </div>
      <Tableau
        libelle="Colis de l'envoi"
        lignes={e.packages || []}
        vide="Aucun colis."
        colonnes={[
          { id: "description", titre: "Colis", mobile: "titre", rendu: (p) => p.description },
          { id: "numero", titre: "N°", rendu: (p) => <span className="chiffres">{p.packageNumber}</span> },
          { id: "qte", titre: "Qté", rendu: (p) => <span className="chiffres">{p.totalQuantity}</span>, mobileRendu: (p) => <span className="chiffres">× {p.totalQuantity}</span> },
          { id: "etat", titre: "État", mobile: "etat", rendu: (p) => <Etat ton={(ETATS_COLIS[p.status] || ETATS_COLIS.REGISTERED)[1]}>{(ETATS_COLIS[p.status] || ETATS_COLIS.REGISTERED)[0]}</Etat> },
          { id: "montant", titre: "Montant", aDroite: true, mobile: "droite", rendu: (p) => <span className="chiffres">{formatMontant(p.totalAmount)}</span> },
        ]}
        actions={(p) => (
          <span className="flex justify-end gap-1">
            <button type="button" onClick={() => setColisOuvert(p)} aria-label={`Modifier ${p.description}`} className={`${PETIT} hidden md:grid`}>
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => supprimerColis(p)} aria-label={`Supprimer ${p.description}`} className={`${PETIT} hidden hover:text-danger md:grid`}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
            {/* Téléphone : un seul bouton « … », grande cible, suppression confirmée */}
            <button type="button" onClick={() => setMenuColis(p)} aria-label={`Actions : ${p.description}`} className="grid size-11 place-items-center rounded-xl border border-line text-ink-muted md:hidden">
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </button>
          </span>
        )}
      />

      <div className="hidden justify-end md:flex">
        <button type="button" onClick={() => supprimerEnvoi()} className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft">
          <Trash2 className="size-4" aria-hidden="true" />
          Supprimer l&apos;envoi
        </button>
      </div>

      {/* Téléphone : action principale en bas, le reste dans « … » */}
      <BarreActions
        titreMenu={e.shipmentNumber}
        principale={
          reste > 0
            ? { libelle: `Encaisser · ${formatMontant(reste)}`, icone: Wallet, onClick: () => setEncaisser(true) }
            : !e.deliveredAt
              ? { libelle: "Remettre", icone: PackageCheck, onClick: remettreEnvoi }
              : { libelle: "Reçu", icone: Printer, onClick: imprimer, chargement: impression }
        }
        autres={[
          (reste > 0 || !e.deliveredAt) && { libelle: "Imprimer le reçu", icone: Printer, onClick: imprimer },
          reste > 0 && !e.deliveredAt && { libelle: "Remettre", icone: PackageCheck, onClick: remettreEnvoi },
          { libelle: "Ajouter des colis", icone: Plus, onClick: ajouterColis },
          {
            libelle: "Supprimer l'envoi",
            icone: Trash2,
            danger: true,
            onClick: () => supprimerEnvoi(true),
            confirmation: { titre: `Supprimer ${e.shipmentNumber} ?`, texte: "L'envoi et ses colis seront supprimés. Cette action est définitive.", bouton: "Supprimer l'envoi" },
          },
        ]}
      />
      <FeuilleActions
        ouvert={!!menuColis}
        onFermer={() => setMenuColis(null)}
        titre={menuColis?.description}
        sousTitre={menuColis ? <span className="chiffres">{menuColis.packageNumber}</span> : null}
        actions={
          menuColis
            ? [
                { libelle: "Modifier le colis", icone: Pencil, onClick: () => setColisOuvert(menuColis) },
                {
                  libelle: "Supprimer le colis",
                  icone: Trash2,
                  danger: true,
                  onClick: () => supprimerColis(menuColis, true),
                  confirmation: { titre: "Supprimer ce colis ?", texte: `${menuColis.description} (${menuColis.packageNumber})`, bouton: "Supprimer le colis" },
                },
              ]
            : []
        }
      />
      {encaisser && <FeuilleEncaissement envoi={e} onFermer={() => setEncaisser(false)} onEncaisser={(d) => enregistrer(d, () => setEncaisser(false))} />}
      <ShipmentRemitDialog shipment={remettre ? e : null} isOpen={remettre} loading={isLoading} onClose={() => setRemettre(false)} onSubmit={(d) => enregistrer(d, () => setRemettre(false))} />
      <PackageDialog
        isOpen={!!colisOuvert}
        onClose={() => setColisOuvert(null)}
        package={colisOuvert && colisOuvert !== "nouveau" ? colisOuvert : null}
        prefilledClient={colisOuvert === "nouveau" ? e.client : null}
        prefilledContainer={colisOuvert === "nouveau" ? e.container : null}
        prefilledSharedData={null}
        clients={clients}
        containers={containers}
        onSave={enregistrerColis}
        loading={envoiColis}
      />
    </div>
  );
}

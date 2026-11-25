"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MessageCircle, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { sansAccents } from "@/lib/caisse/familles";
import { Etat, Tableau } from "@/components/epure";
import { lienSuivi, lienWhatsApp, messageSuivi } from "@/lib/caisse/partage";
import { selectionEnvois } from "@/components/gestion/actions-groupees";

const MODES = { CASH: "Espèces", CARD: "Carte", MOBILE_MONEY: "Mobile money", TRANSFER: "Virement", CHEQUE: "Chèque" };

async function versDataUrl(chemin) {
  const blob = await (await fetch(chemin)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const aujourdhui = (d) => d && new Date(d).toDateString() === new Date().toDateString();
const heure = (e) => new Date(e.updatedAt || e.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const resteDe = (e) => Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0));
// Message de suivi envoyé à l'expéditeur (glisser « WhatsApp »)
const messageDe = (e) =>
  messageSuivi({
    prenom: e.client?.firstName,
    numero: e.shipmentNumber,
    nbColis: e.packagesCount,
    total: e.totalAmount,
    reste: resteDe(e),
    lien: lienSuivi(window.location.origin, e.shipmentNumber),
  });

/**
 * Caisse · Reçus du jour
 * Les envois enregistrés ou complétés aujourd'hui, à réimprimer au besoin.
 */
export default function RecusPage() {
  const { data: session } = useSession();
  const [recharge, setRecharge] = useState(0); // après une action groupée
  const [envois, setEnvois] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [impression, setImpression] = useState(null);

  useEffect(() => {
    fetch("/api/shipments?limit=200")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Les reçus n'ont pas pu être chargés."))))
      .then((d) => setEnvois((d.data || []).filter((e) => aujourdhui(e.createdAt) || aujourdhui(e.updatedAt))))
      .catch((e) => {
        toast.error(e.message);
        setEnvois([]);
      });
  }, [recharge]);

  const q = sansAccents(recherche).trim();
  const liste = useMemo(
    () => (envois || []).filter((e) => !q || sansAccents(`${e.shipmentNumber} ${e.client?.firstName} ${e.client?.lastName} ${e.client?.phone}`).includes(q)),
    [envois, q]
  );
  const total = (envois || []).reduce((s, e) => s + (e.paidAmount || 0), 0);

  async function reimprimer(e) {
    setImpression(e.id);
    try {
      const res = await fetch(`/api/shipments/${e.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "L'envoi n'a pas pu être chargé.");
      const envoi = data.shipment || data;
      const lien = `${window.location.origin}/tracking?q=${encodeURIComponent(envoi.shipmentNumber)}`;
      // Générateur de PDF et QR code chargés au moment d'imprimer
      const [{ pdf }, { ReceiptPDF }, { default: QRCodeLib }, logoDataUrl] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/modules/admin/shipments/receipt-pdf"),
        import("qrcode"),
        versDataUrl("/logo.jpeg").catch(() => null),
      ]);
      const qrCodeDataUrl = await QRCodeLib.toDataURL(lien, { margin: 2, width: 512, errorCorrectionLevel: "M" }).catch(() => null);
      const blob = await pdf(<ReceiptPDF shipment={envoi} logoDataUrl={logoDataUrl} qrCodeDataUrl={qrCodeDataUrl} dateEdition={new Date().toLocaleDateString("fr-FR")} />).toBlob();
      const url = URL.createObjectURL(blob);
      const fenetre = window.open(url, "_blank");
      if (fenetre) fenetre.addEventListener("load", () => fenetre.print());
      else toast.error("Le navigateur a bloqué la fenêtre d'impression.");
    } catch (err) {
      toast.error(err.message || "Le reçu n'a pas pu être préparé.");
    } finally {
      setImpression(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain p-4 sm:p-6">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hidden text-[13px] text-ink-muted sm:block">Caisse / Reçus du jour</p>
            <h1 className="text-2xl font-semibold tracking-tight">Reçus du jour</h1>
            <p className="text-ink-muted">
              {envois ? `${envois.length} envoi${envois.length > 1 ? "s" : ""} · ` : ""}
              <span className="chiffres">{envois ? formatMontant(total) : "…"}</span> encaissés
            </p>
          </div>
        </div>

        <label className="relative flex h-12 items-center rounded-2xl border border-line-strong bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <span className="sr-only">Rechercher un reçu</span>
          <Search className="ml-4 size-5 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Client, téléphone, n° de suivi"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {recherche && (
            <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="mr-1 grid size-10 place-items-center rounded-xl text-ink-muted">
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </label>

        <Tableau
          selection={session?.user?.role === "ADMIN" ? selectionEnvois(() => setRecharge((n) => n + 1)) : undefined}
          libelle="Reçus du jour"
          chargement={envois === null}
          lignes={liste}
          vide="Aucun reçu aujourd'hui."
          onLigne={(e) => !impression && reimprimer(e)}
          glisser={(e) => [
            e.client?.phone && {
              libelle: "WhatsApp",
              icone: MessageCircle,
              ton: "vert",
              onClick: () => window.open(lienWhatsApp(e.client.phone, messageDe(e), "FR"), "_blank", "noopener"),
            },
            { libelle: "Réimprimer", court: "Reçu", icone: Printer, ton: "gris", onClick: () => reimprimer(e) },
          ]}
          colonnes={[
            { id: "client", titre: "Client", mobile: "titre", rendu: (e) => nomAffiche(e.client) },
            { id: "heure", titre: "Heure", rendu: (e) => <span className="chiffres">{heure(e)}</span> },
            {
              id: "envoi",
              titre: "Envoi",
              rendu: (e) => (
                <span className="chiffres">
                  {e.shipmentNumber} · {e.packagesCount} colis
                </span>
              ),
              mobileRendu: (e) => <span className="chiffres">{e.shipmentNumber}</span>,
            },
            { id: "mode", titre: "Mode", rendu: (e) => MODES[e.paymentMethod] || "—", mobileRendu: (e) => MODES[e.paymentMethod] || null },
            { id: "paye", titre: "Encaissé", aDroite: true, mobile: "droite", rendu: (e) => <span className="chiffres">{formatMontant(e.paidAmount)}</span> },
            {
              id: "etat",
              titre: "État",
              mobile: "etat",
              rendu: (e) => (resteDe(e) > 0 ? <Etat ton="ambre">reste {formatMontant(resteDe(e))}</Etat> : <Etat ton="vert">Soldé</Etat>),
            },
          ]}
          actions={(e) => (
            <button
              type="button"
              onClick={() => reimprimer(e)}
              disabled={!!impression}
              className="flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-white px-4 font-semibold disabled:opacity-60"
            >
              {impression === e.id ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Printer className="size-5" aria-hidden="true" />}
              Réimprimer
            </button>
          )}
        />
      </div>
    </div>
  );
}

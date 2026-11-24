"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import { pdf } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/components/modules/admin/shipments/receipt-pdf";
import { formatMontant } from "@/lib/caisse/montants";
import { nomAffiche } from "@/lib/caisse/clients";
import { sansAccents } from "@/lib/caisse/familles";
import { cn } from "@/lib/utils";

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

/**
 * Caisse · Reçus du jour
 * Les envois enregistrés ou complétés aujourd'hui, à réimprimer au besoin.
 */
export default function RecusPage() {
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
  }, []);

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
      const [qrCodeDataUrl, logoDataUrl] = await Promise.all([QRCodeLib.toDataURL(lien, { margin: 1, width: 200 }).catch(() => null), versDataUrl("/logo.jpeg").catch(() => null)]);
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

        {envois === null ? (
          <ul className="flex flex-col gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[76px] animate-pulse rounded-2xl bg-white" />
            ))}
          </ul>
        ) : liste.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-ink-muted">Aucun reçu aujourd&apos;hui.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {liste.map((e) => {
              const reste = Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0));
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3">
                  <span className="chiffres w-14 shrink-0 text-sm text-ink-muted">
                    {new Date(e.updatedAt || e.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{nomAffiche(e.client)}</div>
                    <div className="chiffres truncate text-[13px] text-ink-muted">
                      {e.shipmentNumber} · {e.packagesCount} colis
                      {e.paymentMethod ? <span className="font-caisse"> · {MODES[e.paymentMethod] || e.paymentMethod}</span> : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="chiffres font-semibold">{formatMontant(e.paidAmount)}</div>
                    <div className={cn("chiffres text-xs", reste > 0 ? "text-alerte" : "text-brand-strong")}>{reste > 0 ? `reste ${formatMontant(reste)}` : "soldé"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => reimprimer(e)}
                    disabled={!!impression}
                    className="flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-white px-4 font-semibold disabled:opacity-60"
                  >
                    {impression === e.id ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Printer className="size-5" aria-hidden="true" />}
                    Réimprimer
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCaisse } from "@/contexts/caisse-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Download, Printer, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/* ── Utils ─────────────────────────────────────────────────────── */
const formatPhone = (tel) => {
  if (!tel) return "";
  if (tel.startsWith("+")) {
    return tel.replace(/[^+\d]/g, "").replace(
      /^(\+\d{1,3})(\d{1,3})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?$/,
      (_m, a, b, c, d, e, f) => [a, b, c, d, e, f].filter(Boolean).join(" ")
    );
  }
  return tel.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

function formatPrice(amount) {
  return Math.round(amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function ImpressionPage() {
  const router = useRouter();
  const { selectedClient, orderItems, orderTotal, orderSubtotal, orderOptions, paymentInfo, clearSession } = useCaisse();

  const printRef = useRef(null);
  const [lastContainer, setLastContainer] = useState(null);
  const [shipmentInfo, setShipmentInfo]   = useState(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [bordereauNum, setBordereauNum]   = useState("");
  const [orderCreated, setOrderCreated] = useState(false);
  const dateEdition = new Date().toLocaleDateString("fr-FR");

  /* ── Numéro bordereau auto ── */
  useEffect(() => {
    const now = new Date();
    const r = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    setBordereauNum(`BRD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${r}`);
  }, []);

  /* ── Créer la commande et l'expédition automatiquement ── */
  useEffect(() => {
    if (!selectedClient || orderItems.length === 0 || orderCreated) return;
    
    const createOrder = async () => {
      setIsCreatingOrder(true);
      try {
        const response = await fetch("/api/caisse/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClient.id,
            orderItems: orderItems.map(item => ({
              type: item.productId || "CARTON", // productId correspond au value dans PACKAGE_TYPES
              productId: item.productId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              weight: item.weight,
              dimensions: item.dimensions,
              value: item.value,
              isFragile: item.isFragile,
              isInsured: item.isInsured,
            })),
            orderTotal,
            orderSubtotal,
            orderOptions,
            paymentInfo,
            containerId: lastContainer?.id,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Erreur lors de la création de la commande");
        }

        const data = await response.json();
        setOrderCreated(true);
        
        // Mettre à jour le conteneur et le shipment
        if (data.container) {
          setLastContainer(data.container);
        }
        
        // Récupérer les détails complets du shipment
        if (data.shipment?.id) {
          const shipmentResponse = await fetch(`/api/shipments/${data.shipment.id}`);
          if (shipmentResponse.ok) {
            const shipmentData = await shipmentResponse.json();
            setShipmentInfo(shipmentData);
          }
        }

        toast.success(
          data.isExistingShipment 
            ? "Colis ajoutés à l'expédition existante" 
            : "Expédition créée avec succès",
          {
            description: `N° ${data.shipment?.shipmentNumber || ""}`,
          }
        );
      } catch (error) {
        console.error("Erreur création commande:", error);
        toast.error(error.message || "Erreur lors de la création de la commande");
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, [selectedClient, orderItems, orderTotal, orderSubtotal, orderOptions, paymentInfo, lastContainer, orderCreated]);

  /* ── Dernier conteneur (bandeau seulement) ── */
  useEffect(() => {
    if (orderCreated) return; // Ne pas récupérer si on vient de créer
    fetch("/api/containers?limit=1&sort=createdAt&order=desc")
      .then((r) => r.json())
      .then((d) => setLastContainer((d.containers || [])[0] ?? null))
      .catch(() => {});
  }, [orderCreated]);

  /* ── Shipment du conteneur (SHP = tracking de tout le conteneur) ── */
  useEffect(() => {
    if (!lastContainer?.id || orderCreated) return;
    fetch(`/api/shipments?containerId=${lastContainer.id}&limit=1`)
      .then((r) => r.json())
      .then((d) => setShipmentInfo(d.data?.[0] ?? null))
      .catch(() => {});
  }, [lastContainer, orderCreated]);

  /* ── Totaux ── */
  const montantPaye  = paymentInfo?.montantRecu ?? 0;
  const resteAPayer  = Math.max(0, orderTotal - montantPaye);

  /* ── Génération PDF (retourne un blob) ── */
  const buildPdfBlob = async () => {
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: printRef.current.scrollWidth,
      height: printRef.current.scrollHeight,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const ih = (canvas.height * pw) / canvas.width;
    let left = ih, pos = 0;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, pw, ih);
    left -= ph;
    while (left > 0) {
      pos = left - ih;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, pw, ih);
      left -= ph;
    }
    return pdf;
  };

  /* ── Actions ── */
  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      setIsGenerating(true);
      toast.loading("Préparation de l'impression…", { id: "print" });
      const pdf = await buildPdfBlob();
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          win.print();
          win.addEventListener("afterprint", () => URL.revokeObjectURL(url));
        });
      }
      toast.success("PDF ouvert pour impression", { id: "print" });
    } catch {
      toast.error("Erreur lors de l'impression", { id: "print" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      setIsGenerating(true);
      toast.loading("Génération du PDF…", { id: "pdf" });
      const pdf = await buildPdfBlob();
      pdf.save(`bordereau-${selectedClient?.clientCode || "client"}-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF téléchargé", { id: "pdf" });
    } catch {
      toast.error("Erreur lors de la génération du PDF", { id: "pdf" });
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Guards ── */
  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center space-y-4 w-full max-w-sm">
          <ShoppingCart className="h-12 w-12 mx-auto text-zinc-300" />
          <p className="font-semibold text-zinc-900">Aucun client sélectionné</p>
          <Button onClick={() => router.push("/admin/caisse/client")} className="bg-orange-500 hover:bg-orange-600 text-white w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />Sélectionner un client
          </Button>
        </div>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center space-y-4 w-full max-w-sm">
          <ShoppingCart className="h-12 w-12 mx-auto text-zinc-300" />
          <p className="font-semibold text-zinc-900">Commande vide</p>
          <Button onClick={() => router.push("/admin/caisse/commande")} className="bg-orange-500 hover:bg-orange-600 text-white w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />Retour à la commande
          </Button>
        </div>
      </div>
    );
  }

  if (isCreatingOrder) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center space-y-4 w-full max-w-sm">
          <div className="h-12 w-12 mx-auto border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-zinc-900">Création de l&apos;expédition...</p>
          <p className="text-sm text-zinc-600">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-screen gap-2 sm:gap-3 p-2 sm:p-4 overflow-hidden">

      {/* ══ Gauche : bordereau ══════════════════════════════════════════════ */}
      <div className="flex-1 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden min-w-0">
        <div className="px-4 py-3 border-b border-zinc-100 shrink-0 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#010066]" />
          <p className="font-semibold text-zinc-900">Bordereau d&apos;expédition</p>
          <span className="text-xs text-zinc-400 ml-auto">{bordereauNum}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Zone PDF */}
          <div
            ref={printRef}
            className="bg-white shadow-lg overflow-hidden print:shadow-none"
            style={{ fontFamily: "Arial, sans-serif", width: "100%", maxWidth: "210mm", margin: "0 auto" }}
          >
            {/* En-tête bleu */}
            <div className="bg-[#010066] text-white px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center p-1.5">
                    <Image src="/logo_short.png" alt="Logo" width={48} height={48} className="w-full h-full object-contain" unoptimized />
                  </div>
                  <div>
                    <div className="text-xs text-gray-300">IMPORT-EXPORT BF</div>
                    <h1 className="text-lg sm:text-2xl font-bold">IMPORT EXPORT BF</h1>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs text-gray-300 space-y-0.5">
                    <p>+33 6 70 69 98 23</p>
                    <p>+226 76 60 19 81</p>
                    <p>contact@ieBF.fr</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-300">N° de suivi</p>
                      <p className="text-base sm:text-lg font-bold">{shipmentInfo?.shipmentNumber || "—"}</p>
                      <p className="text-xs text-gray-300">Date: {dateEdition}</p>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded flex items-center justify-center">
                      <QRCode
                        value={shipmentInfo?.shipmentNumber ? `${typeof window !== "undefined" ? window.location.origin : "https://import-export-bf.com"}/tracking?q=${shipmentInfo.shipmentNumber}` : "https://import-export-bf.com"}
                        size={44}
                        level="M"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bandeau conteneur + N° suivi */}
            <div className="bg-white border-b border-gray-300 px-4 sm:px-6 py-2 sm:py-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-4">
                  {lastContainer && (
                    <>
                      <span>Conteneur: <span className="font-bold">{lastContainer.containerNumber}</span></span>
                      <span>Départ: <span className="font-bold">
                        {lastContainer.departureDate
                          ? new Date(lastContainer.departureDate).toLocaleDateString("fr-FR")
                          : "À déterminer"}
                      </span></span>
                    </>
                  )}
                  <span className="font-bold">{orderItems.reduce((s, i) => s + i.quantity, 0)} colis</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 font-normal">N° de suivi : </span>
                  <span className="font-bold text-[#010066]">{shipmentInfo?.shipmentNumber || "—"}</span>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-4">
              {/* Expéditeur / Destinataire */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-300 p-3 sm:p-4 bg-gray-50">
                  <h3 className="text-xs sm:text-sm font-bold text-black mb-2 uppercase">Expéditeur</h3>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Code:</span><span className="font-bold">{selectedClient.clientCode || "—"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Nom:</span><span className="font-bold">{selectedClient.firstName || ""} {selectedClient.lastName || ""}</span></div>
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Tél:</span><span className="font-bold">{formatPhone(selectedClient.phone)}</span></div>
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Adresse:</span><span className="font-bold">{selectedClient.address || ""}{selectedClient.city ? `, ${selectedClient.city}` : ""}</span></div>
                  </div>
                </div>
                <div className="border border-gray-300 p-3 sm:p-4 bg-gray-50">
                  <h3 className="text-xs sm:text-sm font-bold text-black mb-2 uppercase">Destinataire</h3>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Nom:</span><span className="font-bold">{selectedClient.recipientName || "Non renseigné"}</span></div>
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Tél:</span><span className="font-bold">{formatPhone(selectedClient.recipientPhone)}</span></div>
                    <div className="flex gap-2"><span className="text-gray-600 w-14 shrink-0">Adresse:</span><span className="font-bold">{selectedClient.recipientAddress || "Non renseignée"}{selectedClient.recipientCity ? `, ${selectedClient.recipientCity}` : ""}</span></div>
                  </div>
                </div>
              </div>

              {/* Tableau commande */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-black mb-2">
                  Détail de la commande ({orderItems.reduce((s, i) => s + i.quantity, 0)} colis)
                </h3>
                <div className="border border-gray-300">
                  <div className="bg-[#010066] text-white text-xs font-bold">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2">
                      <div className="col-span-6">Désignation</div>
                      <div className="col-span-2 text-center">Qté</div>
                      <div className="col-span-2 text-right">P.U.</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {orderItems.map((item, idx) => (
                      <div key={item.id} className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs sm:text-sm ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <div className="col-span-6 font-semibold">{item.name}</div>
                        <div className="col-span-2 text-center">{item.quantity}</div>
                        <div className="col-span-2 text-right">{formatPrice(item.price)} €</div>
                        <div className="col-span-2 text-right font-bold">{formatPrice(item.total)} €</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="space-y-1 text-sm min-w-[200px]">
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-600 uppercase text-xs">Sous-total</span>
                    <span className="font-bold">{formatPrice(orderSubtotal)} €</span>
                  </div>
                  {(orderOptions?.discount ?? 0) > 0 && (
                    <div className="flex justify-between gap-8 text-green-700">
                      <span className="uppercase text-xs">Remise</span>
                      <span className="font-bold">−{formatPrice(orderOptions.discount)} €</span>
                    </div>
                  )}
                  {(orderOptions?.additionalFees ?? 0) > 0 && (
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-600 uppercase text-xs">Frais supplémentaires</span>
                      <span className="font-bold">+{formatPrice(orderOptions.additionalFees)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-8 pt-1 border-t border-gray-300">
                    <span className="font-bold uppercase text-xs">Total général</span>
                    <span className="text-lg font-bold">{formatPrice(orderTotal)} €</span>
                  </div>
                  {montantPaye > 0 && (
                    <div className="flex justify-between gap-8 text-green-700">
                      <span className="uppercase text-xs">Montant payé</span>
                      <span className="font-bold">{formatPrice(montantPaye)} €</span>
                    </div>
                  )}
                  {resteAPayer > 0 && (
                    <div className="flex justify-between gap-8 text-blue-700">
                      <span className="uppercase text-xs">Reste à payer</span>
                      <span className="font-bold">{formatPrice(resteAPayer)} €</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode de paiement */}
              {paymentInfo?.modePaiement && (
                <div className="bg-gray-50 border border-gray-300 p-3 text-xs">
                  <span className="font-bold uppercase">Mode de paiement : </span>
                  <span>{paymentInfo.modePaiement}</span>
                </div>
              )}

              {/* Conditions */}
              <div className="bg-gray-50 border border-gray-300 p-3">
                <h4 className="text-xs font-bold text-black mb-1 uppercase">Conditions</h4>
                <div className="text-xs text-black space-y-1">
                  <p>• Marchandises non précisées ne pourront être réclamées • Valeurs justifiées par facture</p>
                  <p>• Livraison optionnelle déterminée avant départ • Sous réserve procédures douanières</p>
                </div>
              </div>

              {/* Signature */}
              <div className="flex items-end justify-between pt-3 border-t border-gray-300">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Document généré le {dateEdition} — Réf. bordereau : {bordereauNum}</p>
                  <p>IMPORT EXPORT BF - Service d&apos;envoi de colis France-Burkina Faso</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Signature</p>
                  <div className="w-32 h-8 border-b border-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Droite : contrôles ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col gap-3 overflow-hidden">

        {/* Récap client */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0 space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Client</p>
          <p className="text-sm font-bold text-zinc-900">{selectedClient.firstName} {selectedClient.lastName}</p>
          {selectedClient.phone && <p className="text-xs text-zinc-400">{selectedClient.phone}</p>}
          <div className="pt-2 border-t border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">N° de suivi</p>
            <p className="text-sm font-bold text-[#010066]">{shipmentInfo?.shipmentNumber || "—"}</p>
          </div>
          {lastContainer && (
            <div className="pt-2 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Conteneur actif</p>
              <p className="text-sm font-bold text-zinc-900">{lastContainer.containerNumber}</p>
              {lastContainer.departureDate && (
                <p className="text-xs text-zinc-400">Départ : {new Date(lastContainer.departureDate).toLocaleDateString("fr-FR")}</p>
              )}
            </div>
          )}
        </div>

        {/* Récap commande */}
        <div className="bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-zinc-100 shrink-0 flex items-center justify-between">
            <p className="font-semibold text-zinc-900 text-sm">Commande</p>
            <p className="text-lg font-bold text-orange-600">{formatPrice(orderTotal)} €</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {orderItems.map((item) => (
              <div key={item.id} className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
                <p className="text-xs font-medium text-zinc-900 line-clamp-2 mb-1">{item.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{formatPrice(item.price)} × {item.quantity}</span>
                  <span className="text-sm font-bold text-orange-600">{formatPrice(item.total)} €</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0 space-y-2">
          <Button onClick={handleDownload} disabled={isGenerating} className="w-full bg-[#010066] hover:bg-[#010088] text-white">
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Génération…" : "Télécharger PDF"}
          </Button>
          <Button onClick={handlePrint} disabled={isGenerating} variant="outline" className="w-full">
            <Printer className="h-4 w-4 mr-2" />Imprimer
          </Button>
        </div>

        {/* Terminer */}
        <Button onClick={() => { clearSession(); router.push("/admin/caisse/client"); }} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl shrink-0">
          <CheckCircle2 className="h-5 w-5 mr-2" />Terminer
        </Button>
      </div>

    </div>
  );
}

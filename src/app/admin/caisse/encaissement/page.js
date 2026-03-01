"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCaisse } from "@/contexts/caisse-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  Calculator,
  ArrowLeft,
  ShoppingCart,
  Smartphone,
  Menu,
} from "lucide-react";

/* ── Utilitaires ─────────────────────────────────────────────── */
function cleanAmount(value) {
  if (!value) return "0";
  return String(value).replace(/[^\d]/g, "");
}

function formatPrice(amount) {
  if (typeof amount === "string") {
    amount = parseFloat(cleanAmount(amount)) || 0;
  }
  if (!amount || isNaN(amount)) return "0";
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

const MODES_PAIEMENT = [
  { value: "ESPECES",  label: "Espèces",       icon: Banknote    },
  { value: "CARTE",    label: "Carte bancaire", icon: CreditCard  },
  { value: "MOBILE",   label: "Mobile Money",   icon: Smartphone  },
  { value: "VIREMENT", label: "Virement",       icon: Wallet      },
];

/* ── Page ────────────────────────────────────────────────────── */
export default function EncaissementPage() {
  const router = useRouter();
  const {
    selectedClient,
    orderItems,
    orderTotal,
    setPaymentInfo,
  } = useCaisse();

  const [modePaiement, setModePaiement] = useState("ESPECES");
  const [montantRecu,  setMontantRecu]  = useState("");
  const [monnaieRendue, setMonnaieRendue] = useState(0);
  const [observations, setObservations] = useState("");
  const [loading,      setLoading]      = useState(false);
  const montantInputRef = useRef(null);

  /* ── Monnaie rendue ── */
  useEffect(() => {
    if (modePaiement === "ESPECES" && montantRecu) {
      const recu = parseFloat(cleanAmount(montantRecu)) || 0;
      setMonnaieRendue(Math.max(0, recu - orderTotal));
    } else {
      setMonnaieRendue(0);
    }
  }, [montantRecu, orderTotal, modePaiement]);

  /* ── Focus auto sur le champ montant ── */
  useEffect(() => {
    if (modePaiement === "ESPECES") {
      setTimeout(() => montantInputRef.current?.focus(), 100);
    }
  }, [modePaiement]);

  const handleMontantChange = (e) => {
    const cleaned = cleanAmount(e.target.value);
    setMontantRecu(cleaned ? formatPrice(parseFloat(cleaned)) : "");
  };

  const handleQuickAmount = (amount) => {
    setMontantRecu(formatPrice(amount));
    setTimeout(() => montantInputRef.current?.focus(), 50);
  };

  const canValidate = () => {
    if (!selectedClient || orderItems.length === 0) return false;
    if (modePaiement === "ESPECES") {
      const recu = parseFloat(cleanAmount(montantRecu)) || 0;
      return recu >= orderTotal;
    }
    return true;
  };

  const handleValidate = async () => {
    if (!canValidate()) return;
    setLoading(true);

    const montantRecuNum =
      modePaiement === "ESPECES"
        ? parseFloat(cleanAmount(montantRecu)) || orderTotal
        : orderTotal;

    // Stocker les infos de paiement dans le contexte pour l'impression
    setPaymentInfo({
      modePaiement,
      montantRecu:   montantRecuNum,
      monnaieRendue,
      observations:  observations.trim() || null,
      paidAt:        new Date().toISOString(),
    });

    // Petit délai visuel puis redirection vers impression
    setTimeout(() => {
      setLoading(false);
      router.push("/admin/caisse/impression");
    }, 800);
  };

  /* ── États vides ── */
  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="shadow-none w-full max-w-sm">
          <CardContent className="p-8 text-center space-y-4">
            <CreditCard className="h-12 w-12 mx-auto text-zinc-300" />
            <div>
              <h3 className="font-semibold text-zinc-900">Aucun client sélectionné</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Sélectionnez un client avant de procéder au paiement.
              </p>
            </div>
            <Button
              onClick={() => router.push("/admin/caisse/client")}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sélectionner un client
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="shadow-none w-full max-w-sm">
          <CardContent className="p-8 text-center space-y-4">
            <ShoppingCart className="h-12 w-12 mx-auto text-zinc-300" />
            <div>
              <h3 className="font-semibold text-zinc-900">Commande vide</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Ajoutez des produits à la commande.
              </p>
            </div>
            <Button
              onClick={() => router.push("/admin/caisse/commande")}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la commande
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const montantRecuNum = parseFloat(cleanAmount(montantRecu)) || 0;
  const insuffisant    = modePaiement === "ESPECES" && montantRecuNum > 0 && montantRecuNum < orderTotal;

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-screen gap-2 sm:gap-3 p-2 sm:p-4 overflow-hidden">

      {/* ══ Gauche : récapitulatif + mode paiement (Desktop) ══════════════════ */}
      <div className="hidden lg:flex w-80 shrink-0 flex-col gap-3 overflow-hidden">

        {/* Récapitulatif */}
        <div className="bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-zinc-100 shrink-0 flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900">Récapitulatif</p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{selectedClient.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Total</p>
              <p className="text-lg font-bold text-orange-600">{formatPrice(orderTotal)} €</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {orderItems.map((item) => (
              <div key={item.id} className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
                <p className="text-xs font-medium text-zinc-900 line-clamp-2 mb-1">{item.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {formatPrice(item.price)} × {item.quantity}
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    {formatPrice(item.total)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mode de paiement */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0">
          <p className="text-sm font-semibold text-zinc-900 mb-3">Mode de paiement</p>
          <RadioGroup value={modePaiement} onValueChange={setModePaiement} className="space-y-2">
            {MODES_PAIEMENT.map(({ value, label, icon: Icon }) => (
              <div
                key={value}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  modePaiement === value
                    ? "border-orange-500 bg-orange-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                onClick={() => setModePaiement(value)}
              >
                <RadioGroupItem value={value} id={value} />
                <Label htmlFor={value} className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                  <Icon className="h-4 w-4 text-zinc-500" />
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* ══ Droite : saisie montant + validation ════════════════════ */}
      <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-hidden min-w-0 order-2 lg:order-1">

        {/* Champ montant reçu (espèces uniquement) */}
        {modePaiement === "ESPECES" && (
          <div className="bg-white rounded-xl border-2 border-orange-300 p-5 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-orange-600" />
              <p className="font-semibold text-zinc-900">Montant reçu</p>
            </div>

            {/* Input montant */}
            <div className="relative mb-4">
              <input
                ref={montantInputRef}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={montantRecu}
                onChange={handleMontantChange}
                className="w-full h-16 text-3xl font-bold text-center rounded-xl border-2 border-zinc-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors pr-20 bg-zinc-50"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">
                €
              </span>
            </div>

            {/* Bouton rapide */}
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickAmount(orderTotal)}
                className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold border-orange-200 hover:border-orange-500 hover:bg-orange-50"
              >
                Exact — {formatPrice(orderTotal)} €
              </Button>
            </div>

            {/* Monnaie rendue */}
            {monnaieRendue > 0 && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                <p className="text-xs text-green-700 font-medium mb-1">Monnaie à rendre</p>
                <p className="text-3xl font-bold text-green-700">{formatPrice(monnaieRendue)} €</p>
              </div>
            )}

            {/* Montant insuffisant */}
            {insuffisant && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                <p className="text-xs text-red-700 font-medium mb-1">Montant insuffisant</p>
                <p className="text-lg font-semibold text-red-600">
                  Il manque {formatPrice(orderTotal - montantRecuNum)} €
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mode non-espèces : confirmation directe */}
        {modePaiement !== "ESPECES" && (
          <div className="bg-white rounded-xl border-2 border-orange-300 p-5 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900">Montant à encaisser</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {MODES_PAIEMENT.find((m) => m.value === modePaiement)?.label}
                </p>
              </div>
              <p className="text-3xl font-bold text-orange-600">{formatPrice(orderTotal)} €</p>
            </div>
          </div>
        )}

        {/* Observations */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0">
          <p className="text-sm font-semibold text-zinc-900 mb-2">Observations</p>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Notes optionnelles sur cette vente…"
            rows={3}
            className="w-full p-3 text-sm border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bouton valider */}
        <div className="shrink-0">
          <Button
            onClick={handleValidate}
            disabled={!canValidate() || loading}
            className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <CheckCircle2 className="h-6 w-6 mr-2 animate-spin" />
                Traitement…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6 mr-2" />
                Valider le paiement — {formatPrice(orderTotal)} €
              </>
            )}
          </Button>
        </div>

      </div>

      {/* ══ Mobile : Récapitulatif + Mode paiement (Sheet) ══════════════════ */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="lg:hidden fixed bottom-4 left-4 z-50 h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-2xl"
            size="icon"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>Récapitulatif</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Récapitulatif */}
              <div className="bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 shrink-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900">Récapitulatif</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{selectedClient.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Total</p>
                    <p className="text-lg font-bold text-orange-600">{formatPrice(orderTotal)} €</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px]">
                  {orderItems.map((item) => (
                    <div key={item.id} className="bg-white border border-zinc-100 rounded-lg p-3">
                      <p className="text-sm font-medium text-zinc-900 line-clamp-2 mb-1">{item.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          {formatPrice(item.price)} × {item.quantity}
                        </span>
                        <span className="text-sm font-bold text-orange-600">
                          {formatPrice(item.total)} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode de paiement */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0">
                <p className="text-sm font-semibold text-zinc-900 mb-3">Mode de paiement</p>
                <RadioGroup value={modePaiement} onValueChange={setModePaiement} className="space-y-2">
                  {MODES_PAIEMENT.map(({ value, label, icon: Icon }) => (
                    <div
                      key={value}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        modePaiement === value
                          ? "border-orange-500 bg-orange-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                      onClick={() => setModePaiement(value)}
                    >
                      <RadioGroupItem value={value} id={`mobile-${value}`} />
                      <Label htmlFor={`mobile-${value}`} className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                        <Icon className="h-4 w-4 text-zinc-500" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

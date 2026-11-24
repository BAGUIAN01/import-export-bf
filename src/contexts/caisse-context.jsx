"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { calculerRemise, arrondi } from "@/lib/caisse/montants";

const CaisseContext = createContext(null);

const OPTIONS_INITIALES = {
  discount: 0,
  additionalFees: 0,
  priority: "NORMAL",
  specialInstructions: "",
  notes: "",
};

// Commande en cours gardée le temps de l'onglet : un rechargement de la
// tablette ne fait pas perdre le client ni le ticket.
const CLE_STOCKAGE = "caisse:commande-en-cours";

function lireStockage() {
  try {
    const brut = window.sessionStorage.getItem(CLE_STOCKAGE);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

function ecrireStockage(valeur) {
  try {
    window.sessionStorage.setItem(CLE_STOCKAGE, JSON.stringify(valeur));
  } catch {
    /* stockage indisponible (navigation privée) : on continue sans */
  }
}

export function CaisseProvider({ children }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  // paymentInfo: { modePaiement, montantRecu, monnaieRendue, reference, observations, paidAt }
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [options, setOrderOptions] = useState(OPTIONS_INITIALES);
  // remise: { type: "pourcent" | "montant", valeur, motif } | null
  const [remise, setRemise] = useState(null);
  // Réponse de POST /api/caisse/orders, pour l'écran de fin et le bordereau
  const [lastOrder, setLastOrder] = useState(null);
  const [restaure, setRestaure] = useState(false);

  /* ── Restauration après rechargement ───────────────────── */
  useEffect(() => {
    const s = lireStockage();
    if (s) {
      if (s.selectedClient) setSelectedClient(s.selectedClient);
      if (s.selectedContainer) setSelectedContainer(s.selectedContainer);
      if (Array.isArray(s.orderItems)) setOrderItems(s.orderItems);
      if (s.remise) setRemise(s.remise);
      if (s.options) setOrderOptions({ ...OPTIONS_INITIALES, ...s.options });
      if (s.paymentInfo) setPaymentInfo(s.paymentInfo);
      if (s.lastOrder) setLastOrder(s.lastOrder);
    }
    setRestaure(true);
  }, []);

  useEffect(() => {
    if (!restaure) return;
    ecrireStockage({ selectedClient, selectedContainer, orderItems, remise, options, paymentInfo, lastOrder });
  }, [restaure, selectedClient, selectedContainer, orderItems, remise, options, paymentInfo, lastOrder]);

  /* ── Ajouter ou incrémenter ─────────────────────────────── */
  // product : { id, type, name, price, categoryId, description? }
  // `type` est le code du colis (PACKAGE_TYPES.value) envoyé à l'API.
  const addItem = useCallback((product, quantite = 1) => {
    const prix = arrondi(product.basePrice ?? product.price ?? 0);
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantite, total: arrondi((i.quantity + quantite) * i.price) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          type: product.type ?? product.id,
          categoryId: product.categoryId ?? null,
          name: product.name,
          description: product.description ?? null,
          price: prix,
          quantity: quantite,
          total: arrondi(prix * quantite),
          sku: product.sku ?? "",
          unit: product.unit ?? "PIECE",
          // Dessin ou photo de l'article, pour le ticket et le récapitulatif
          vignette: product.vignette ?? null,
        },
      ];
    });
  }, []);

  /* ── Modifier la quantité (delta = ±1) ──────────────────── */
  const updateItemQuantity = useCallback((itemId, delta) => {
    setOrderItems((prev) =>
      prev
        .map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + delta, total: arrondi((i.quantity + delta) * i.price) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  /* ── Fixer la quantité (clavier à l'écran) ──────────────── */
  const setItemQuantity = useCallback((itemId, quantite) => {
    const q = Math.max(0, Math.floor(quantite));
    setOrderItems((prev) =>
      prev
        .map((i) => (i.id === itemId ? { ...i, quantity: q, total: arrondi(q * i.price) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  /* ── Supprimer ──────────────────────────────────────────── */
  const removeItem = useCallback((itemId) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  /* ── Vider la commande ──────────────────────────────────── */
  const clearOrder = useCallback(() => {
    setOrderItems([]);
    setRemise(null);
  }, []);

  /* ── Réinitialiser pour le client suivant ───────────────── */
  const clearSession = useCallback(() => {
    setSelectedClient(null);
    setOrderItems([]);
    // Le conteneur reste choisi entre deux clients : même chargement.
    setPaymentInfo(null);
    setRemise(null);
    setLastOrder(null);
    setOrderOptions(OPTIONS_INITIALES);
  }, []);

  const orderSubtotal = arrondi(orderItems.reduce((sum, i) => sum + i.total, 0));
  const remiseMontant = calculerRemise(orderSubtotal, remise);
  const orderTotal = arrondi(Math.max(0, orderSubtotal - remiseMontant + (options.additionalFees || 0)));
  // La remise calculée remplace `discount` : c'est ce que l'API répartit sur les colis.
  const orderOptions = useMemo(() => ({ ...options, discount: remiseMontant }), [options, remiseMontant]);

  return (
    <CaisseContext.Provider
      value={{
        restaure,
        selectedClient,
        setSelectedClient,
        selectedContainer,
        setSelectedContainer,
        orderItems,
        addItem,
        updateItemQuantity,
        setItemQuantity,
        removeItem,
        clearOrder,
        orderSubtotal,
        orderTotal,
        remise,
        setRemise,
        remiseMontant,
        orderOptions,
        setOrderOptions,
        paymentInfo,
        setPaymentInfo,
        lastOrder,
        setLastOrder,
        clearSession,
      }}
    >
      {children}
    </CaisseContext.Provider>
  );
}

export function useCaisse() {
  const ctx = useContext(CaisseContext);
  if (!ctx) throw new Error("useCaisse must be used within CaisseProvider");
  return ctx;
}

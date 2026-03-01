"use client";

import { createContext, useContext, useState, useCallback } from "react";

const CaisseContext = createContext(null);

export function CaisseProvider({ children }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [orderItems, setOrderItems]         = useState([]);
  // paymentInfo: { modePaiement, montantRecu, monnaieRendue, observations }
  const [paymentInfo, setPaymentInfo]       = useState(null);
  // orderOptions: { discount, additionalFees, priority, specialInstructions, notes }
  const [orderOptions, setOrderOptions]     = useState({
    discount: 0,
    additionalFees: 0,
    priority: 'NORMAL',
    specialInstructions: '',
    notes: '',
  });

  /* ── Ajouter ou incrémenter ─────────────────────────────── */
  const addItem = useCallback((product) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [
        ...prev,
        {
          id:         `${product.id}-${Date.now()}`,
          productId:  product.id,
          categoryId: product.categoryId ?? null,
          name:       product.name,
          price:      product.basePrice ?? product.price ?? 0,
          quantity:   1,
          total:      product.basePrice ?? product.price ?? 0,
          sku:        product.sku ?? "",
          unit:       product.unit ?? "PIECE",
        },
      ];
    });
  }, []);

  /* ── Modifier la quantité (delta = ±1) ──────────────────── */
  const updateItemQuantity = useCallback((itemId, delta) => {
    setOrderItems((prev) =>
      prev
        .map((i) =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + delta, total: (i.quantity + delta) * i.price }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  /* ── Supprimer ──────────────────────────────────────────── */
  const removeItem = useCallback((itemId) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  /* ── Vider la commande ──────────────────────────────────── */
  const clearOrder = useCallback(() => setOrderItems([]), []);

  /* ── Réinitialiser la session ───────────────────────────── */
  const clearSession = useCallback(() => {
    setSelectedClient(null);
    setOrderItems([]);
    setPaymentInfo(null);
    setOrderOptions({
      discount: 0,
      additionalFees: 0,
      priority: 'NORMAL',
      specialInstructions: '',
      notes: '',
    });
  }, []);

  const orderSubtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
  const orderTotal = Math.max(0, orderSubtotal - (orderOptions.discount || 0) + (orderOptions.additionalFees || 0));

  return (
    <CaisseContext.Provider
      value={{
        selectedClient, setSelectedClient,
        orderItems, addItem, updateItemQuantity, removeItem, clearOrder,
        orderSubtotal,
        orderTotal,
        orderOptions, setOrderOptions,
        paymentInfo, setPaymentInfo,
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

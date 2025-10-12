"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { useState } from "react";

// Fetcher pour SWR
const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement");
  }
  return response.json();
};

/**
 * Hook personnalisé pour gérer les shipments avec cache SWR
 * @param {Object} options - Options de configuration
 * @param {string} options.clientId - Filtre par client
 * @param {string} options.containerId - Filtre par conteneur
 * @param {string} options.paymentStatus - Filtre par statut de paiement
 * @param {number} options.page - Numéro de page
 * @param {number} options.limit - Nombre d'items par page
 */
export function useShipments(options = {}) {
  const {
    clientId,
    containerId,
    paymentStatus,
    page = 1,
    limit = 50,
  } = options;

  // Construction de l'URL avec les paramètres
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (clientId) queryParams.append("clientId", clientId);
  if (containerId) queryParams.append("containerId", containerId);
  if (paymentStatus) queryParams.append("paymentStatus", paymentStatus);

  const url = `/api/shipments?${queryParams.toString()}`;

  // SWR avec options de cache optimisées
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  return {
    shipments: data?.data || [],
    pagination: data?.pagination || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook pour les opérations CRUD sur les shipments
 */
export function useShipmentMutations() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Créer un nouveau shipment
   */
  const createShipment = async (shipmentData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const data = await response.json();
      toast.success("Expédition créée avec succès");
      return { success: true, data: data.shipment };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création de l'expédition");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mettre à jour un shipment existant
   */
  const updateShipment = async (shipmentId, shipmentData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const data = await response.json();
      toast.success("Expédition modifiée avec succès");
      return { success: true, data: data.shipment };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification de l'expédition");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Supprimer un shipment
   */
  const deleteShipment = async (shipmentId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Expédition supprimée avec succès");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression de l'expédition");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mettre à jour le statut de paiement
   */
  const updatePaymentStatus = async (shipmentId, paymentData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: paymentData.paymentStatus,
          paymentMethod: paymentData.paymentMethod,
          paidAmount: paymentData.paidAmount,
          paidAt: paymentData.paidAt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour du paiement");
      }

      toast.success("Statut de paiement mis à jour");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la mise à jour du paiement");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createShipment,
    updateShipment,
    deleteShipment,
    updatePaymentStatus,
  };
}

/**
 * Hook pour récupérer un shipment spécifique par ID
 */
export function useShipment(shipmentId) {
  const url = shipmentId ? `/api/shipments/${shipmentId}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    shipment: data?.shipment || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook pour récupérer les détails complets d'un shipment avec packages
 */
export function useShipmentDetails(shipmentId) {
  const url = shipmentId ? `/api/shipments/${shipmentId}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    dedupingInterval: 5000,
  });

  return {
    shipment: data?.shipment || null,
    packages: data?.packages || [],
    stats: data?.stats || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook pour créer des packages en batch avec un shipment
 */
export function usePackageBatch() {
  const [isLoading, setIsLoading] = useState(false);

  const createPackageBatch = async (packagesData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packagesData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création des colis");
      }

      const data = await response.json();
      
      // Ne pas afficher de toast ici, ce sera géré par l'appelant
      return { success: true, data };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création des colis");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createPackageBatch,
  };
}


"use client";

import useSWR from "swr";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Fetcher générique pour SWR
 */
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(error.error || "Erreur lors de la récupération des données");
  }
  return res.json();
};

/**
 * Hook pour récupérer la liste des conteneurs avec filtres
 */
export function useContainers(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const url = `/api/containers${params.toString() ? `?${params.toString()}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  return {
    containers: data?.containers || [],
    pagination: data?.pagination || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook pour les mutations de conteneurs (create, update, delete)
 */
export function useContainerMutations() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Créer un conteneur
   */
  const createContainer = async (containerData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const data = await response.json();
      toast.success("Conteneur créé avec succès");
      return { success: true, data };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création du conteneur");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mettre à jour un conteneur
   */
  const updateContainer = async (containerId, containerData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/containers/${containerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const data = await response.json();
      toast.success("Conteneur modifié avec succès");
      return { success: true, data };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification du conteneur");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Supprimer un conteneur
   */
  const deleteContainer = async (containerId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/containers/${containerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Conteneur supprimé avec succès");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression du conteneur");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mettre à jour le statut d'un conteneur
   */
  const updateContainerStatus = async (containerId, status) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/containers/${containerId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour du statut");
      }

      const data = await response.json();
      toast.success(`Statut mis à jour : ${status}`);
      return { success: true, data };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la mise à jour du statut");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createContainer,
    updateContainer,
    deleteContainer,
    updateContainerStatus,
    isLoading,
  };
}

/**
 * Hook pour récupérer un conteneur spécifique par ID
 */
export function useContainer(containerId) {
  const url = containerId ? `/api/containers/${containerId}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    container: data?.container || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook pour récupérer les détails complets d'un conteneur avec packages et stats
 */
export function useContainerDetails(containerId) {
  const url = containerId ? `/api/containers/${containerId}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    dedupingInterval: 5000,
  });

  return {
    container: data?.container || null,
    packages: data?.container?.packages || [],
    stats: data?.stats || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
    refresh: mutate,
  };
}

/**
 * Hook pour récupérer les statistiques des conteneurs
 */
export function useContainersStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/containers/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
    }
  );

  return {
    stats: data?.stats || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}


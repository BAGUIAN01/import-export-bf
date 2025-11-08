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
 * Hook personnalisé pour gérer les clients avec cache SWR
 * @param {Object} options - Options de configuration
 * @param {string} options.search - Terme de recherche
 * @param {string} options.status - Filtre de statut
 * @param {string} options.country - Filtre de pays
 * @param {number} options.page - Numéro de page
 * @param {number} options.limit - Nombre d'items par page
 * @param {boolean} options.includeStats - Inclure les statistiques
 */
export function useClients(options = {}) {
  const {
    search = "",
    status = "all",
    country = "all",
    page = 1,
    limit = 50,
    includeStats = true,
    swrConfig = {},
  } = options;

  // Construction de l'URL avec les paramètres
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    includeStats: includeStats.toString(),
  });

  if (search) queryParams.append("search", search);
  if (status && status !== "all") queryParams.append("status", status);
  if (country && country !== "all") queryParams.append("country", country);

  const url = `/api/clients?${queryParams.toString()}`;

  // SWR avec options de cache optimisées
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false, // Ne pas revalider au focus
      revalidateOnReconnect: true, // Revalider à la reconnexion
      dedupingInterval: 2000, // Éviter les requêtes dupliquées pendant 2s
      keepPreviousData: true, // Garder les données précédentes pendant le chargement
      ...swrConfig,
    }
  );

  return {
    clients: data?.data || [],
    stats: data?.stats || null,
    pagination: data?.pagination || null,
    isLoading,
    isValidating,
    isError: error,
    error: error?.message,
    mutate, // Pour rafraîchir manuellement
  };
}

/**
 * Hook pour les opérations CRUD sur les clients
 */
export function useClientMutations() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Créer un nouveau client
   */
  const createClient = async (clientData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const data = await response.json();
      toast.success("Client créé avec succès");
      return { success: true, data: data.client };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création du client");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mettre à jour un client existant
   */
  const updateClient = async (clientId, clientData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const data = await response.json();
      toast.success("Client modifié avec succès");
      return { success: true, data: data.client };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification du client");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Supprimer un client
   */
  const deleteClient = async (clientId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Client supprimé avec succès");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la suppression du client");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Activer/Désactiver un client
   */
  const toggleClientStatus = async (clientId, isActive) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      toast.success(
        `Client ${!isActive ? "activé" : "désactivé"} avec succès`
      );
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification du statut");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Basculer le statut VIP d'un client
   */
  const toggleVipStatus = async (clientId, isVip) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVip: !isVip }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      toast.success(
        `Statut VIP ${!isVip ? "ajouté" : "retiré"} avec succès`
      );
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification du statut VIP");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus,
    toggleVipStatus,
  };
}

/**
 * Hook pour récupérer un client spécifique par ID
 */
export function useClient(clientId) {
  const url = clientId ? `/api/clients/${clientId}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return {
    client: data?.client || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook pour récupérer les détails complets d'un client avec packages, stats, etc.
 */
export function useClientDetails(clientId) {
  const url = clientId ? `/api/clients/${clientId}` : null;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Pas de rafraîchissement automatique
    dedupingInterval: 5000, // Déduplication sur 5 secondes
  });

  return {
    client: data?.client || null,
    packages: data?.packages || [],
    stats: data?.stats || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate, // Pour rafraîchir manuellement
    refresh: mutate, // Alias pour plus de clarté
  };
}

/**
 * Hook pour rechercher des clients
 */
export function useClientSearch(searchTerm, options = {}) {
  const {
    debounceMs = 300,
    enabled = true,
  } = options;

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce le terme de recherche
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const url = enabled && debouncedSearch
    ? `/api/clients/search?q=${encodeURIComponent(debouncedSearch)}`
    : null;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000,
  });

  return {
    results: data?.results || [],
    isSearching: isLoading,
    hasError: !!error,
  };
}


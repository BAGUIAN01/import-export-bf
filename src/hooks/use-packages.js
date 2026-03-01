"use client";

import useSWR from "swr";

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(error.error || "Erreur lors de la récupération des données");
  }
  return res.json();
};

/**
 * Hook pour récupérer la liste des colis avec filtres et pagination
 */
export function usePackages(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status)     params.append("status", filters.status);
  if (filters.clientId)   params.append("clientId", filters.clientId);
  if (filters.shipmentId) params.append("shipmentId", filters.shipmentId);
  params.append("page",  (filters.page  || 1).toString());
  params.append("limit", (filters.limit || 500).toString());

  const url = `/api/packages?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  return {
    packages:   data?.data || [],
    pagination: data?.pagination || null,
    isLoading,
    isError: error,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook pour les statistiques des colis (depuis /api/packages/stats)
 */
export function usePackagesStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/packages/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    stats:    data?.data || null,
    isLoading,
    isError:  error,
    error:    error?.message,
    mutate,
  };
}

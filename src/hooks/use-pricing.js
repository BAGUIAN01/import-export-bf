"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Package as PackageIcon } from "lucide-react";
import { PACKAGE_CATEGORIES, PACKAGE_TYPES } from "@/lib/data/packages";
import { toCatalogType } from "@/lib/data/pricing-catalog";

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Erreur lors du chargement des tarifs");
  }
  return response.json();
};

const STATIC_ICONS = new Map(PACKAGE_TYPES.map((t) => [t.value, t.icon]));

/**
 * Grille tarifaire lue dans la table `pricings` (écran Gestion → Tarifs).
 * Tant que la table ne répond pas (chargement, erreur, table vide), on retombe
 * sur la liste écrite dans lib/data/packages.js : la caisse ne reste jamais vide.
 */
export function usePricing(swrConfig = {}) {
  const { data, error, isLoading, mutate } = useSWR("/api/pricing", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    keepPreviousData: true,
    ...swrConfig,
  });

  const rows = data?.data ?? null;
  const fromDb = Array.isArray(rows) && rows.length > 0;

  const allTypes = useMemo(() => {
    if (!fromDb) return PACKAGE_TYPES;
    return rows.map((r) => ({ ...toCatalogType(r), icon: STATIC_ICONS.get(r.type) ?? PackageIcon }));
  }, [rows, fromDb]);

  // Ce qui est proposé à la caisse et dans le formulaire de colis
  const activeTypes = useMemo(() => allTypes.filter((t) => t.isActive !== false), [allTypes]);

  const typesByCategory = useMemo(
    () =>
      PACKAGE_CATEGORIES.map((cat) => ({
        ...cat,
        types: activeTypes.filter((t) => t.category === cat.key),
      })),
    [activeTypes]
  );

  // Inclut les articles retirés : un ancien colis garde un libellé lisible.
  const typeByValue = useMemo(() => new Map(allTypes.map((t) => [t.value, t])), [allTypes]);

  return {
    rows: rows ?? [],
    fromDb,
    allTypes,
    activeTypes,
    typesByCategory,
    findType: (value) => typeByValue.get(value) ?? PACKAGE_TYPES.find((t) => t.value === value),
    photoStorageReady: Boolean(data?.photoStorageReady),
    isLoading,
    error,
    mutate,
  };
}

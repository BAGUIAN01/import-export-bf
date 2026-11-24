"use client";

import useSWR from "swr";
import { construireCatalogue } from "@/lib/caisse/familles";

const lire = (url) =>
  fetch(url).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Le catalogue n'a pas pu être chargé.");
    return d;
  });

/**
 * Catalogue des tarifs (familles, articles, photos).
 * `pourCaisse` : seulement les articles proposés à la caisse, mis en forme.
 */
export function useCatalogue({ pourCaisse = false } = {}) {
  const { data, error, isLoading, mutate } = useSWR(pourCaisse ? "/api/tarifs?caisse=1" : "/api/tarifs", lire, {
    revalidateOnFocus: false,
  });
  return {
    familles: data?.familles || [],
    catalogue: data ? construireCatalogue(data.familles) : null,
    erreur: error?.message || null,
    chargement: isLoading,
    recharger: mutate,
  };
}

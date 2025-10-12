"use client";

import { SWRConfig } from "swr";

const swrConfig = {
  // Réessayer en cas d'erreur
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Options de revalidation
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  
  // Délai avant de considérer une requête comme obsolète
  dedupingInterval: 2000,
  
  // Garder les données précédentes pendant le chargement
  keepPreviousData: true,
  
  // Fonction de fetcher par défaut
  fetcher: async (url) => {
    const res = await fetch(url);
    
    // Si la réponse n'est pas OK, on lance une erreur
    if (!res.ok) {
      const error = new Error("Erreur lors de la récupération des données");
      error.info = await res.json();
      error.status = res.status;
      throw error;
    }
    
    return res.json();
  },
  
  // Fonction appelée en cas d'erreur
  onError: (error, key) => {
    // Log l'erreur en développement
    if (process.env.NODE_ENV === "development") {
      console.error(`Erreur SWR pour ${key}:`, error);
    }
  },
  
  // Fonction appelée en cas de succès
  onSuccess: (data, key, config) => {
    // Log le succès en développement
    if (process.env.NODE_ENV === "development") {
      console.log(`✓ Données SWR chargées pour ${key}`);
    }
  },
};

/**
 * Provider SWR pour configurer le cache global
 */
export function SWRProvider({ children }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Comme useState, mais gardé le temps de l'onglet (sessionStorage) : le filtre
 * et la recherche d'une liste sont retrouvés en revenant d'une fiche ou d'un
 * autre onglet, comme dans une application.
 */
export function useEtatSession(cle, initial) {
  const [valeur, setValeur] = useState(initial);
  const lu = useRef(false);

  useEffect(() => {
    try {
      const brut = window.sessionStorage.getItem(`etat:${cle}`);
      if (brut != null) setValeur(JSON.parse(brut));
    } catch {
      /* stockage indisponible : valeur par défaut */
    }
    lu.current = true;
  }, [cle]);

  useEffect(() => {
    if (!lu.current) return;
    try {
      window.sessionStorage.setItem(`etat:${cle}`, JSON.stringify(valeur));
    } catch {
      /* stockage indisponible */
    }
  }, [cle, valeur]);

  return [valeur, setValeur];
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DEPOT_RETRAITS } from "@/lib/recherche";

const RetraitsContext = createContext(null);

/** Dépôt de la recherche générale : { envoiId, conteneurId, nom }, lu une fois. */
function lireDepot() {
  try {
    const d = JSON.parse(window.sessionStorage.getItem(DEPOT_RETRAITS) || "null");
    window.sessionStorage.removeItem(DEPOT_RETRAITS);
    return d;
  } catch {
    return null;
  }
}
const CLE = "retraits:en-cours";

function lire() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CLE) || "null");
  } catch {
    return null;
  }
}
function ecrire(v) {
  try {
    window.sessionStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* navigation privée : on continue sans */
  }
}

/**
 * État du retrait en cours, comme le contexte de la caisse : conteneur
 * arrivé, envoi choisi, colis cochés, personne qui retire, résultat.
 * Gardé le temps de l'onglet (un rechargement ne perd rien).
 */
export function RetraitsProvider({ children }) {
  const [donnees, setDonnees] = useState(null); // { agence, conteneurs, conteneur, envois }
  const [conteneurId, setConteneurId] = useState(null);
  const [envoiId, setEnvoiId] = useState(null);
  const [verifies, setVerifies] = useState([]);
  const [nom, setNom] = useState("");
  const [piece, setPiece] = useState("");
  const [resultat, setResultat] = useState(null);
  const [restaure, setRestaure] = useState(false);

  /** Retrait d'un envoi trouvé par la recherche : on repart d'une remise vierge. */
  function prendreEnvoiRecherche() {
    const d = lireDepot();
    if (!d?.envoiId) return;
    setConteneurId(d.conteneurId || null);
    setEnvoiId(d.envoiId);
    setVerifies([]);
    setNom(d.nom || "");
    setPiece("");
    setResultat(null);
  }

  useEffect(() => {
    const s = lire();
    if (s) {
      setConteneurId(s.conteneurId ?? null);
      setEnvoiId(s.envoiId ?? null);
      setVerifies(s.verifies || []);
      setNom(s.nom || "");
      setPiece(s.piece || "");
      setResultat(s.resultat || null);
    }
    // Envoi choisi dans la recherche générale, avant d'arriver ici
    prendreEnvoiRecherche();
    setRestaure(true);
  }, []);

  // … ou pendant qu'on est déjà dans les retraits
  useEffect(() => {
    const surDepot = (e) => {
      if (e.detail === DEPOT_RETRAITS) prendreEnvoiRecherche();
    };
    window.addEventListener("recherche:depot", surDepot);
    return () => window.removeEventListener("recherche:depot", surDepot);
  }, []);
  useEffect(() => {
    if (restaure) ecrire({ conteneurId, envoiId, verifies, nom, piece, resultat });
  }, [restaure, conteneurId, envoiId, verifies, nom, piece, resultat]);

  const charger = useCallback(() => {
    setDonnees((d) => (d && d.conteneur?.id !== conteneurId && conteneurId ? null : d));
    fetch(`/api/retraits${conteneurId ? `?conteneur=${conteneurId}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setDonnees(d);
      })
      .catch((e) => {
        toast.error(e.message);
        setDonnees({ envois: [], conteneurs: [] });
      });
  }, [conteneurId]);
  useEffect(() => {
    if (restaure) charger();
  }, [restaure, charger]);

  const envoi = useMemo(() => donnees?.envois?.find((e) => e.id === envoiId) || null, [donnees, envoiId]);

  /** Choisir un destinataire : on repart d'une remise vierge. */
  const choisir = useCallback((e) => {
    setEnvoiId(e?.id || null);
    setVerifies([]);
    setNom(e?.client?.recipientName || "");
    setPiece("");
    setResultat(null);
  }, []);

  const changerConteneur = useCallback(
    (id) => {
      setConteneurId(id);
      choisir(null);
    },
    [choisir]
  );

  /** Après la remise : on garde le résultat pour l'écran de fin, la liste se met à jour. */
  const terminer = useCallback(
    (r) => {
      setResultat(r);
      setDonnees((d) => (d ? { ...d, envois: d.envois.map((x) => (x.id === r.envoi.id ? { ...x, ...r.envoi } : x)) } : d));
    },
    []
  );

  /**
   * Remettre les colis de l'envoi choisi (POST /api/retraits/[id]).
   * `paiement` : { montantDevise, mode } ou null si rien à encaisser.
   */
  const remettre = useCallback(
    async (paiement) => {
      if (!envoi) return false;
      try {
        const res = await fetch(`/api/retraits/${envoi.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paiement, receivedBy: nom, receivedIdNumber: piece }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "La remise n'a pas pu être enregistrée.");
        terminer({
          envoi: { ...envoi, deliveredAt: data.deliveredAt, paidAmount: data.paidAmount, receivedBy: nom, receivedIdNumber: piece || null },
          montantDevise: paiement?.montantDevise || 0,
          mode: paiement?.mode || null,
        });
        return true;
      } catch (e) {
        toast.error(e.message);
        return false;
      }
    },
    [envoi, nom, piece, terminer]
  );

  return (
    <RetraitsContext.Provider
      value={{
        restaure,
        donnees,
        agence: donnees?.agence || null,
        conteneur: donnees?.conteneur || null,
        envois: donnees?.envois || [],
        charger,
        changerConteneur,
        envoi,
        choisir,
        verifies,
        setVerifies,
        nom,
        setNom,
        piece,
        setPiece,
        resultat,
        remettre,
      }}
    >
      {children}
    </RetraitsContext.Provider>
  );
}

export function useRetraits() {
  const c = useContext(RetraitsContext);
  if (!c) throw new Error("useRetraits doit être utilisé dans RetraitsProvider");
  return c;
}

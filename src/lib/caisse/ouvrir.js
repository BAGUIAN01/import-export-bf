// lib/caisse/ouvrir.js : ouvrir la caisse depuis un autre écran (fiche, liste).
import { DEPOT_CAISSE } from "@/lib/recherche";

/**
 * Nouvel envoi à la caisse : avec `client`, la caisse s'ouvre sur ses colis
 * (un client qui revient dans le même conteneur garde son envoi) ; sans
 * client, sur l'étape Client.
 */
export function ouvrirCaisse(router, client = null) {
  if (client) {
    try {
      window.sessionStorage.setItem(DEPOT_CAISSE, JSON.stringify(client));
    } catch {
      /* stockage indisponible : la caisse s'ouvrira sur l'étape Client */
    }
    window.dispatchEvent(new CustomEvent("recherche:depot", { detail: DEPOT_CAISSE }));
  }
  router.push(client ? "/admin/caisse/commande" : "/admin/caisse/client");
}

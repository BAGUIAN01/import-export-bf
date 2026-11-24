// lib/tarifs-article.js : lecture et contrôle du corps d'un article (fonction pure).
import { ICONES } from "@/lib/caisse/icones";

/**
 * Corps de POST/PUT d'un article → { data } ou { erreur }.
 * `partiel` : PUT (seuls les champs présents sont pris).
 */
export function lireArticle(body, { partiel = false } = {}) {
  const data = {};
  const present = (k) => body[k] !== undefined;

  if (!partiel || present("nom")) {
    const nom = String(body.nom ?? "").trim();
    if (!nom) return { erreur: "Donnez un nom à l'article." };
    data.nom = nom;
  }
  if (!partiel || present("familleId")) {
    if (!body.familleId) return { erreur: "Choisissez une famille." };
    data.familleId = String(body.familleId);
  }
  if (!partiel || present("prix")) {
    const prix = Number(String(body.prix ?? 0).replace(",", "."));
    if (!Number.isFinite(prix) || prix < 0) return { erreur: "Le prix doit être un nombre positif." };
    data.prix = Math.round(prix * 100) / 100;
  }
  if (present("detail")) data.detail = String(body.detail ?? "").trim() || null;
  if (present("code")) data.code = String(body.code ?? "").trim().toUpperCase() || "OTHER";
  else if (!partiel) data.code = "OTHER";
  if (present("surDevis")) data.surDevis = !!body.surDevis;
  if (present("frequent")) data.frequent = !!body.frequent;
  if (present("proposeCaisse")) data.proposeCaisse = !!body.proposeCaisse;
  if (present("icone")) data.icone = ICONES[body.icone] ? body.icone : null;
  if (present("ordre")) data.ordre = parseInt(body.ordre, 10) || 0;
  return { data };
}
